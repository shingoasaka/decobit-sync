import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { RentracksActionLogRepository } from "../repositories/action-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import {
  getNowJstForDisplay,
  formatDateForRentracks,
} from "src/libs/date-utils";
import { parseToJst } from "src/libs/date-utils";

interface RawRentracksData {
  成果日時?: string;
  サイト名?: string;
}

@Injectable()
export class RentracksActionLogService implements LogService {
  private readonly logger = new Logger(RentracksActionLogService.name);

  constructor(private readonly repository: RentracksActionLogRepository) {}

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
    await page
      .locator("div")
      .filter({ hasText: /^注文リスト$/ })
      .getByRole("link")
      .click();
    await page
      .locator("#hnavInner")
      .getByRole("listitem")
      .filter({ hasText: /^注文リスト$/ })
      .getByRole("link")
      .click();
    await page.waitForTimeout(1000);

    await page.getByRole("textbox", { name: "すべての広告主" }).click();
    await page
      .getByRole("treeitem", {
        name: "株式会社エイチームライフデザイン(ナビクル車査定)",
      })
      .click();

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
          if (!item["成果日時"] || !item["サイト名"]) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const actionDateTime = parseToJst(item["成果日時"]);
            const affiliateLinkName = item["サイト名"]?.trim();

            if (!actionDateTime) {
              this.logger.warn(`Invalid date format: ${item["成果日時"]}`);
              return null;
            }

            if (!affiliateLinkName) {
              this.logger.warn("サイト名が空です");
              return null;
            }

            const affiliateLink =
              await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

            return {
              actionDateTime,
              affiliate_link_id: affiliateLink.id,
              referrer_link_id: null,
              referrer_url: null,
              uid: null,
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
