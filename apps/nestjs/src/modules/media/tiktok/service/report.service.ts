import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TiktokAdvertiserService } from "./advertiser.service";
import { PrismaService } from "@prismaService";
import { TiktokReportDto } from "../dto/tik-report.dto";
import { TiktokReport } from "../interface/tik-report.interface";

@Injectable()
export class TikTokReportService {
  private readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  private readonly logger = new Logger(TikTokReportService.name);

  constructor(
    private readonly http: HttpService,
    private readonly advertiser: TiktokAdvertiserService,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<string | null> {
    const advertiserIds = await this.advertiser.fetchAdvertiserLogs();
    this.logger.log("取得したAdvertiser IDs: " + JSON.stringify(advertiserIds));

    if (!advertiserIds || advertiserIds.length === 0) {
      this.logger.warn("No advertiser IDs found");
      return null;
    }

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
        start_date: "2025-02-01",
        end_date: "2025-02-18",
        primary_status: "STATUS_ALL",
        page: 1,
        page_size: 1000,
      };

      try {
        const response = await firstValueFrom(
          this.http.get<{ data: { list: TiktokReportDto[] } }>(this.apiUrl, {
            params,
            headers,
          }),
        );
        const list = response.data?.data?.list;

        if (list?.length > 0) {
          for (const dto of list) {
            const record: TiktokReport = this.convertDtoToEntity(dto);
            await this.prisma.tiktoklog.create({ data: record });
            this.logger.log(
              `✅ ${record.adId} を DB に保存しました (advertiser_id: ${advertiserId})`,
            );
          }
        } else {
          this.logger.warn(`listが空です (advertiser_id: ${advertiserId})`);
        }
      } catch (error) {
        this.logger.error(
          `❌ APIリクエストエラー (advertiser_id: ${advertiserId})`,
          error,
        );
      }
    }

    return null;
  }

  private convertDtoToEntity(dto: TiktokReportDto): TiktokReport {
    return {
      advertiserId: Number(dto.metrics.advertiser_id),
      adId: Number(dto.dimensions.ad_id),
      statTimeDay: dto.dimensions.stat_time_day,
      budget: Number(dto.metrics.budget),
      spend: Number(dto.metrics.spend),
      impressions: Number(dto.metrics.impressions),
      clicks: Number(dto.metrics.clicks),
      videoPlayActions: Number(dto.metrics.video_play_actions),
      videoWatched2s: Number(dto.metrics.video_watched_2s),
      videoWatched6s: Number(dto.metrics.video_watched_6s),
      videoViewsP100: Number(dto.metrics.video_views_p100),
      reach: Number(dto.metrics.reach),
      conversion: Number(dto.metrics.conversion),
      campaignId: Number(dto.metrics.campaign_id),
      campaignName: dto.metrics.campaign_name,
      adgroupId: Number(dto.metrics.adgroup_id),
      adgroupName: dto.metrics.adgroup_name,
      adName: dto.metrics.ad_name,
      adUrl: dto.metrics.ad_url,
      statTimeDayDimension: dto.dimensions.stat_time_day,
      adIdDimension: dto.dimensions.ad_id,
    };
  }
}
