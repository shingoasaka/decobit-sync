import { format } from "date-fns";

export function getToday(): string {
  return format(new Date(), "yyyyMMdd");
}
export function getTodayDateOnly(): string {
  return format(new Date(), "d"); // `d` を指定すると 0埋めなしの値が取得できる
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
