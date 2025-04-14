import { Injectable, Logger } from "@nestjs/common";

/**
 * ログのレベル
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * 共通ログサービス - 実行ログとエラーを記録
 * （コンソールログのみ、DBには保存しない）
 */
@Injectable()
export class CommonLogService {
  private readonly logger = new Logger(CommonLogService.name);

  constructor() {}

  /**
   * 情報ログを記録
   * @param level ログレベル
   * @param message メッセージ
   * @param serviceName サービス名
   * @param metadata 追加情報（オプション）
   */
  async log(
    level: LogLevel,
    message: string,
    serviceName: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      // コンソールに出力
      switch (level) {
        case "debug":
          this.logger.debug(`[${serviceName}] ${message}`);
          break;
        case "info":
          this.logger.log(`[${serviceName}] ${message}`);
          break;
        case "warn":
          this.logger.warn(`[${serviceName}] ${message}`);
          break;
        case "error":
          this.logger.error(`[${serviceName}] ${message}`);
          break;
      }
    } catch (error) {
      // 万が一ログ自体が失敗してもシステムは止めない
      this.logger.error(
        `ログ記録中にエラーが発生: ${error instanceof Error ? error.message : "不明なエラー"}`,
      );
    }
  }

  /**
   * エラーログを記録（スタックトレースを含む）
   * @param serviceName サービス名
   * @param message エラーメッセージ
   * @param stack スタックトレース（オプション）
   * @param metadata 追加情報（オプション）
   */
  async logError(
    serviceName: string,
    message: string,
    stack?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      // コンソールにエラーを出力
      this.logger.error(`[${serviceName}] ${message}`);
      if (stack) {
        this.logger.debug(stack);
      }

      // 詳細情報（メタデータ）がある場合は出力
      if (metadata && Object.keys(metadata).length > 0) {
        this.logger.debug(
          `[${serviceName}] 追加情報: ${JSON.stringify(metadata)}`,
        );
      }
    } catch (error) {
      // 万が一ログ自体が失敗してもシステムは止めない
      this.logger.error(
        `エラーログ記録中にエラーが発生: ${error instanceof Error ? error.message : "不明なエラー"}`,
      );
    }
  }
}
