export interface TikTokAdReport {
  ad_account_id: number;
  ad_platform_account_id: string;
  platform_campaign_id: bigint;
  platform_campaign_name: string | null;
  platform_adgroup_id: bigint;
  platform_adgroup_name: string | null;
  platform_ad_id: bigint;
  platform_ad_name: string | null;
  ad_url: string | null;
  stat_time_day: Date;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  video_play_actions: number;
  video_watched_2s: number;
  video_watched_6s: number;
  video_views_p100: number;
  reach: number;
  conversion: number;
  created_at: Date;
}
