import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { MediaAdvertiserService } from "../../../accounts/advertiser.service";
import { MediaAdvertiserRepository } from "../../../accounts/advertiser.repository";
import { TikTokRawReportAdgroup } from "../../interface/tiktok-report.interface";
import { TikTokReportAdgroupRepository } from "../../repositories/report/tiktok-report-adgroup.repository";
import { getNowJstForDB } from "src/libs/date-utils";
import { FactAdgroupReportService } from "../fact/fact-report-adgroup.service";
import { TikTokReportDto } from "../../dto/tiktok-report.dto";
@Injectable()
export class TikTokReportAdgroupService {
  private readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  private readonly logger = new Logger(TikTokReportAdgroupService.name);

  constructor(
    private readonly http: HttpService,
    private readonly advertiserService: MediaAdvertiserService,
    private readonly reportRepository: TikTokReportAdgroupRepository,
    private readonly factAdgroupReportService: FactAdgroupReportService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const startTime = Date.now();

      // テーブルから広告主IDを取得
      let advertiserIds =
        await this.advertiserService.getAdvertisersByPlatform(1);

      if (!advertiserIds || advertiserIds.length === 0) {
        this.logger.warn("No advertiser IDs found");
        return 0;
      }

      // 日付範囲を計算 - TikTokは日付単位のAPIなので、今日のデータのみを取得
      // 3分ごとの実行なので、前回の実行から変更があった場合も今日のデータを更新する
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
          start_date: startDate,
          end_date: endDate,
          primary_status: "STATUS_ALL",
          page: 1,
          page_size: 1000,
        };

        try {
          this.logger.log(
            `アドグループAPIリクエスト開始 (advertiser_id: ${advertiserId}, 日付: ${todayStr})`,
          );
          const response = await firstValueFrom(
            this.http.get<{ data: { list: any[] } }>(this.apiUrl, {
              params,
              headers,
            }),
          );
          const list = response.data?.data?.list;

          if (list?.length > 0) {
            const records: TikTokRawReportAdgroup[] = list.map(
              (item: TikTokReportDto) => ({
                adgroup_id: item.dimensions.adgroup_id,
                adgroup_name: item.metrics.adgroup_name,
                advertiser_id: item.metrics.advertiser_id,
                stat_time_day: item.dimensions.stat_time_day,
                budget: this.parseNumber(item.metrics.budget),
                spend: this.parseNumber(item.metrics.spend),
                impressions: this.parseNumber(item.metrics.impressions),
                clicks: this.parseNumber(item.metrics.clicks),
                video_play_actions: this.parseNumber(
                  item.metrics.video_play_actions,
                ),
                video_watched_2s: this.parseNumber(
                  item.metrics.video_watched_2s,
                ),
                video_watched_6s: this.parseNumber(
                  item.metrics.video_watched_6s,
                ),
                video_views_p100: this.parseNumber(
                  item.metrics.video_views_p100,
                ),
                reach: this.parseNumber(item.metrics.reach),
                conversion: this.parseNumber(item.metrics.conversion),
                // 必須フィールドの追加
                stat_time_day_dim: item.dimensions.stat_time_day,
                created_at: getNowJstForDB(),
              }),
            );

            // バッチ処理で一括保存
            const savedCount = await this.reportRepository.save(records);
            totalRecords += savedCount;
            //ファクトテーブル更新
            await this.factAdgroupReportService.normalize(records);

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

  // 文字列を数値に変換（数値に変換できない場合は0を返す）
  private parseNumber(value: string): number {
    const parsedValue = parseFloat(value);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }

  // 日付を YYYY-MM-DD 形式に変換
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
