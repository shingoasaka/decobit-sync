import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { TikTokReportDto } from "../dtos/tiktok-report.dto";
import { TikTokAdReport } from "../interfaces/report-ad.interface";
import { getNowJstForDB } from "src/libs/date-utils";
import { TikTokAdRepository } from "../repositories/report-ad.repository";
import { TikTokAccountService } from "./account.service";
import { PrismaService } from "@prismaService";
import { TikTokReportBase } from "../base/tiktok-report.base";
import {
  MediaError,
  ErrorType,
  ERROR_CODES,
} from "../../common/errors/media.error";
import { ERROR_MESSAGES } from "../../common/errors/media.error";

@Injectable()
export class TikTokAdReportService extends TikTokReportBase {
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";

  constructor(
    private readonly adRepository: TikTokAdRepository,
    http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
    private readonly prisma: PrismaService,
  ) {
    super(http, TikTokAdReportService.name);
  }

  public async saveReports(reports: TikTokAdReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug("処理対象のデータがありません");
      return 0;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const batchSize = 1000;
        let totalSaved = 0;

        for (let i = 0; i < reports.length; i += batchSize) {
          const batch = reports.slice(i, i + batchSize);
          const result = await tx.tikTokRawReportAd.createMany({
            data: batch,
            skipDuplicates: true,
          });
          totalSaved += result.count;
        }

        this.logInfo(`✅ ${totalSaved} 件の広告レポートを保存しました`);
        return totalSaved;
      });
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

      const accountIdMap = new Map(
        accountMapping.map((acc) => [acc.ad_platform_account_id, acc.id]),
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
      const metrics = [
        "budget",
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
      ];

      const dimensions = ["ad_id", "stat_time_day"];

      this.validateMetrics(metrics);
      this.validateDimensions(dimensions);

      for (const advertiserId of advertiserIds) {
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const params = {
            advertiser_ids: JSON.stringify([advertiserId]),
            report_type: "BASIC",
            dimensions: JSON.stringify(dimensions),
            metrics: JSON.stringify(metrics),
            data_level: "AUCTION_AD",
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
              const records: TikTokAdReport[] = list.map(
                (dto: TikTokReportDto) =>
                  this.convertDtoToEntity(dto, accountIdMap),
              );

              const savedCount = await this.saveReports(records);
              totalSaved += savedCount ?? 0;
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
    dto: TikTokReportDto,
    accountIdMap: Map<string, number>,
  ): TikTokAdReport {
    const now = getNowJstForDB();
    const advertiserId =
      dto.dimensions.advertiser_id ?? dto.metrics.advertiser_id;
    const adAccountId = accountIdMap.get(advertiserId);

    if (!adAccountId) {
      this.logWarn(`AdAccount not found for advertiser_id: ${advertiserId}`);
    }

    return {
      ad_account_id: adAccountId ?? 0,
      ad_platform_account_id: advertiserId,
      platform_campaign_id: this.safeBigInt(dto.metrics.campaign_id),
      platform_campaign_name: dto.metrics.campaign_name,
      platform_adgroup_id: this.safeBigInt(dto.metrics.adgroup_id),
      platform_adgroup_name: dto.metrics.adgroup_name,
      platform_ad_id: this.safeBigInt(dto.dimensions.ad_id),
      platform_ad_name: dto.metrics.ad_name,
      ad_url: dto.metrics.ad_url,
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
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
