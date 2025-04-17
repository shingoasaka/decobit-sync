export class TiktokReportDto {
  metrics: {
    advertiser_id: string;
    budget: string;
    spend: string;
    impressions: string;
    clicks: string;
    video_play_actions: string;
    video_watched_2s: string;
    video_watched_6s: string;
    video_views_p100: string;
    reach: string;
    conversion: string;
    campaign_id: string;
    campaign_name: string;
    adgroup_id: string;
    adgroup_name: string;
    ad_name: string;
    ad_url: string;
  };
  dimensions: {
    ad_id: string;
    stat_time_day: string;
  };
}
