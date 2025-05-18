// 広告主の基本情報
export interface AdAccounts {
  id?: number;
  name: string;
  ad_platform_account_id: string;
  ad_platform_id: number;
  department_id: number;
  project_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface TikTokResponseData {
  advertiser_id: string;
  advertiser_name: string;
}
