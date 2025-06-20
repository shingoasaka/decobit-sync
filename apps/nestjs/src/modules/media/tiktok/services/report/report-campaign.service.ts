import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { GenericReportService, ReportConfig } from "./generic-report.service";
import { TikTokAccountService } from "../account.service";
import { TikTokCampaignRepository } from "../../repositories/report/report-campaign.repository";
import { DataMapper } from "../../utils/data-mapper.util";
import {
  TikTokCampaignReportDto,
  TikTokCampaignMetrics,
} from "../../dtos/tiktok-report.dto";
import { TikTokCampaignReport } from "../../interfaces/report.interface";
import { TikTokCampaignStatusItem } from "../../interfaces/status-response.interface";

/**
 * TikTok キャンペーンレポートサービス
 * ジェネリックサービスを活用した実装
 */
@Injectable()
export class TikTokCampaignReportService extends GenericReportService {
  // 抽象クラスの必須プロパティ
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  protected readonly statusApiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/campaign/get/";
  protected readonly statusFields = [
    "campaign_id",
    "secondary_status",
    "operation_status",
    "modify_time",
    "budget",
  ];

  constructor(
    http: HttpService,
    tikTokAccountService: TikTokAccountService,
    private readonly campaignRepository: TikTokCampaignRepository,
  ) {
    super(http, tikTokAccountService);
  }

  /**
   * キャンペーンレポート取得・保存
   */
  public async fetchAndInsertLogs(): Promise<number> {
    const config: ReportConfig<
      TikTokCampaignReport,
      TikTokCampaignStatusItem,
      TikTokCampaignReportDto
    > = {
      entityName: "キャンペーン",
      idField: "campaign_id",
      statusApiUrl:
        "https://business-api.tiktok.com/open_api/v1.3/campaign/get/",
      statusFields: [
        "campaign_id",
        "secondary_status",
        "operation_status",
        "modify_time",
        "budget",
      ],
      apiUrl:
        "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/",
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
        "campaign_name",
      ],
      dimensions: ["campaign_id", "stat_time_day"],
      dataLevel: "AUCTION_CAMPAIGN",
      requiredMetrics: ["campaign_name"],
      repository: {
        save: (reports: TikTokCampaignReport[]) =>
          this.campaignRepository.save(reports),
        getAccountMapping: (advertiserIds: string[]) =>
          this.campaignRepository.getAccountMapping(advertiserIds),
      },
      convertDtoToEntity: (dto, accountIdMap, status) =>
        this.convertDtoToEntity(dto, accountIdMap, status),
    };

    return super.fetchAndInsertLogs(config);
  }

  /**
   * レポート保存
   */
  public async saveReports(reports: TikTokCampaignReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug("処理対象のデータがありません");
      return 0;
    }

    try {
      const savedCount = await this.campaignRepository.save(reports);
      this.logInfo(`✅ ${savedCount} 件のキャンペーンレポートを保存しました`);
      return savedCount;
    } catch (error) {
      this.logError("キャンペーンレポートの保存に失敗しました", error);
      throw error;
    }
  }

  /**
   * DTOからエンティティへの変換
   */
  private convertDtoToEntity(
    dto: TikTokCampaignReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokCampaignStatusItem,
  ): TikTokCampaignReport | null {
    const accountId = this.getAccountId(
      dto.metrics.advertiser_id,
      accountIdMap,
    );
    if (accountId === null) {
      return null;
    }

    const commonMetrics = DataMapper.convertCommonMetrics(
      dto.metrics as TikTokCampaignMetrics,
    );
    const statusFields = DataMapper.convertStatusFields(status);

    return {
      ...commonMetrics,
      ad_account_id: accountId,
      ad_platform_account_id: dto.metrics.advertiser_id,
      stat_time_day: new Date(dto.dimensions.stat_time_day),
      ...statusFields,
      platform_campaign_id: this.safeBigInt(dto.dimensions.campaign_id),
      campaign_name: dto.metrics.campaign_name,
      is_smart_performance_campaign:
        status?.is_smart_performance_campaign ?? false,
    };
  }
}
