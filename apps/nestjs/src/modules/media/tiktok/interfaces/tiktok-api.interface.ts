// ============================================================================
// TikTok API 共通インターフェース
// ============================================================================

// ============================================================================
// レポートAPI用インターフェース
// ============================================================================

/**
 * レポートAPI用パラメータ
 */
export interface TikTokReportApiParams {
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

/**
 * レポートAPI用レスポンスデータ
 */
export interface TikTokReportApiResponseData {
  list: any[];
  page_info: TikTokReportPageInfo;
}

/**
 * レポートAPI用ページ情報
 */
export interface TikTokReportPageInfo {
  has_next: boolean;
  total_page?: number;
  total_number?: number;
  page?: number;
  page_size?: number;
}

/**
 * レポートAPI用レスポンス
 */
export interface TikTokReportApiResponse {
  data: TikTokReportApiResponseData;
}

// ============================================================================
// GET API用インターフェース
// ============================================================================

/**
 * GET API用パラメータ
 */
export interface TikTokGetApiParams {
  advertiser_id: string;
  page_size: number;
  page: number;
  fields: string;
}

/**
 * GET API用レスポンス
 */
export interface TikTokGetApiResponse<T> {
  data: {
    list: T[];
    page_info: TikTokPageInfo;
  };
}

// ============================================================================
// 共通インターフェース
// ============================================================================

/**
 * TikTok API用ヘッダー
 */
export interface TikTokApiHeaders extends Record<string, string> {
  "Access-Token": string;
  "Content-Type": string;
}

/**
 * 共通ページ情報インターフェース
 */
export interface TikTokPageInfo {
  total_number: number;
  page: number;
  page_size: number;
  total_page: number;
}
