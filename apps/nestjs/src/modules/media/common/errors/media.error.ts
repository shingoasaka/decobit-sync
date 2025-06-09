export enum ErrorType {
  AUTHENTICATION = "AUTHENTICATION",
  API = "API",
  BUSINESS = "BUSINESS",
  VALIDATION = "VALIDATION",
}

export const ERROR_CODES = {
  // 認証関連
  AUTH_TOKEN_MISSING: "AUTH_001",
  AUTH_TOKEN_EXPIRED: "AUTH_002",

  // API関連
  API_ERROR: "API_000",
  API_RATE_LIMIT: "API_001",
  API_TIMEOUT: "API_002",
  API_INVALID_RESPONSE: "API_003",

  // ビジネスロジック
  NO_ACCOUNT_IDS: "BUS_001",
  SAVE_ERROR: "BUS_002",

  // バリデーション
  INVALID_DATE: "VAL_001",
  INVALID_METRICS: "VAL_002",
} as const;

// エラーメッセージの定数
export const ERROR_MESSAGES = {
  // 認証関連
  ACCESS_TOKEN_MISSING: "アクセストークンが設定されていません",

  // API関連
  API_RATE_LIMIT: "APIレート制限に達しました。バックオフ処理を実行します",
  API_TIMEOUT: "APIタイムアウトが発生しました。リトライします",
  API_ERROR: "APIエラーが発生しました",
  INVALID_RESPONSE: "APIレスポンスの形式が不正です",

  // ビジネスロジック
  NO_ACCOUNT_IDS: "広告アカウントIDが見つかりません",
  SAVE_ERROR: "データの保存に失敗しました",
  FETCH_ERROR: "データの取得に失敗しました",

  // バリデーション
  INVALID_DATE: "日付の形式が不正です",
  INVALID_METRICS: "メトリクスの形式が不正です",
  INVALID_DIMENSIONS: "ディメンションの形式が不正です",
  REQUIRED_ID_UNDEFINED: "必須のIDが未定義です",
} as const;

export class MediaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly type: ErrorType,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MediaError";
  }
}
