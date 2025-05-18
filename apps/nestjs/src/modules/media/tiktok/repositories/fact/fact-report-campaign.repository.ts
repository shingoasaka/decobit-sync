import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokRawReportCampaign } from "../../interface/tiktok-report.interface";

@Injectable()
export class FactCampaignReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertMany(reports: TikTokRawReportCampaign[]): Promise<number> {
    if (!reports?.length) return 0;

    const operations = reports.map((report) => {
      const data = {
        advertiser_id: report.advertiser_id,
        campaign_id: report.campaign_id,
        stat_time_day: report.stat_time_day!,
        spend: report.spend,
        impressions: report.impressions,
        clicks: report.clicks,
        video_play_actions: report.video_play_actions,
        video_watched_2s: report.video_watched_2s,
        video_watched_6s: report.video_watched_6s,
        video_views_p100: report.video_views_p100,
        reach: report.reach,
        campaign_name: report.campaign_name,
      };

      return this.prisma.TiktokFactReportCampaign.upsert({
        where: {
          stat_time_day_campaign_id: {
            stat_time_day: report.stat_time_day!,
            campaign_id: report.campaign_id,
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
