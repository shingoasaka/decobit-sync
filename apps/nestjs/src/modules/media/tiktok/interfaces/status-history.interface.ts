/**
 * ステータス履歴エンティティのベースインターフェース
 * ステータス変更の履歴を記録するための共通項目。
 */
export interface TikTokStatusHistoryBase {
  /** 社内アカウントID */
  ad_account_id: number;
  /** プラットフォーム広告主ID */
  ad_platform_account_id: string;
  /** 操作ステータス */
  operation_status: string;
  /** セカンダリステータス */
  secondary_status: string;
  /** レコード作成日時 */
  created_at: Date;
}

/**
 * Ad用のステータス履歴エンティティ
 * 広告単位のステータス変更履歴。
 */
export interface TikTokAdStatusHistory extends TikTokStatusHistoryBase {
  /** 広告ID */
  platform_ad_id: string;
}

/**
 * AdGroup用のステータス履歴エンティティ
 * 広告グループ単位のステータス変更履歴。
 */
export interface TikTokAdgroupStatusHistory extends TikTokStatusHistoryBase {
  /** 広告グループID */
  platform_adgroup_id: string;
}

/**
 * Campaign用のステータス履歴エンティティ
 * キャンペーン単位のステータス変更履歴。
 */
export interface TikTokCampaignStatusHistory extends TikTokStatusHistoryBase {
  /** キャンペーンID */
  platform_campaign_id: string;
}
