import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokRawReportAd } from "../../interface/tiktok-report.interface";

@Injectable()
export class FactAdReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertMany(reports: TikTokRawReportAd[]): Promise<number> {
    if (!reports?.length) return 0;

    const operations = reports.map((report) => {
      const data = {
        advertiser_id: report.advertiser_id,
        campaign_id: report.campaign_id,
        adgroup_id: report.adgroup_id,
        ad_id: report.ad_id,
        stat_time_day: report.stat_time_day!,
        budget: report.budget,
        spend: report.spend,
        impressions: report.impressions,
        clicks: report.clicks,
        video_play_actions: report.video_play_actions,
        video_watched_2s: report.video_watched_2s,
        video_watched_6s: report.video_watched_6s,
        video_views_p100: report.video_views_p100,
        reach: report.reach,
        campaign_name: report.campaign_name,
        adgroup_name: report.adgroup_name,
        ad_name: report.ad_name,
        ad_url: report.ad_url,
      };

      return this.prisma.TiktokFactReportAd.upsert({
        where: {
          stat_time_day_ad_id: {
            stat_time_day: report.stat_time_day!,
            ad_id: report.ad_id,
          },
        },
        create: data,
        update: { ...data, updated_at: new Date() },
      });
    });

    await this.prisma.$transaction(operations);
    return reports.length;
  }
}
