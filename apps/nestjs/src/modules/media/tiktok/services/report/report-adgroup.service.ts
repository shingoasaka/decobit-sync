import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { GenericReportService, ReportConfig } from "./generic-report.service";
import { TikTokAccountService } from "../account.service";
import { TikTokAdgroupRepository } from "../../repositories/report/report-adgroup.repository";
import { DataMapper } from "../../utils/data-mapper.util";
import { TikTokAdgroupReportDto } from "../../dtos/tiktok-report.dto";
import { TikTokAdgroupReport } from "../../interfaces/report.interface";
import { TikTokAdgroupStatusItem } from "../../interfaces/status.interface";
import { TikTokAdgroupStatusHistoryRepository } from "../../repositories/status/status-history-adgroup.repository";
import { TikTokAdgroupStatusHistory } from "../../interfaces/status-history.interface";
import { AdgroupService } from "../../../common/master-data/services/adgroup.service";
import { AdgroupData } from "../../../common/interfaces/master-data.interface";

/**
 * TikTok 広告グループレポートサービス
 * ジェネリックサービスを活用した実装
 */
@Injectable()
export class TikTokAdgroupReportService extends GenericReportService<TikTokAdgroupStatusHistory> {
  // 抽象クラスの必須プロパティ
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  protected readonly statusApiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/adgroup/get/";
  protected readonly statusFields = [
    "adgroup_id",
    "secondary_status",
    "operation_status",
    "modify_time",
  ];

  constructor(
    http: HttpService,
    tikTokAccountService: TikTokAccountService,
    private readonly adgroupRepository: TikTokAdgroupRepository,
    adgroupStatusHistoryRepository: TikTokAdgroupStatusHistoryRepository,
    private readonly adgroupService: AdgroupService, // 共通サービスを注入
  ) {
    super(http, tikTokAccountService, adgroupStatusHistoryRepository);
  }

  /**
   * 広告グループレポート取得・保存
   */
  public async fetchAndInsertLogs(): Promise<number> {
    const config = this.getConfig();
    return super.fetchAndInsertLogs(config);
  }

  /**
   * 設定を取得
   */
  private getConfig(): ReportConfig<
    TikTokAdgroupReport,
    TikTokAdgroupStatusItem,
    TikTokAdgroupReportDto
  > {
    return {
      entityName: "広告グループ",
      idField: "adgroup_id",
      statusApiUrl: this.statusApiUrl,
      statusFields: this.statusFields,
      apiUrl: this.apiUrl,
      metrics: [
        "spend",
        "impressions",
        "clicks",
        "video_play_actions",
        "video_watched_2s",
        "video_watched_6s",
        "video_views_p100",
        "reach",
        "conversion",
        "advertiser_id",
        "adgroup_name",
        "campaign_id", // campaign_idを追加
      ],
      dimensions: ["adgroup_id", "stat_time_day"],
      dataLevel: "AUCTION_ADGROUP",
      requiredMetrics: ["adgroup_name"],
      repository: {
        save: (reports: TikTokAdgroupReport[]) =>
          this.adgroupRepository.save(reports),
        getAccountMapping: (advertiserIds: string[]) =>
          this.adgroupRepository.getAccountMapping(advertiserIds),
      },
      convertDtoToEntity: (dto, accountIdMap, status) =>
        this.convertDtoToEntity(dto, accountIdMap, status),
    };
  }

  /**
   * DTOからエンティティへの変換
   */
  private convertDtoToEntity(
    dto: TikTokAdgroupReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokAdgroupStatusItem,
  ): TikTokAdgroupReport | null {
    const accountId = accountIdMap.get(dto.metrics.advertiser_id);
    if (!accountId) {
      this.logWarn?.(
        `アカウントIDが見つかりません: advertiser=${dto.metrics.advertiser_id}`,
      );
      return null;
    }

    const commonMetrics = DataMapper.convertCommonMetrics(dto.metrics);

    const entity = {
      ...commonMetrics,
      ad_account_id: accountId,
      ad_platform_account_id: dto.metrics.advertiser_id,
      stat_time_day: new Date(dto.dimensions.stat_time_day),
      platform_adgroup_id: this.safeBigInt(dto.dimensions.adgroup_id),
      adgroup_name: dto.metrics.adgroup_name,
    };

    // 共通のAdgroup同期処理を呼び出し
    // campaign_idが取得できる場合のみ同期処理を実行
    if (dto.metrics.campaign_id) {
      const adgroupData: AdgroupData = {
        ad_account_id: accountId,
        platform_adgroup_id: this.safeBigInt(dto.dimensions.adgroup_id),
        adgroup_name: dto.metrics.adgroup_name,
        platform_campaign_id: this.safeBigInt(dto.metrics.campaign_id),
      };

      // 非同期処理を明示的に実行（エラーはキャッチするが処理は継続）
      this.adgroupService
        .syncFromReport("tiktok", [adgroupData])
        .then((result) => {
          if (!result.success) {
            this.logWarn?.(
              `Adgroup同期エラー: adgroup_id=${dto.dimensions.adgroup_id}, error=${result.error}`,
            );
          }
        })
        .catch((error) => {
          this.logWarn?.(
            `Adgroup同期エラー: adgroup_id=${dto.dimensions.adgroup_id}, error=${error.message}`,
          );
        });
    }

    return entity;
  }
}
