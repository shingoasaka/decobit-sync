import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { RentracksClickLogRepository } from "../repositories/click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import {
  getNowJstForDisplay,
  formatDateForRentracks,
} from "src/libs/date-utils";

interface RawRentracksData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  備考?: string;
  クリック数?: string;
}

@Injectable()
export class RentracksClickLogService implements LogService {
  private readonly logger = new Logger(RentracksClickLogService.name);

  constructor(private readonly repository: RentracksClickLogRepository) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await this.initializeBrowser();
      const page = await this.setupPage(browser);
      await this.login(page);
      await this.navigateToReport(page);
      const downloadPath = await this.downloadReport(page);
      const rawData = await this.processCsv(downloadPath);
      const formattedData = await this.transformData(rawData);
      return await this.repository.save(formattedData);
    } catch (error) {
      this.logger.error("Rentracksログ取得エラー:", error);
      return 0;
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          this.logger.error("ブラウザのクローズに失敗しました:", error);
        }
      }
    }
  }

  private async initializeBrowser(): Promise<Browser> {
    return await chromium.launch({ headless: true });
  }

  private async setupPage(browser: Browser): Promise<Page> {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://manage.rentracks.jp/manage/login");
    return page;
  }

  private async login(page: Page): Promise<void> {
    await page.fill(
      'input[name="idMailaddress"]',
      process.env.RENTRACKS_USERNAME ?? "",
    );
    await page.fill(
      'input[name="idLoginPassword"]',
      process.env.RENTRACKS_PASSWORD ?? "",
    );
    await page.getByRole("button", { name: "SIGN IN" }).click();
  }

  private async navigateToReport(page: Page): Promise<void> {
    await page.click('a:has-text("アクセス統計")');
    await page
      .locator("#hnavInner")
      .getByRole("link", { name: "アクセス統計（備考別）" })
      .click();
    await page.getByRole("combobox", { name: "すべての広告主" }).click();
    await page
      .getByRole("treeitem", {
        name: "株式会社エイチームライフデザイン(ナビクル車査定)",
      })
      .click();
    await page.waitForTimeout(1000);

    const today = getNowJstForDisplay();
    const formattedDate = formatDateForRentracks(today);
    await page.locator("#idTermSelect").selectOption(formattedDate);
    await page.getByRole("button", { name: "再表示" }).click();
  }

  private async downloadReport(page: Page): Promise<string> {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60000 }),
      page.getByRole("button", { name: "ダウンロード" }).click(),
    ]);
    const downloadPath = await download.path();
    if (!downloadPath) {
      throw new Error("ダウンロードパスが取得できません");
    }
    return downloadPath;
  }

  private async processCsv(filePath: string): Promise<RawRentracksData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = iconv.decode(buffer, "Shift_JIS");
      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
      }) as RawRentracksData[];

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
        this.logger.error("一時ファイルの削除に失敗しました:", error);
      }
    }
  }

  private async transformData(rawData: RawRentracksData[]) {
    const formatted = await Promise.all(
      rawData
        .filter((item) => {
          if (!item.備考) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const affiliateLinkName = item.備考?.trim();
            if (!affiliateLinkName) {
              this.logger.warn("備考が空です");
              return null;
            }

            const current_total_clicks = this.toInt(item.クリック数);
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
}
