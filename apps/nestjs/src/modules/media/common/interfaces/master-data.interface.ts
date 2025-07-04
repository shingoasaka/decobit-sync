/**
 * マスターデータの共通インターフェース
 * 全媒体共通のCampaign、Adgroup、Adデータ構造を定義
 */

export interface CampaignData {
  ad_account_id: number;
  platform_campaign_id: bigint;
  campaign_name: string;
}

export interface AdgroupData {
  ad_account_id: number;
  platform_adgroup_id: bigint;
  adgroup_name: string;
  platform_campaign_id: bigint; // 関連付け用
}

export interface AdData {
  ad_account_id: number;
  platform_ad_id: bigint;
  ad_name: string;
  platform_adgroup_id: bigint; // 関連付け用
}

/**
 * プラットフォーム種別
 */
export type PlatformType = "tiktok" | "facebook" | "google";

/**
 * 同期結果
 */
export interface SyncResult {
  success: boolean;
  count: number;
  error?: string;
}
