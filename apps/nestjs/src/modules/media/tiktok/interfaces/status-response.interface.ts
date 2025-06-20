import { PageInfo } from './api.interface';

// 共通のステータス情報インターフェース
export interface TikTokStatusItem {
  secondary_status: string;
  operation_status: string;
  modify_time: string;
  budget?: string | number;
}

// Ad用のステータスアイテム
export interface TikTokAdStatusItem extends TikTokStatusItem {
  ad_id: string;
}

// AdGroup用のステータスアイテム
export interface TikTokAdgroupStatusItem extends TikTokStatusItem {
  adgroup_id: string;
  budget: string | number;
}

// Campaign用のステータスアイテム
export interface TikTokCampaignStatusItem extends TikTokStatusItem {
  campaign_id: string;
  budget: string | number;
  is_smart_performance_campaign: boolean;
}

// 汎用ステータスレスポンスインターフェース
export interface TikTokStatusResponse<T extends TikTokStatusItem> {
  data: {
    list: T[];
    page_info: PageInfo;
  };
}
