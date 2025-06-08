import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { TikTokAdgroupRepository } from "../repositories/report-adgroup.repository";
import { TikTokAdgroupReport } from "../interfaces/report-adgroup.interface";
import { TikTokReportDto } from "../dtos/tiktok-report.dto";
import { getNowJstForDB } from "src/libs/date-utils";
import { TikTokAccountService } from "./account.service";
import { PrismaService } from "@prismaService";
import { TikTokReportBase } from "../base/tiktok-report.base";
import { MediaError, ErrorType, ERROR_CODES } from "../../common/errors/media.error";
import { ERROR_MESSAGES } from "../../common/errors/media.error";

@Injectable()
export class TikTokAdgroupReportService extends TikTokReportBase {
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";

  constructor(
    private readonly adgroupRepository: TikTokAdgroupRepository,
    http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
    private readonly prisma: PrismaService,
  ) {
    super(http, TikTokAdgroupReportService.name);
  }

  async saveReports(reports?: TikTokAdgroupReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug("処理対象のデータがありません");
      return 0;
    }

    try {
      const savedCount = await this.adgroupRepository.save(reports);
      this.logInfo(`✅ ${savedCount} 件のアドグループレポートを保存しました`);
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
      const advertiserIds = await this.tikTokAccountService.getAccountIds();

      if (!advertiserIds || advertiserIds.length === 0) {
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

      for (const advertiserId of advertiserIds) {
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const params = {
            advertiser_ids: JSON.stringify([advertiserId]),
            report_type: "BASIC",
            dimensions: JSON.stringify(["adgroup_id", "stat_time_day"]),
            metrics: JSON.stringify([
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
              "adgroup_name",
            ]),
            data_level: "AUCTION_ADGROUP",
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
              const records: TikTokAdgroupReport[] = list.map(
                (dto: TikTokReportDto) =>
                  this.convertDtoToEntity(dto, accountIdMap),
              );

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
    dto: TikTokReportDto,
    accountIdMap: Map<string, number>,
  ): TikTokAdgroupReport {
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
      platform_adgroup_id: this.safeBigInt(dto.dimensions.adgroup_id),
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
