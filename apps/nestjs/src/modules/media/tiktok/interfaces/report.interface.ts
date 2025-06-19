// ============================================================================
// TikTok レポート用インターフェース
// ============================================================================

// 共通のベースインターフェース
export interface TikTokReportBase {
  ad_account_id: number;
  ad_platform_account_id: string;
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

// Ad用のインターフェース
export interface TikTokAdReport extends TikTokReportBase {
  platform_campaign_id: bigint;
  campaign_name: string;
  platform_adgroup_id: bigint;
  adgroup_name: string;
  platform_ad_id: bigint;
  ad_name: string;
  ad_url: string;
  status: string;
  opt_status: string;
  status_updated_time: Date;
}

// Adgroup用のインターフェース
export interface TikTokAdgroupReport extends TikTokReportBase {
  platform_adgroup_id: bigint;
  adgroup_name: string;
  status: string;
  opt_status: string;
  status_updated_time: Date;
}

// Campaign用のインターフェース
export interface TikTokCampaignReport extends TikTokReportBase {
  platform_campaign_id: bigint;
  campaign_name: string;
  status: string;
  opt_status: string;
  status_updated_time: Date;
  is_smart_performance_campaign: boolean;
}

// APIレスポンス用のDTO
export interface TikTokReportDto {
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
    campaign_id?: string;
    campaign_name?: string;
    adgroup_id?: string;
    adgroup_name?: string;
    ad_name?: string;
    ad_url?: string;
  };
  dimensions: {
    stat_time_day: string;
    ad_id?: string;
    adgroup_id?: string;
    campaign_id?: string;
  };
}
