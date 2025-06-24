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
import { TikTokCampaignStatusItem } from "../../interfaces/status.interface";
import { TikTokCampaignStatusHistoryRepository } from "../../repositories/status/status-history-campaign.repository";
import { TikTokCampaignStatusHistory } from "../../interfaces/status-history.interface";

/**
 * TikTok キャンペーンレポートサービス
 * ジェネリックサービスを活用した実装
 */
@Injectable()
export class TikTokCampaignReportService extends GenericReportService<TikTokCampaignStatusHistory> {
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
  ];

  constructor(
    http: HttpService,
    tikTokAccountService: TikTokAccountService,
    private readonly campaignRepository: TikTokCampaignRepository,
    campaignStatusHistoryRepository: TikTokCampaignStatusHistoryRepository,
  ) {
    super(http, tikTokAccountService, campaignStatusHistoryRepository);
  }

  /**
   * キャンペーンレポート取得・保存
   */
  public async fetchAndInsertLogs(): Promise<number> {
    const config = this.getConfig();
    return super.fetchAndInsertLogs(config);
  }

  /**
   * 設定を取得
   */
  private getConfig(): ReportConfig<
    TikTokCampaignReport,
    TikTokCampaignStatusItem,
    TikTokCampaignReportDto
  > {
    return {
      entityName: "キャンペーン",
      idField: "campaign_id",
      statusApiUrl: this.statusApiUrl,
      statusFields: this.statusFields,
      apiUrl: this.apiUrl,
      metrics: [
        "campaign_budget",
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
        save: this.campaignRepository.save.bind(this.campaignRepository),
        getAccountMapping: this.campaignRepository.getAccountMapping.bind(
          this.campaignRepository,
        ),
      },
      convertDtoToEntity: this.convertDtoToEntity.bind(this),
    };
  }

  /**
   * DTOからエンティティへの変換
   */
  private convertDtoToEntity(
    dto: TikTokCampaignReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokCampaignStatusItem,
  ): TikTokCampaignReport | null {
    const accountId = accountIdMap.get(dto.metrics.advertiser_id);
    if (!accountId) {
      this.logWarn?.(
        `アカウントIDが見つかりません: advertiser=${dto.metrics.advertiser_id}`,
      );
      return null;
    }

    const commonMetrics = DataMapper.convertCampaignMetrics(
      dto.metrics as TikTokCampaignMetrics,
    );

    return {
      ...commonMetrics,
      ad_account_id: accountId,
      ad_platform_account_id: dto.metrics.advertiser_id,
      stat_time_day: new Date(dto.dimensions.stat_time_day),
      platform_campaign_id: this.safeBigInt(dto.dimensions.campaign_id),
      campaign_name: dto.metrics.campaign_name,
    };
  }
}
