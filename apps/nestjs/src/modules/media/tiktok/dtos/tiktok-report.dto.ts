// 共通のメトリクス
export interface TikTokMetrics {
  budget: string;
  advertiser_id: string;
  spend: string;
  impressions: string;
  clicks: string;
  video_play_actions: string;
  video_watched_2s: string;
  video_watched_6s: string;
  video_views_p100: string;
  reach: string;
  conversion: string;
}

// Ad用のメトリクス
export interface TikTokAdMetrics extends TikTokMetrics {
  campaign_id: string;
  campaign_name: string;
  adgroup_id: string;
  adgroup_name: string;
  ad_name: string;
  ad_url: string;
}

// Adgroup用のメトリクス
export interface TikTokAdgroupMetrics extends TikTokMetrics {
  adgroup_name: string;
}

// Campaign用のメトリクス
export interface TikTokCampaignMetrics extends TikTokMetrics {
  campaign_name: string;
  campaign_budget: string;
}

// 共通のディメンション
interface BaseDimensions {
  stat_time_day: string;
}

// Ad用のディメンション
interface AdDimensions extends BaseDimensions, Record<string, string> {
  ad_id: string;
}

// Adgroup用のディメンション
interface AdgroupDimensions extends BaseDimensions, Record<string, string> {
  adgroup_id: string;
}

// Campaign用のディメンション
interface CampaignDimensions extends BaseDimensions, Record<string, string> {
  campaign_id: string;
}

// 各レポートタイプ用のDTO
export interface TikTokAdReportDto {
  metrics: TikTokAdMetrics;
  dimensions: AdDimensions;
}

export interface TikTokAdgroupReportDto {
  metrics: TikTokAdgroupMetrics;
  dimensions: AdgroupDimensions;
}

export interface TikTokCampaignReportDto {
  metrics: TikTokCampaignMetrics;
  dimensions: CampaignDimensions;
}

// ユニオン型として定義
export type TikTokReportDto =
  | TikTokAdReportDto
  | TikTokAdgroupReportDto
  | TikTokCampaignReportDto;
