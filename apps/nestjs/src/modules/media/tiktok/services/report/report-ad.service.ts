import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { GenericReportService, ReportConfig } from "./generic-report.service";
import { TikTokAccountService } from "../account.service";
import { TikTokAdRepository } from "../../repositories/report/report-ad.repository";
import { DataMapper } from "../../utils/data-mapper.util";
import { TikTokAdReportDto } from "../../dtos/tiktok-report.dto";
import { TikTokAdReport } from "../../interfaces/report.interface";
import { TikTokAdStatusItem } from "../../interfaces/status.interface";
import { TikTokAdStatusHistoryRepository } from "../../repositories/status/status-history-ad.repository";
import { TikTokAdStatusHistory } from "../../interfaces/status-history.interface";
import { AdService } from "../../../common/master-data/services/ad.service";
import { AdData } from "../../../common/interfaces/master-data.interface";

/**
 * TikTok 広告レポートサービス
 * ジェネリックサービスを活用した実装
 */
@Injectable()
export class TikTokAdReportService extends GenericReportService<TikTokAdStatusHistory> {
  // 抽象クラスの必須プロパティ
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  protected readonly statusApiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/ad/get/";
  protected readonly statusFields = [
    "ad_id",
    "secondary_status",
    "operation_status",
    "modify_time",
  ];

  constructor(
    http: HttpService,
    tikTokAccountService: TikTokAccountService,
    private readonly adRepository: TikTokAdRepository,
    adStatusHistoryRepository: TikTokAdStatusHistoryRepository,
    private readonly adService: AdService, // 共通サービスを注入
  ) {
    super(http, tikTokAccountService, adStatusHistoryRepository);
  }

  /**
   * 広告レポート取得・保存
   */
  public async fetchAndInsertLogs(): Promise<number> {
    const config = this.getConfig();
    return super.fetchAndInsertLogs(config);
  }

  /**
   * 設定を取得
   */
  private getConfig(): ReportConfig<
    TikTokAdReport,
    TikTokAdStatusItem,
    TikTokAdReportDto
  > {
    return {
      entityName: "広告",
      idField: "ad_id",
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
        "campaign_id",
        "campaign_name",
        "adgroup_id",
        "adgroup_name",
        "ad_name",
        "ad_url",
      ],
      dimensions: ["ad_id", "stat_time_day"],
      dataLevel: "AUCTION_AD",
      requiredMetrics: ["ad_name"],
      repository: {
        save: (reports: TikTokAdReport[]) => this.adRepository.save(reports),
        getAccountMapping: (advertiserIds: string[]) =>
          this.adRepository.getAccountMapping(advertiserIds),
      },
      convertDtoToEntity: (dto, accountIdMap, status) =>
        this.convertDtoToEntity(dto, accountIdMap, status),
    };
  }

  /**
   * DTOからエンティティへの変換
   */
  private convertDtoToEntity(
    dto: TikTokAdReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokAdStatusItem,
  ): TikTokAdReport | null {
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
      platform_campaign_id: dto.metrics.campaign_id,
      campaign_name: dto.metrics.campaign_name,
      platform_adgroup_id: dto.metrics.adgroup_id,
      adgroup_name: dto.metrics.adgroup_name,
      platform_ad_id: dto.dimensions.ad_id,
      ad_name: dto.metrics.ad_name,
      ad_url: dto.metrics.ad_url,
    };

    // 共通のAd同期処理を呼び出し
    // 型安全な変換
    const adData: AdData = {
      ad_account_id: accountId,
      platform_ad_id: dto.dimensions.ad_id,
      ad_name: dto.metrics.ad_name,
      platform_adgroup_id: dto.metrics.adgroup_id,
    };

    // 非同期処理を明示的に実行（エラーはキャッチするが処理は継続）
    this.adService
      .syncFromReport("tiktok", [adData])
      .then((result) => {
        if (!result.success) {
          this.logWarn?.(
            `Ad同期エラー: ad_id=${dto.dimensions.ad_id}, error=${result.error}`,
          );
        }
      })
      .catch((error) => {
        this.logWarn?.(
          `Ad同期エラー: ad_id=${dto.dimensions.ad_id}, error=${error.message}`,
        );
      });

    return entity;
  }
}
