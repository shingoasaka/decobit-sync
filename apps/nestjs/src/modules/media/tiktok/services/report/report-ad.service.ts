import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TikTokAdvertiserService } from "../advertiser.service";
import { FactAdReportService } from "../fact/fact-report-ad.service";
import { DimExecService } from "../dimensions/dim-exec.service";
import { TikTokReportDto } from "../../dto/tiktok-report.dto";
import { TikTokRawReportAd } from "../../interface/tiktok-report.interface";
import { TikTokReportRepository } from "../../repositories/report/tiktok-report-ad.repository";
import { getNowJstForDB } from "src/libs/date-utils";

@Injectable()
export class TikTokReportService {
  private readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  private readonly logger = new Logger(TikTokReportService.name);

  constructor(
    private readonly http: HttpService,
    private readonly advertiser: TikTokAdvertiserService,
    private readonly reportRepository: TikTokReportRepository,
    private readonly factAdReportService: FactAdReportService,
    private readonly dimExecService: DimExecService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const startTime = Date.now();
      const advertiserIds = await this.advertiser.fetchAdvertiserLogs();

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
            const records: TikTokRawReportAd[] = list.map((dto) =>
              this.convertDtoToEntity(dto),
            );

            // バッチ処理で一括保存
            const savedCount = await this.reportRepository.save(records);
            totalRecords += savedCount;
            //ディメンションテーブル更新
            await this.dimExecService.execute(records);
            //ファクトテーブル更新
            await this.factAdReportService.normalize(records);

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

  private convertDtoToEntity(dto: TikTokReportDto): TikTokRawReportAd {
    const now = getNowJstForDB();
    return {
      advertiser_id: dto.metrics.advertiser_id,
      ad_id: dto.dimensions.ad_id,
      stat_time_day: dto.dimensions.stat_time_day,
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
      campaign_id: dto.metrics.campaign_id,
      campaign_name: dto.metrics.campaign_name,
      adgroup_id: dto.metrics.adgroup_id,
      adgroup_name: dto.metrics.adgroup_name,
      ad_name: dto.metrics.ad_name,
      ad_url: dto.metrics.ad_url,
      stat_time_day_dim: dto.dimensions.stat_time_day,
      ad_id_dim: dto.dimensions.ad_id,
    };
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
