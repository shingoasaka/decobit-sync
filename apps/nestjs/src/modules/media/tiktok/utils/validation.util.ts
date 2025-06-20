/**
 * バリデーション専用ユーティリティ
 * 責務：APIレスポンスの型安全性チェック
 */

// 型安全なレスポンス構造定義
export interface StatusResponseStructure<T> {
  data: {
    data: {
      list: T[];
    };
  };
}

export interface ReportResponseStructure<T> {
  data: {
    data: {
      list: T[];
    };
  };
}

export class ValidationUtil {
  /**
   * ステータスAPIレスポンスのバリデーション
   */
  static isValidStatusResponse<T>(
    response: unknown,
  ): response is StatusResponseStructure<T> {
    return (
      typeof response === "object" &&
      response !== null &&
      "data" in response &&
      typeof (response as Record<string, unknown>).data === "object" &&
      (response as Record<string, unknown>).data !== null &&
      "data" in
        ((response as Record<string, unknown>).data as Record<
          string,
          unknown
        >) &&
      typeof (
        (response as Record<string, unknown>).data as Record<string, unknown>
      ).data === "object" &&
      ((response as Record<string, unknown>).data as Record<string, unknown>)
        .data !== null &&
      "list" in
        (((response as Record<string, unknown>).data as Record<string, unknown>)
          .data as Record<string, unknown>) &&
      Array.isArray(
        (
          (
            (response as Record<string, unknown>).data as Record<
              string,
              unknown
            >
          ).data as Record<string, unknown>
        ).list,
      )
    );
  }

  /**
   * レポートAPIレスポンスのバリデーション
   */
  static isValidReportResponse<T>(
    response: unknown,
  ): response is ReportResponseStructure<T> {
    return (
      typeof response === "object" &&
      response !== null &&
      "data" in response &&
      typeof (response as Record<string, unknown>).data === "object" &&
      (response as Record<string, unknown>).data !== null &&
      "data" in
        ((response as Record<string, unknown>).data as Record<
          string,
          unknown
        >) &&
      typeof (
        (response as Record<string, unknown>).data as Record<string, unknown>
      ).data === "object" &&
      ((response as Record<string, unknown>).data as Record<string, unknown>)
        .data !== null &&
      "list" in
        (((response as Record<string, unknown>).data as Record<string, unknown>)
          .data as Record<string, unknown>) &&
      Array.isArray(
        (
          (
            (response as Record<string, unknown>).data as Record<
              string,
              unknown
            >
          ).data as Record<string, unknown>
        ).list,
      )
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
