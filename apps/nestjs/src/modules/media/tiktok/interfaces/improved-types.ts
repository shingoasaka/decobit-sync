// より厳密な型定義

// メディアレベルを型安全に定義
export type MediaLevel = 'Campaign' | 'AdGroup' | 'Ad';

// IDフィールドを型安全に定義
export type IdField = 'campaign_id' | 'adgroup_id' | 'ad_id';

// ステータスフィールドを型安全に定義
export type StatusField =
  | 'secondary_status'
  | 'operation_status'
  | 'modify_time'
  | 'budget';

// API設定を型安全に定義
export interface ApiConfig {
  readonly baseUrl: string;
  readonly version: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
}

// レポート設定を型安全に定義
export interface ReportApiConfig {
  readonly endpoint: string;
  readonly metrics: readonly string[];
  readonly dimensions: readonly string[];
  readonly dataLevel: MediaLevel;
  readonly requiredMetrics: readonly string[];
}

// ステータスAPI設定を型安全に定義
export interface StatusApiConfig {
  readonly endpoint: string;
  readonly fields: readonly StatusField[];
  readonly batchSize: number;
  readonly delayMs: number;
}

// エンティティ固有の設定を型安全に定義
export interface EntityConfig<TReport, TStatus, TDto> {
  readonly entityName: string;
  readonly idField: IdField;
  readonly reportConfig: ReportApiConfig;
  readonly statusConfig: StatusApiConfig;
  readonly repository: {
    save(reports: TReport[]): Promise<number>;
    getAccountMapping(
      advertiserIds: readonly string[],
    ): Promise<Map<string, number>>;
  };
  readonly converter: {
    dtoToEntity(
      dto: TDto,
      accountIdMap: ReadonlyMap<string, number>,
      status?: TStatus,
    ): TReport | null;
  };
}

// 型安全なメトリクス定義
export interface TypedMetrics {
  readonly advertiser_id: string;
  readonly budget: string;
  readonly spend: string;
  readonly impressions: string;
  readonly clicks: string;
  readonly video_play_actions: string;
  readonly video_watched_2s: string;
  readonly video_watched_6s: string;
  readonly video_views_p100: string;
  readonly reach: string;
  readonly conversion: string;
}

// 型安全なディメンション定義
export interface TypedDimensions {
  readonly stat_time_day: string;
  readonly campaign_id?: string;
  readonly adgroup_id?: string;
  readonly ad_id?: string;
}

// 型安全なDTO定義
export interface TypedReportDto {
  readonly metrics: TypedMetrics;
  readonly dimensions: TypedDimensions;
}

// 型安全なステータスアイテム定義
export interface TypedStatusItem {
  readonly campaign_id?: string;
  readonly adgroup_id?: string;
  readonly ad_id?: string;
  readonly secondary_status?: string;
  readonly operation_status?: string;
  readonly modify_time?: string;
  readonly budget?: string;
}

// 型安全なAPIレスポンス定義
export interface TypedApiResponse<T> {
  readonly code: number;
  readonly message: string;
  readonly request_id: string;
  readonly data: {
    readonly list: readonly T[];
    readonly page_info: {
      readonly page: number;
      readonly page_size: number;
      readonly total_number: number;
      readonly total_page: number;
    };
  };
}

// 型安全なエラー定義
export interface TypedError {
  readonly code: string;
  readonly message: string;
  readonly type: 'API' | 'BUSINESS' | 'VALIDATION';
  readonly details?: Record<string, unknown>;
}

// 型安全な処理結果定義
export interface ProcessingResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: TypedError;
  readonly count: number;
}

// 型安全なバッチ処理設定
export interface BatchConfig {
  readonly size: number;
  readonly delayMs: number;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
}

// 型安全なレート制限設定
export interface RateLimitConfig {
  readonly requestsPerSecond: number;
  readonly burstSize: number;
  readonly windowMs: number;
}

// 具体的なエンティティ型定義
export interface CampaignReport {
  readonly ad_account_id: number;
  readonly platform_campaign_id: bigint;
  readonly campaign_name: string;
  readonly status: string;
  readonly opt_status: string;
  readonly status_updated_time: Date | null;
  readonly is_smart_performance_campaign: boolean;
}

export interface AdgroupReport {
  readonly ad_account_id: number;
  readonly platform_adgroup_id: bigint;
  readonly adgroup_name: string;
  readonly status: string;
  readonly opt_status: string;
  readonly status_updated_time: Date | null;
}

export interface AdReport {
  readonly ad_account_id: number;
  readonly platform_campaign_id: bigint;
  readonly campaign_name: string;
  readonly platform_adgroup_id: bigint;
  readonly adgroup_name: string;
  readonly platform_ad_id: bigint;
  readonly ad_name: string;
  readonly ad_url: string;
  readonly status: string;
  readonly opt_status: string;
  readonly status_updated_time: Date | null;
}

// 型安全な設定全体
export interface CompleteConfig {
  readonly api: ApiConfig;
  readonly batch: BatchConfig;
  readonly rateLimit: RateLimitConfig;
  readonly entities: {
    readonly campaign: EntityConfig<
      CampaignReport,
      TypedStatusItem,
      TypedReportDto
    >;
    readonly adgroup: EntityConfig<
      AdgroupReport,
      TypedStatusItem,
      TypedReportDto
    >;
    readonly ad: EntityConfig<AdReport, TypedStatusItem, TypedReportDto>;
  };
}

// 型安全なファクトリー関数
export function createEntityConfig<TReport, TStatus, TDto>(
  config: EntityConfig<TReport, TStatus, TDto>,
): EntityConfig<TReport, TStatus, TDto> {
  return Object.freeze(config);
}

// 型安全なバリデーション関数
export function validateApiResponse<T>(
  response: unknown,
): response is TypedApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'code' in response &&
    'data' in response &&
    typeof (response as Record<string, unknown>).data === 'object' &&
    (response as Record<string, unknown>).data !== null &&
    typeof (response as Record<string, unknown>).data === 'object' &&
    'list' in
      ((response as Record<string, unknown>).data as Record<string, unknown>)
  );
}

// 型安全なユーティリティ関数
export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}

// 型安全な条件付き型
export type ConditionalType<T, U, V> = T extends U ? V : never;

// 型安全なマッピング型
export type StatusFieldMapping<T> = {
  [K in StatusField]: T;
};

// 型安全なユニオン型
export type MediaLevelOrIdField = MediaLevel | IdField;

// 型安全なタプル型
export type ReportTuple<T> = [T, number, string]; // [data, count, timestamp]
