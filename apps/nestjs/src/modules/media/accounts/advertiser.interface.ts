// 1. 共通のDBテーブル用インターフェース
export interface AdAccounts {
  id?: number;
  name: string;
  ad_platform_account_id: string;
  ad_platform_id: number;
  department_id: number | null;
  project_id: number | null;
  created_at?: Date;
  updated_at?: Date;
}

// 2. 各媒体のAPIレスポンス全体の型
export interface TikTokApiResponse {
  data: {
    list: TikTokResponseData[];
  };
}

// 3. 各媒体の広告アカウントの型
export interface TikTokResponseData {
  advertiser_id: string;
  advertiser_name: string;
}

// 4. APIパラメータの型
export interface TikTokApiParams {
  app_id: string; // アプリケーションID
  secret: string; // シークレットキー
}
