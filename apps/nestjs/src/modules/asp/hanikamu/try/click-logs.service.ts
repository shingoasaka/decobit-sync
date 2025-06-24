import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { HanikamuClickLogRepository } from "../repositories/click-logs.repository";
import { getNowJstForDisplay } from "src/libs/date-utils";

interface RawHanikamuData {
  ランディングページ?: string;
  Click数?: string;
}

@Injectable()
export class TryClickLogService implements LogService {
  private readonly logger = new Logger(TryClickLogService.name);

  constructor(private readonly repository: HanikamuClickLogRepository) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      // ログイン処理
      await page.goto("https://www.82comb.net/partner/login");
      await page
        .getByRole("textbox", { name: "Enter loginname" })
        .fill(process.env.HANIKAMU_USERNAME ?? "");
      await page
        .getByRole("textbox", { name: "Enter password" })
        .fill(process.env.HANIKAMU_PASSWORD ?? "");
      await page.getByRole("button", { name: "LOGIN" }).click();

      await page.waitForTimeout(2000);
      await page.getByRole("link", { name: " Reports" }).click();
      await page.getByRole("link", { name: "LP別" }).click();
      await page.goto("https://www.82comb.net/partner/report/lp");
      // ページの読み込みを待つ
      await page.waitForLoadState("networkidle");

      await page.getByLabel("広告選択").selectOption("1176");
      // 選択後のページ更新を待つ
      await page.waitForLoadState("networkidle");

      // 今日の日付を取得
      const today = getNowJstForDisplay();
      const formattedDate = today.getDate().toString();

      try {
        await page.locator('#search input[name="start_date"]').click();
        await page.waitForSelector(".datepicker-days", { timeout: 10000 });
        const startCalendar = page.locator(".datepicker-days").first();

        await startCalendar
          .locator("td.day")
          .first()
          .waitFor({ state: "attached", timeout: 10000 });

        await startCalendar
          .locator("td.day:not(.old):not(.new)", {
            hasText: new RegExp(`^${formattedDate}$`),
          })
          .click({ timeout: 10000 });

        await page.locator('#search input[name="end_date"]').click();

        const endCalendar = page.locator(".datepicker-days").nth(1);
        await endCalendar
          .locator("td.day")
          .nth(1)
          .waitFor({ state: "attached", timeout: 10000 });

        await endCalendar
          .locator("td.day:not(.old):not(.new)", {
            hasText: new RegExp(`^${formattedDate}$`),
          })
          .click({ timeout: 10000 });

        // 日付入力後のページ更新を待つ
        await page.waitForLoadState("networkidle");

        // CSVダウンロード
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 60000 }),
          page
            .getByRole("button", { name: "  上記条件でCSVダウンロード" })
            .click(),
        ]);

        const downloadPath = await download.path();
        if (!downloadPath) {
          throw new Error("ダウンロードパスが取得できません");
        }

        const rawData = await this.processCsv(downloadPath);
        const formattedData = await this.transformData(rawData);
        return await this.repository.save(formattedData);
      } catch (error) {
        this.logger.error("Error during fetchAndInsertLogs:", error);
        return 0;
      }
    } catch (error) {
      this.logger.error("Error during fetchAndInsertLogs:", error);
      return 0;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private toInt(value: string | null | undefined): number {
    if (!value) return 0;
    try {
      const cleanValue = value.replace(/[,¥]/g, "");
      const num = parseInt(cleanValue, 10);
      return isNaN(num) ? 0 : num;
    } catch (error) {
      this.logger.warn(`Invalid number format: ${value}`);
      return 0;
    }
  }

  private async processCsv(filePath: string): Promise<RawHanikamuData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = iconv.decode(buffer, "Shift_JIS");

      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
      }) as RawHanikamuData[];

      if (!records || records.length === 0) {
        this.logger.warn("CSVにデータがありませんでした");
        return [];
      }

      return records;
    } catch (error) {
      throw new Error(
        `CSVの処理に失敗しました: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        this.logger.error("Error deleting temporary file:", error);
      }
    }
  }

  private async transformData(rawData: RawHanikamuData[]) {
    const formatted = await Promise.all(
      rawData
        .filter((item) => {
          if (!item["ランディングページ"]) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const affiliateLinkName = item["ランディングページ"]?.trim();
            if (!affiliateLinkName) {
              this.logger.warn("ランディングページが空です");
              return null;
            }

            const current_total_clicks = this.toInt(item["Click数"]);

            const affiliateLink =
              await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

            return {
              affiliate_link_id: affiliateLink.id,
              current_total_clicks,
              referrer_link_id: null,
              referrer_url: null,
            };
          } catch (error) {
            this.logger.error(
              `Error processing record: ${JSON.stringify(item)}`,
              error,
            );
            return null;
          }
        }),
    );

    return formatted.filter(
      (record): record is NonNullable<typeof record> => record !== null,
    );
  }
}
