import { format, addHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Tokyo";

// データベース保存用のJST時間取得（UTCとして保存されるため+9時間）
export function getNowJstForDB(): Date {
  const now = new Date();
  return addHours(now, 9);
}

// 画面表示用のJST時間取得（タイムゾーン考慮）
export function getNowJstForDisplay(): Date {
  const now = new Date();
  return toZonedTime(now, TIMEZONE);
}

// データベース保存用のタイムスタンプ
export function getNowJstTimestamps() {
  const now = getNowJstForDB();
  return {
    createdAt: now,
    updatedAt: now,
  };
}

// 日付文字列をJST Dateオブジェクトに変換する共通関数
export function parseToJst(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return toZonedTime(date, TIMEZONE);
  } catch (error) {
    console.error("Date parsing error:", error);
    return null;
  }
}

// MetronのActionログ用の日付フォーマット（yyyy年MM月dd日 HH時mm分）
export function formatDateTimeJapanese(d: Date): string {
  return format(d, "yyyy年MM月dd日 HH時mm分");
}

// 標準的な日付フォーマット（yyyy-MM-dd HH:mm:ss）
export function formatDateTime(d: Date): string {
  return format(d, "yyyy-MM-dd HH:mm:ss");
}

// Rentracks用の日付フォーマット（yyyy/MM/dd）
export function formatDateForRentracks(d: Date): string {
  return format(d, "yyyy/MM/dd");
}

// 後方互換性のため、既存の関数名を維持（非推奨）
/** @deprecated Use getNowJstForDB() for database operations or getNowJstForDisplay() for UI */
export function getNowJst(): Date {
  return getNowJstForDB();
}
