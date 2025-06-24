/**
 * ステータス履歴エンティティのベースインターフェース
 * ステータス変更の履歴を記録するための共通項目。
 */
export interface TikTokStatusHistoryBase {
  /** 社内アカウントID */
  ad_account_id: number;
  /** プラットフォーム広告主ID */
  ad_platform_account_id: string;
  /** ステータス変更日時 */
  status_updated_time: Date;
  /** サブステータス（例: ACTIVE, PAUSED など） */
  status: string;
  /** 運用ステータス（例: ENABLED, DISABLED など） */
  opt_status: string;
  /** レコード作成日時 */
  created_at: Date;
}

/**
 * Ad用のステータス履歴エンティティ
 * 広告単位のステータス変更履歴。
 */
export interface TikTokAdStatusHistory extends TikTokStatusHistoryBase {
  /** 広告ID */
  platform_ad_id: bigint;
}

/**
 * AdGroup用のステータス履歴エンティティ
 * 広告グループ単位のステータス変更履歴。
 */
export interface TikTokAdgroupStatusHistory extends TikTokStatusHistoryBase {
  /** 広告グループID */
  platform_adgroup_id: bigint;
}

/**
 * Campaign用のステータス履歴エンティティ
 * キャンペーン単位のステータス変更履歴。
 */
export interface TikTokCampaignStatusHistory extends TikTokStatusHistoryBase {
  /** キャンペーンID */
  platform_campaign_id: bigint;
}
