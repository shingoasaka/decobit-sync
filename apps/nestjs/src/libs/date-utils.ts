import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

//createdAt、updatedAtの共通関数
export function getNowJst(): Date {
  const timeZone = "Asia/Tokyo";
  const now = new Date();
  return toZonedTime(now, timeZone);
}

export function getNowJstTimestamps() {
  const now = getNowJst();
  return {
    createdAt: now,
    updatedAt: now,
  };
}

// 日付文字列をJST Dateオブジェクトに変換する共通関数
export function parseToJst(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const timeZone = "Asia/Tokyo";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return toZonedTime(date, timeZone);
  } catch (error) {
    console.error("Date parsing error:", error);
    return null;
  }
}

// MetronのActionログ用の日付フォーマット（yyyy年MM月dd日 HH時mm分）
export function formatDateTimeJapanese(d: Date): string {
  const timeZone = "Asia/Tokyo";
  const zonedDate = toZonedTime(d, timeZone);
  return format(zonedDate, "yyyy年MM月dd日 HH時mm分");
}

// 標準的な日付フォーマット（yyyy-MM-dd HH:mm:ss）
export function formatDateTime(d: Date): string {
  const timeZone = "Asia/Tokyo";
  const zonedDate = toZonedTime(d, timeZone);
  return format(zonedDate, "yyyy-MM-dd HH:mm:ss");
}

// Rentracks用の日付フォーマット（yyyy/MM/dd）
export function formatDateForRentracks(d: Date): string {
  const timeZone = "Asia/Tokyo";
  const zonedDate = toZonedTime(d, timeZone);
  return format(zonedDate, "yyyy/MM/dd");
}
