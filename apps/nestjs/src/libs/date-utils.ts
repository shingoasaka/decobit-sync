import { format } from "date-fns";

export function getToday(): string {
  return format(new Date(), "yyyyMMdd");
}
export function getTodayDateOnly(): string {
  return format(new Date(), "d"); // `d` を指定すると 0埋めなしの値が取得できる
}
