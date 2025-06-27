import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { HanikamuClickLogRepository } from "../repositories/click-logs.repository";
import { getNowJstForDisplay } from "src/libs/date-utils";
import { BaseAspService } from "../../base/base-asp.service";

interface RawHanikamuData {
  ランディングページ?: string;
  Click数?: string;
}

@Injectable()
export class TryClickLogService extends BaseAspService implements LogService {
  constructor(private readonly repository: HanikamuClickLogRepository) {
    super(TryClickLogService.name);
  }

  async fetchAndInsertLogs(): Promise<number> {
    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performHanikamuOperation(page);
      },
      "Hanikamuクリックログ取得エラー",
    );

    return result || 0;
  }

  private async performHanikamuOperation(page: Page): Promise<number> {
    await this.navigateToPage(page, "https://www.82comb.net/partner/login");

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
    await page.waitForLoadState("networkidle");

    await page.getByLabel("広告選択").selectOption("1176");
    await page.waitForLoadState("networkidle");

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

      await page.waitForLoadState("networkidle");

      const [download] = await Promise.all([
        this.waitForDownload(page),
        page
          .getByRole("button", { name: "  上記条件でCSVダウンロード" })
          .click(),
      ]).catch((error: unknown) => {
        this.logger.error("ダウンロード待機中にエラーが発生しました:", error);
        return [null];
      });

      if (!download) {
        this.logger.warn(
          "ダウンロードイベントが取得できませんでした。処理を中止します。",
        );
        return 0;
      }

      const downloadPath = await download.path().catch((error: unknown) => {
        this.logger.error("ダウンロードパスの取得に失敗しました:", error);
        return null;
      });

      if (!downloadPath) {
        this.logger.warn(
          "ダウンロードパスが取得できません。処理を中止します。",
        );
        return 0;
      }

      const rawData = await this.processCsv(downloadPath);
      const formattedData = await this.transformData(rawData);
      return await this.repository.save(formattedData);
    } catch (error: unknown) {
      this.logger.error("Hanikamu操作中にエラーが発生しました:", error);
      return 0;
    }
  }

  private toInt(value: string | null | undefined): number {
    if (!value) return 0;
    try {
      const cleanValue = value.replace(/[,¥]/g, "");
      const num = parseInt(cleanValue, 10);
      return isNaN(num) ? 0 : num;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      this.logger.error("CSVの処理に失敗しました:", error);
      return [];
    } finally {
      try {
        fs.unlinkSync(filePath);
      } catch (error: unknown) {
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
