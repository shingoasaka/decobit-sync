/**
 * 共通のベースエンティティ
 * すべてのレポートエンティティで共通のDB保存項目。
 * ステータス関連フィールドは別テーブルに分離。
 */
export interface TikTokReportBase {
  /** 社内アカウントID */
  ad_account_id: number;
  /** プラットフォーム広告主ID */
  ad_platform_account_id: string;
  /** 統計日 */
  stat_time_day: Date;
  /** 予算（数値型） */
  budget: number;
  /** 消化金額 */
  spend: number;
  /** インプレッション数 */
  impressions: number;
  /** クリック数 */
  clicks: number;
  /** 動画再生アクション数 */
  video_play_actions: number;
  /** 2秒再生数 */
  video_watched_2s: number;
  /** 6秒再生数 */
  video_watched_6s: number;
  /** 100%再生数 */
  video_views_p100: number;
  /** リーチ数 */
  reach: number;
  /** コンバージョン数 */
  conversion: number;
  /** レコード作成日時 */
  created_at: Date;
}

/**
 * Ad用のエンティティ
 * 広告単位のDB保存項目（ステータス関連フィールドは別テーブル）。
 */
export interface TikTokAdReport extends TikTokReportBase {
  /** キャンペーンID */
  platform_campaign_id: string;
  /** キャンペーン名 */
  campaign_name: string;
  /** 広告グループID */
  platform_adgroup_id: string;
  /** 広告グループ名 */
  adgroup_name: string;
  /** 広告ID */
  platform_ad_id: string;
  /** 広告名 */
  ad_name: string;
  /** 広告URL */
  ad_url: string;
}

/**
 * Adgroup用のエンティティ
 * 広告グループ単位のDB保存項目（ステータス関連フィールドは別テーブル）。
 */
export interface TikTokAdgroupReport extends TikTokReportBase {
  /** 広告グループID */
  platform_adgroup_id: string;
  /** 広告グループ名 */
  adgroup_name: string;
}

/**
 * Campaign用のエンティティ
 * キャンペーン単位のDB保存項目（ステータス関連フィールドは別テーブル）。
 */
export interface TikTokCampaignReport extends TikTokReportBase {
  /** キャンペーンID */
  platform_campaign_id: string;
  /** キャンペーン名 */
  campaign_name: string;
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
