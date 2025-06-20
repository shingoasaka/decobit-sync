import { TikTokMetrics } from "../dtos/tiktok-report.dto";
import { TikTokStatusItem } from "../interfaces/status-response.interface";
import { getNowJstForDB } from "src/libs/date-utils";

/**
 * データ変換専用ユーティリティ
 * 責務：APIレスポンスからエンティティへの変換
 */
export class DataMapper {
  /**
   * 共通メトリクスの変換
   */
  static convertCommonMetrics<T extends TikTokMetrics>(metrics: T) {
    return {
      spend: this.parseNumber(String(metrics.spend || "0")),
      impressions: this.parseNumber(String(metrics.impressions || "0")),
      clicks: this.parseNumber(String(metrics.clicks || "0")),
      video_play_actions: this.parseNumber(
        String(metrics.video_play_actions || "0"),
      ),
      video_watched_2s: this.parseNumber(
        String(metrics.video_watched_2s || "0"),
      ),
      video_watched_6s: this.parseNumber(
        String(metrics.video_watched_6s || "0"),
      ),
      video_views_p100: this.parseNumber(
        String(metrics.video_views_p100 || "0"),
      ),
      reach: this.parseNumber(String(metrics.reach || "0")),
      conversion: this.parseNumber(String(metrics.conversion || "0")),
      created_at: getNowJstForDB(),
    };
  }

  /**
   * ステータスフィールドの変換
   */
  static convertStatusFields(
    status: (TikTokStatusItem & { budget?: string | number }) | undefined,
  ) {
    if (!status) {
      return this.getDefaultStatusFields();
    }

    return {
      status: status.secondary_status,
      opt_status: status.operation_status,
      status_updated_time: this.parseStatusUpdateTime(status.modify_time),
      budget: this.parseStatusBudget(status),
    };
  }

  /**
   * デフォルトのステータスフィールドを取得
   */
  private static getDefaultStatusFields() {
    return {
      status: "UNKNOWN",
      opt_status: "UNKNOWN",
      status_updated_time: null,
      budget: 0,
    };
  }

  /**
   * ステータス更新時間をパース
   */
  private static parseStatusUpdateTime(modifyTime?: string): Date | null {
    return modifyTime ? new Date(modifyTime) : null;
  }

  /**
   * ステータス予算をパース
   */
  private static parseStatusBudget(
    status: TikTokStatusItem & { budget?: string | number },
  ): number {
    return "budget" in status && status.budget
      ? this.parseNumber(status.budget)
      : 0;
  }

  /**
   * 数値パース（共通処理）
   */
  private static parseNumber(value: string | number | undefined): number {
    const parsed = typeof value === "number" ? value : parseFloat(value ?? "");
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
