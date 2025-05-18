import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { MediaAdvertiserService } from "../../../accounts/advertiser.service";
import { MediaAdvertiserRepository } from "../../../accounts/advertiser.repository";
import { TikTokRawReportCampaign } from "../../interface/tiktok-report.interface";
import { TikTokReportCampaignRepository } from "../../repositories/report/tiktok-report-campaign.repository";
import { getNowJstForDB } from "src/libs/date-utils";
import { FactCampaignReportService } from "../fact/fact-report-campaign.service";

@Injectable()
export class TikTokReportCampaignService {
  private readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  private readonly logger = new Logger(TikTokReportCampaignService.name);

  constructor(
    private readonly http: HttpService,
    private readonly advertiserService: MediaAdvertiserService,
    private readonly reportRepository: TikTokReportCampaignRepository,
    private readonly factCampaignReportService: FactCampaignReportService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const startTime = Date.now();
      

      // テーブルから広告主IDを取得
      let advertiserIds = await this.advertiserService.getAdvertisersByPlatform(1);
      if (!advertiserIds?.length) {
        this.logger.warn("保存対象の広告主IDがありません");
        return 0;
      }

      const todayStr = this.formatDate(new Date());
      this.logger.log(`本日(${todayStr})のキャンペーンレポートを取得します`);

      let total = 0;
      for (const advertiserId of advertiserIds) {
        const headers = {
          "Access-Token": process.env.TIKTOK_ACCESS_TOKEN,
          "Content-Type": "application/json",
        };
        const params = {
          advertiser_id: advertiserId,
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
          page: 1,
          page_size: 1000,
        };

        try {
          this.logger.log(
            `キャンペーンAPIリクエスト開始 (advertiser_id: ${advertiserId})`,
          );
          const response = await firstValueFrom(
            this.http.get<{ data: { list: any[] } }>(this.apiUrl, {
              params,
              headers,
            }),
          );
          const list = response.data?.data?.list || [];

          if (list?.length > 0) {
            const records: TikTokRawReportCampaign[] = list.map((item) => ({
              advertiser_id: item.metrics.advertiser_id,
              campaign_id: item.dimensions.campaign_id,
              stat_time_day: item.dimensions.stat_time_day,
              spend: this.parseNumber(item.metrics.spend),
              impressions: this.parseNumber(item.metrics.impressions),
              clicks: this.parseNumber(item.metrics.clicks),
              video_play_actions: this.parseNumber(
                item.metrics.video_play_actions,
              ),
              campaign_name: item.metrics.campaign_name,
              video_watched_2s: this.parseNumber(item.metrics.video_watched_2s),
              video_watched_6s: this.parseNumber(item.metrics.video_watched_6s),
              video_views_p100: this.parseNumber(item.metrics.video_views_p100),
              reach: this.parseNumber(item.metrics.reach),
              conversion: this.parseNumber(item.metrics.conversion),
              stat_time_day_dim: item.dimensions.stat_time_day,
              created_at: getNowJstForDB(),
            }));

            const saved = await this.reportRepository.save(records);
            total += saved;
            this.logger.log(
              `✅ ${saved}件のキャンペーンレポートを保存しました`,
            );
            await this.factCampaignReportService.normalize(records);
          } else {
            this.logger.warn(`本日(${todayStr})のキャンペーンレポートが空です`);
          }
        } catch (e) {
          this.logger.error(
            `❌ API取得エラー (advertiser_id: ${advertiserId})`,
            e instanceof Error ? e.stack : String(e),
          );
        }
      }
      const elapsed = (Date.now() - startTime) / 1000;
      this.logger.log(`処理完了: ${total}件を${elapsed}秒で取得・保存しました`);
      return total;
    } catch (e) {
      this.logger.error(
        `❌ キャンペーンレポート取得処理中にエラー`,
        e instanceof Error ? e.stack : String(e),
      );
      throw e;
    }
  }

  private parseNumber(value: string): number {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  private formatDate(dt: Date): string {
    return dt.toISOString().split("T")[0];
  }
}
