import {
  TikTokMetrics,
  TikTokCampaignMetrics,
} from "../dtos/tiktok-report.dto";
import { getNowJstForDB } from "src/libs/date-utils";

/**
 * データ変換専用ユーティリティ
 * 責務：APIレスポンスからエンティティへの変換
 */
export class DataMapper {
  /**
   * 共通メトリクスの変換（全レベル共通）
   */
  static convertCommonMetrics<T extends TikTokMetrics>(metrics: T) {
    return {
      budget: this.parseNumber(String(metrics.budget || "0")),
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
   * Campaign専用メトリクス変換（budget <- campaign_budget）
   */
  static convertCampaignMetrics(metrics: TikTokCampaignMetrics) {
    return {
      ...this.convertCommonMetrics(metrics),
      budget: this.parseNumber(
        String(metrics.campaign_budget || metrics.budget || "0"),
      ),
    };
  }

  /**
   * 数値パース（共通処理）
   */
  private static parseNumber(value: string | number | undefined): number {
    const parsed = typeof value === "number" ? value : parseFloat(value ?? "");
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
