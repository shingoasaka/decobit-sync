import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { TikTokCampaignReportDto } from "../../dtos/tiktok-report.dto";
import { TikTokAccountService } from "../account.service";
import { TikTokReportBase } from "src/modules/media/tiktok/base/tiktok-report.base";
import { TikTokCampaignRepository } from "src/modules/media/tiktok/repositories/report/report-campaign.repository";
import { TikTokCampaignReport } from "src/modules/media/tiktok/interfaces/report.interface";
import { getNowJstForDB } from "src/libs/date-utils";
import { PrismaService } from "@prismaService";
import {
  MediaError,
  ErrorType,
  ERROR_CODES,
} from "../../../common/errors/media.error";
import { ERROR_MESSAGES } from "../../../common/errors/media.error";

@Injectable()
export class TikTokCampaignReportService extends TikTokReportBase {
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";

  // TODO: ステータスを取得するAPIを作成する

  constructor(
    private readonly campaignRepository: TikTokCampaignRepository,
    http: HttpService,
    private readonly prisma: PrismaService,
    private readonly tikTokAccountService: TikTokAccountService,
  ) {
    super(http, TikTokCampaignReportService.name);
  }

  async saveReports(reports?: TikTokCampaignReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug("処理対象のデータがありません");
      return 0;
    }

    try {
      const savedCount = await this.campaignRepository.save(reports);
      this.logInfo(`✅ ${savedCount} 件のキャンペーンレポートを保存しました`);
      return savedCount;
    } catch (error) {
      throw new MediaError(
        ERROR_MESSAGES.SAVE_ERROR,
        ERROR_CODES.SAVE_ERROR,
        ErrorType.BUSINESS,
        { originalError: error },
      );
    }
  }

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const startTime = Date.now();

      const advertiserIds = await this.tikTokAccountService.getAccountIds();
      if (advertiserIds.length === 0) {
        throw new MediaError(
          ERROR_MESSAGES.NO_ACCOUNT_IDS,
          ERROR_CODES.NO_ACCOUNT_IDS,
          ErrorType.BUSINESS,
        );
      }

      const accountMapping = await this.prisma.adAccount.findMany({
        where: {
          ad_platform_account_id: { in: advertiserIds },
        },
        select: {
          id: true,
          ad_platform_account_id: true,
        },
      });

      const accountIdMap = new Map<string, number>(
        accountMapping.map(
          (acc: { ad_platform_account_id: string; id: number }) => [
            acc.ad_platform_account_id,
            acc.id,
          ],
        ),
      );

      const today = new Date();
      const todayStr = this.formatDate(today);
      this.validateDate(todayStr);

      this.logInfo(`本日(${todayStr})のデータを取得します`);

      const headers = {
        "Access-Token": process.env.TIKTOK_ACCESS_TOKEN!,
        "Content-Type": "application/json",
      };

      let totalSaved = 0;

      for (const advertiserId of advertiserIds) {
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const params = {
            advertiser_ids: JSON.stringify([advertiserId]),
            report_type: "BASIC",
            dimensions: JSON.stringify(["campaign_id", "stat_time_day"]),
            metrics: JSON.stringify([
              "spend",
              "impressions",
              "video_play_actions",
              "video_watched_2s",
              "video_watched_6s",
              "video_views_p100",
              "clicks",
              "reach",
              "conversion",
              "advertiser_id",
              "campaign_name",
            ]),
            data_level: "AUCTION_CAMPAIGN",
            start_date: todayStr,
            end_date: todayStr,
            primary_status: "STATUS_ALL",
            page,
            page_size: 1000,
          };

          try {
            this.logDebug(`APIリクエスト: id=${advertiserId}, page=${page}`);

            const response = await this.makeApiRequest(params, headers);

            const list = response.list ?? [];
            if (list.length > 0) {
              const records: TikTokCampaignReport[] = list.map((dto) => {
                const campaignDto = dto as TikTokCampaignReportDto;
                return this.convertDtoToEntity(campaignDto, accountIdMap);
              });

              const savedCount = await this.saveReports(records);
              totalSaved += savedCount;
            }

            hasNext = response.page_info?.has_next ?? false;
            page += 1;
          } catch (error) {
            this.logError(
              `${ERROR_CODES.API_ERROR} (id=${advertiserId}, page=${page})`,
              error,
            );
            break;
          }
        }
      }

      this.logInfo(`処理完了: 合計 ${totalSaved} 件のレコードを保存しました`);
      return totalSaved;
    } catch (error) {
      if (error instanceof MediaError) {
        throw error;
      }
      throw new MediaError(
        ERROR_MESSAGES.FETCH_ERROR,
        ERROR_CODES.API_ERROR,
        ErrorType.API,
        { originalError: error },
      );
    }
  }

  private convertDtoToEntity(
    dto: TikTokCampaignReportDto,
    accountIdMap: Map<string, number>,
  ): TikTokCampaignReport {
    const now = getNowJstForDB();
    const advertiserId = dto.metrics.advertiser_id;
    const adAccountId = accountIdMap.get(advertiserId);

    if (!adAccountId) {
      this.logWarn(`AdAccount not found for advertiser_id: ${advertiserId}`);
    }

    return {
      ad_account_id: adAccountId ?? 0,
      ad_platform_account_id: advertiserId,
      platform_campaign_id: this.safeBigInt(dto.dimensions.campaign_id),
      campaign_name: dto.metrics.campaign_name,
      stat_time_day: new Date(dto.dimensions.stat_time_day),
      budget: this.parseNumber(dto.metrics.budget),
      spend: this.parseNumber(dto.metrics.spend),
      impressions: this.parseNumber(dto.metrics.impressions),
      clicks: this.parseNumber(dto.metrics.clicks),
      video_play_actions: this.parseNumber(dto.metrics.video_play_actions),
      video_watched_2s: this.parseNumber(dto.metrics.video_watched_2s),
      video_watched_6s: this.parseNumber(dto.metrics.video_watched_6s),
      video_views_p100: this.parseNumber(dto.metrics.video_views_p100),
      reach: this.parseNumber(dto.metrics.reach),
      conversion: this.parseNumber(dto.metrics.conversion),
      created_at: now,
      status: "",
      opt_status: "",
      status_updated_time: now,
      is_smart_performance_campaign: false,
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
