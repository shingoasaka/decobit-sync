/**
 * バリデーション専用ユーティリティ
 * 責務：APIレスポンスの型安全性チェック
 */
export class ValidationUtil {
  /**
   * ステータスAPIレスポンスのバリデーション
   */
  static isValidStatusResponse<T>(
    response: unknown,
  ): response is { data: { data: { list: T[] } } } {
    // ネストされたlistが配列かどうかだけをシンプルに判定
    return (
      typeof response === 'object' &&
      response !== null &&
      'data' in response &&
      typeof (response as any).data === 'object' &&
      (response as any).data !== null &&
      'data' in (response as any).data &&
      typeof (response as any).data.data === 'object' &&
      (response as any).data.data !== null &&
      Array.isArray((response as any).data.data.list)
    );
  }

  /**
   * レポートDTOの妥当性チェック
   */
  static isValidReportDto<T extends { metrics: Record<string, unknown> }>(
    item: unknown,
    requiredMetrics: string[],
  ): item is T {
    if (!item || typeof item !== "object") {
      return false;
    }

    const obj = item as Record<string, unknown>;
    if (!obj.metrics || typeof obj.metrics !== "object") {
      return false;
    }

    const metrics = obj.metrics as Record<string, unknown>;
    return requiredMetrics.every((metric) => metrics[metric] !== undefined);
  }
} 