// 共通のページ情報インターフェース
export interface TikTokPageInfo {
  total_number: number;
  page: number;
  page_size: number;
  total_page: number;
}

// 共通のステータス情報インターフェース
export interface TikTokStatusItem {
  secondary_status: string;
  operation_status: string;
  modify_time: string;
}

// Ad用のステータスアイテム
export interface TikTokAdStatusItem extends TikTokStatusItem {
  ad_id: string;
}

// AdGroup用のステータスアイテム
export interface TikTokAdgroupStatusItem extends TikTokStatusItem {
  adgroup_id: string;
}

// Campaign用のステータスアイテム
export interface TikTokCampaignStatusItem extends TikTokStatusItem {
  campaign_id: string;
  is_smart_performance_campaign: boolean;
}

// 汎用ステータスレスポンスインターフェース
export interface TikTokStatusResponse<T extends TikTokStatusItem> {
  data: {
    list: T[];
    page_info: TikTokPageInfo;
  };
}

// 型エイリアス
export type TikTokAdStatusResponse = TikTokStatusResponse<TikTokAdStatusItem>;
export type TikTokAdgroupStatusResponse = TikTokStatusResponse<TikTokAdgroupStatusItem>;
export type TikTokCampaignStatusResponse = TikTokStatusResponse<TikTokCampaignStatusItem>;
