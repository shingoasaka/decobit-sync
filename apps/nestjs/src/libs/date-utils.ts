import { format } from "date-fns";

export function getToday(): string {
  return format(new Date(), "yyyyMMdd");
}

export function getTodayDateOnly(): string {
  return format(new Date(), "d");
}

//createdAt、updatedAtの共通関数
export function getNowJst(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
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
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return new Date(date.getTime() + 9 * 60 * 60 * 1000);
  } catch (error) {
    console.error("Date parsing error:", error);
    return null;
  }
}

// MetronのActionログ用の日付フォーマット（yyyy年MM月dd日 HH時mm分）
export function formatDateTimeJapanese(d: Date): string {
  // JSTに変換
  const jstDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jstDate.getUTCFullYear();
  const MM = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jstDate.getUTCDate()).padStart(2, "0");
  const hh = String(jstDate.getUTCHours()).padStart(2, "0");
  const mm = String(jstDate.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}年${MM}月${dd}日 ${hh}時${mm}分`;
}

// 標準的な日付フォーマット（yyyy-MM-dd HH:mm:ss）
export function formatDateTime(d: Date): string {
  // JSTに変換
  const jstDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = jstDate.getUTCFullYear();
  const MM = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(jstDate.getUTCDate()).padStart(2, "0");
  const hh = String(jstDate.getUTCHours()).padStart(2, "0");
  const mm = String(jstDate.getUTCMinutes()).padStart(2, "0");
  const ss = String(jstDate.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}
