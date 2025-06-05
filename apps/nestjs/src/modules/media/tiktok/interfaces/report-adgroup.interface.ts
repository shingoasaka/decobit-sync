export interface TikTokAdgroupReport {
  ad_account_id: number;
  ad_platform_account_id: string;
  platform_adgroup_id: bigint;
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
