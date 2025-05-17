export interface TikTokRawReportAd {
  advertiser_id: string;
  ad_id: string;
  stat_time_day: string;
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
  campaign_id: string;
  campaign_name: string;
  adgroup_id: string;
  adgroup_name: string;
  ad_name: string;
  ad_url: string;
  stat_time_day_dim: string;
  ad_id_dim: string;
}
export interface TikTokRawReportAdgroup {
  stat_time_day: string;
  advertiser_id: string;
  adgroup_id: string;
  adgroup_name: string;
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
  stat_time_day_dim: string;
  created_at: Date;
}

export interface TikTokRawReportCampaign {
  stat_time_day: string;
  advertiser_id: string;
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  video_play_actions: number;
  video_watched_2s: number;
  video_watched_6s: number;
  video_views_p100: number;
  reach: number;
  conversion: number;
  stat_time_day_dim: string;
  created_at: Date;
}

export interface TiktokFactReportAd {
  advertiser_id: string;
  ad_id: string;
  adgroup_id: string;
  campaign_id: string;
  stat_time_day?: string;
  budget?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
  video_play_actions?: number;
  video_watched_2s?: number;
  video_watched_6s?: number;
  video_views_p100?: number;
  reach?: number;
  campaign_name?: string;
  adgroup_name?: string;
  ad_name?: string;
  ad_url?: string;
  created_at: Date;
  updated_at: Date;
}
export interface TiktokFactReportAdgroup {
  advertiser_id: string;
  ad_id: string;
  adgroup_id: string;
  campaign_id: string;
  stat_time_day?: string;
  budget?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
  video_play_actions?: number;
  video_watched_2s?: number;
  video_watched_6s?: number;
  video_views_p100?: number;
  reach?: number;
  campaign_name?: string;
  adgroup_name?: string;
  ad_name?: string;
  ad_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TiktokFactReportCampaign {
  advertiser_id: string;
  ad_id: string;
  adgroup_id: string;
  campaign_id: string;
  stat_time_day?: string;
  budget?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
  video_play_actions?: number;
  video_watched_2s?: number;
  video_watched_6s?: number;
  video_views_p100?: number;
  reach?: number;
  campaign_name?: string;
  adgroup_name?: string;
  ad_name?: string;
  ad_url?: string;
  created_at: Date;
  updated_at: Date;
}
