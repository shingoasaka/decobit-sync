import { format, subDays } from "date-fns";

/**
 * 今日の日付をYYYY-MM-DD形式で取得
 */
export function getToday(): string {
  return format(new Date(), "yyyyMMdd");
}
export function getTodayDateOnly(): number {
  return parseInt(format(new Date(), "d"), 10); // 0埋めなしの `日` 部分を取得
}