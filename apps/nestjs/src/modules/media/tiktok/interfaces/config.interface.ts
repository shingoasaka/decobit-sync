// TikTok API設定
export interface ApiConfig {
  baseUrl: string;
  accessToken: string;
  advertiserId: string;
  timeout: number;
}

// バッチ処理設定
export interface BatchConfig {
  batchSize: number;
  delayBetweenBatches: number;
  maxRetries: number;
  retryDelay: number;
}

// レート制限設定
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

// 全体的な設定
export interface TikTokConfig {
  api: ApiConfig;
  batch: BatchConfig;
  rateLimit: RateLimitConfig;
}
