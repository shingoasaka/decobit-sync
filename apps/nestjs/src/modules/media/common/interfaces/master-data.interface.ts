/**
 * マスターデータの共通インターフェース
 * 全媒体共通のCampaign、Adgroup、Adデータ構造を定義
 */

export interface CampaignData {
  ad_account_id: number;
  platform_campaign_id: string; // BigInt → string
  campaign_name: string;
}

export interface AdgroupData {
  ad_account_id: number;
  platform_adgroup_id: string; // BigInt → string
  adgroup_name: string;
  platform_campaign_id: string; // BigInt → string
}

export interface AdData {
  ad_account_id: number;
  platform_ad_id: string; // BigInt → string
  ad_name: string;
  platform_adgroup_id: string; // BigInt → string
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
