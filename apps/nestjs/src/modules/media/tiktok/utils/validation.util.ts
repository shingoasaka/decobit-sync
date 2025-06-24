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
   * オブジェクトの深いプロパティチェック
   */
  private static hasNestedProperty(obj: unknown, path: string[]): boolean {
    let current = obj;

    for (const key of path) {
      if (
        typeof current !== "object" ||
        current === null ||
        !(key in current)
      ) {
        return false;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return true;
  }

  /**
   * 配列プロパティのチェック
   */
  private static isArrayProperty(obj: unknown, path: string[]): boolean {
    if (!this.hasNestedProperty(obj, path)) {
      return false;
    }

    let current = obj;
    for (const key of path) {
      current = (current as Record<string, unknown>)[key];
    }

    return Array.isArray(current);
  }

  /**
   * ステータスAPIレスポンスのバリデーション
   */
  static isValidStatusResponse<T>(
    response: unknown,
  ): response is StatusResponseStructure<T> {
    return this.isArrayProperty(response, ["data", "data", "list"]);
  }

  /**
   * レポートAPIレスポンスのバリデーション
   */
  static isValidReportResponse<T>(
    response: unknown,
  ): response is ReportResponseStructure<T> {
    return this.isArrayProperty(response, ["data", "data", "list"]);
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

  /**
   * 日付文字列のバリデーション
   */
  static isValidDateString(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) {
      return false;
    }

    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  /**
   * 数値文字列のバリデーション
   */
  static isValidNumberString(value: string): boolean {
    const parsed = parseFloat(value);
    return !isNaN(parsed) && isFinite(parsed);
  }

  /**
   * 必須フィールドのバリデーション
   */
  static hasRequiredFields(
    obj: Record<string, unknown>,
    requiredFields: string[],
  ): boolean {
    return requiredFields.every(
      (field) => obj[field] !== undefined && obj[field] !== null,
    );
  }
}
