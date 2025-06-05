import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TikTokReportDto } from "../dtos/tiktok-report.dto";
import { TikTokAdReport } from "../interfaces/report-ad.interface";
import { getNowJstForDB } from "src/libs/date-utils";
import { TikTokAdRepository } from "../repositories/report-ad.repository";
import { TikTokAccountService } from "./account.service";

@Injectable()
export class TikTokAdReportService {
  private readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  private readonly logger = new Logger(TikTokAdReportService.name);

  constructor(
    private readonly adRepository: TikTokAdRepository,
    private readonly http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
  ) {}

  async saveReports(reports?: TikTokAdReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logger.debug("処理対象のデータがありません");
      return 0;
    }

    try {
      const savedCount = await this.adRepository.save(reports);
      this.logger.log(`✅ ${savedCount} 件の広告レポートを保存しました`);
      return savedCount;
    } catch (error) {
      this.logger.error(
        "広告レポートの保存に失敗しました",
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const startTime = Date.now();

      // テーブルから広告主IDを取得
      const advertiserIds = await this.tikTokAccountService.getAccountIds();

      if (!advertiserIds || advertiserIds.length === 0) {
        this.logger.warn("No advertiser IDs found");
        return 0;
      }

      // 日付範囲を計算 - TikTokは日付単位のAPIなので、今日のデータのみを取得
      const today = new Date();
      const todayStr = this.formatDate(today);

      // 3分ごとの実行なので今日のデータだけを取得
      const startDate = todayStr;
      const endDate = todayStr;

      this.logger.log(`本日(${todayStr})のデータを取得します`);

      let totalRecords = 0;

      for (const advertiserId of advertiserIds) {
        const headers = {
          "Access-Token": process.env.TIKTOK_ACCESS_TOKEN,
          "Content-Type": "application/json",
        };

        const params = {
          advertiser_id: advertiserId,
          report_type: "BASIC",
          dimensions: JSON.stringify(["ad_id", "stat_time_day"]),
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
            "campaign_id",
            "campaign_name",
            "adgroup_id",
            "adgroup_name",
            "ad_name",
            "ad_url",
          ]),
          data_level: "AUCTION_AD",
          start_date: startDate,
          end_date: endDate,
          primary_status: "STATUS_ALL",
          page: 1,
          page_size: 1000,
        };

        try {
          this.logger.log(
            `APIリクエスト開始 (advertiser_id: ${advertiserId}, 日付: ${todayStr})`,
          );
          const response = await firstValueFrom(
            this.http.get<{ data: { list: TikTokReportDto[] } }>(this.apiUrl, {
              params,
              headers,
            }),
          );
          const list = response.data?.data?.list;

          if (list?.length > 0) {
            // DTOからエンティティに変換
            const records: TikTokAdReport[] = list.map((dto: TikTokReportDto) =>
              this.convertDtoToEntity(dto),
            );

            // バッチ処理で一括保存
            const savedCount = await this.saveReports(records);
            totalRecords += savedCount;

            this.logger.log(
              `✅ ${savedCount}件のレコードをDBに保存しました (advertiser_id: ${advertiserId})`,
            );
          } else {
            this.logger.warn(
              `本日(${todayStr})のレポートデータが空です (advertiser_id: ${advertiserId})`,
            );
          }
        } catch (error) {
          this.logger.error(
            `❌ APIリクエストエラー (advertiser_id: ${advertiserId})`,
            error instanceof Error ? error.stack : String(error),
          );
          // 処理は継続
        }
      }

      const processingTime = (Date.now() - startTime) / 1000;
      this.logger.log(
        `処理完了: ${totalRecords}件のデータを${processingTime}秒で取得しました`,
      );

      return totalRecords;
    } catch (error) {
      this.logger.error(
        `❌ TikTokレポート取得処理中にエラーが発生しました`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error(
        `TikTokレポート取得処理に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private convertDtoToEntity(dto: TikTokReportDto): TikTokAdReport {
    const now = getNowJstForDB();
    return {
      ad_account_id: Number(dto.metrics.advertiser_id),
      ad_platform_account_id: dto.metrics.advertiser_id,
      platform_campaign_id: BigInt(dto.metrics.campaign_id),
      platform_campaign_name: dto.metrics.campaign_name,
      platform_adgroup_id: BigInt(dto.metrics.adgroup_id),
      platform_adgroup_name: dto.metrics.adgroup_name,
      platform_ad_id: BigInt(dto.dimensions.ad_id),
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

  private parseNumber(value: string): number {
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
