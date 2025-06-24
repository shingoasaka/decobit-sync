import { PageInfo } from "./api.interface";

/**
 * 共通のステータス情報インターフェース
 * TikTok APIから取得する全てのステータス共通項目。
 */
export interface TikTokStatusItem {
  /** サブステータス（例: ACTIVE, PAUSED など） */
  secondary_status: string;
  /** 運用ステータス（例: ENABLED, DISABLED など） */
  operation_status: string;
  /** ステータスが最後に更新された日時（ISO文字列） */
  modify_time: string;
}

/**
 * Ad用のステータスアイテム
 * 広告単位のステータス情報。
 */
export interface TikTokAdStatusItem extends TikTokStatusItem {
  /** 広告ID */
  ad_id: string;
}

/**
 * AdGroup用のステータスアイテム
 * 広告グループ単位のステータス情報。
 */
export interface TikTokAdgroupStatusItem extends TikTokStatusItem {
  /** 広告グループID */
  adgroup_id: string;
}

/**
 * Campaign用のステータスアイテム
 * キャンペーン単位のステータス情報。
 */
export interface TikTokCampaignStatusItem extends TikTokStatusItem {
  /** キャンペーンID */
  campaign_id: string;
}

/**
 * 汎用ステータスレスポンスインターフェース
 * ステータスAPIのレスポンス型。
 */
export interface TikTokStatusResponse<T extends TikTokStatusItem> {
  data: {
    /** ステータスリスト */
    list: T[];
    /** ページ情報 */
    page_info: PageInfo;
  };
}
