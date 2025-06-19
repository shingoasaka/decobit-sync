// レポートAPI用パラメータ
export interface ReportApiParams {
  advertiser_ids: string;
  report_type: string;
  dimensions: string;
  metrics: string;
  start_date: string;
  end_date: string;
  primary_status: string;
  page: number;
  page_size: number;
  data_level?: string;
}

// レポートAPI用レスポンスデータ
export interface ReportApiResponseData<T = unknown> {
  list: T[];
  page_info: PageInfo;
}

// レポートAPI用レスポンス
export interface ReportApiResponse<T = unknown> {
  data: ReportApiResponseData<T>;
}

// GET API用パラメータ
export interface GetApiParams {
  advertiser_id: string;
  page_size: number;
  page: number;
  fields: string;
}

// GET API用レスポンス
export interface GetApiResponse<T> {
  data: {
    list: T[];
    page_info: PageInfo;
  };
}

// TikTok API用ヘッダー
export interface ApiHeaders extends Record<string, string> {
  "Access-Token": string;
  "Content-Type": string;
}

// 共通ページ情報インターフェース
export interface PageInfo {
  total_number: number;
  page: number;
  page_size: number;
  total_page: number;
  has_next?: boolean;
}
