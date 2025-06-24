import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { MonkeyClickLogRepository } from "../repositories/click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { LogService } from "src/modules/logs/types";

// 定数を別ファイルに分離することを推奨
const CONFIG = {
  SELECTORS: {
    LOGIN: {
      ID: 'input[type="text"].ef',
      PASSWORD: 'input[type="password"].ef',
      SUBMIT: "button.button.button-squere",
    },
    REPORT: {
      ACTION_TAB: 'li[data-v-d2f0d4f2][id="TAG"].is-size-5',
      DOWNLOAD: "button[data-v-de104928].button.is-small",
      NO_DATA: ".log-not-found",
    },
  },
  WAIT_TIME: {
    SHORT: 2000,
  },
} as const;

// カスタムエラークラスの追加
class MonkeyServiceError extends Error {
  constructor(
    message: string,
    public readonly method: string,
  ) {
    super(message);
    this.name = "MonkeyServiceError";
  }
}

interface RawMonkeyData {
  タグ名?: string;
  click?: string;
}

@Injectable()
export class MonkeyClickLogService implements LogService {
  private readonly logger = new Logger(MonkeyClickLogService.name);

  constructor(private readonly repository: MonkeyClickLogRepository) {}

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
      this.logger.error("Monkeyログ取得エラー:", error);
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
    try {
      return await chromium.launch({
        headless: true,
        timeout: 30000,
      });
    } catch (error) {
      throw new Error(
        `Failed to initialize browser: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async setupPage(browser: Browser): Promise<Page> {
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      const url = process.env.MONKEY_URL;
      if (!url) throw new Error("MONKEY_URL is not defined");

      await page.goto(url);
      return page;
    } catch (error) {
      throw new Error(
        `Failed to setup page: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async login(page: Page): Promise<void> {
    await page.fill('input[type="text"].ef', process.env.MONKEY_ID ?? "");
    await page.fill(
      'input[type="password"].ef',
      process.env.MONKEY_PASSWORD ?? "",
    );
    await (await page.waitForSelector("button.button.button-squere")).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  }

  private async navigateToReport(page: Page): Promise<void> {
    try {
      await page.waitForTimeout(2000);
      await (
        await page.waitForSelector('li[data-v-d2f0d4f2][id="TAG"].is-size-5')
      ).click();
      await page.waitForTimeout(2000);
    } catch (error) {
      if (error instanceof Error && error.message.includes("TimeoutError")) {
        throw new Error(
          "ページ要素の取得に失敗しました。タイムアウトが発生しました。",
        );
      }
      throw error;
    }
  }

  private async downloadReport(page: Page): Promise<string> {
    try {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 60000 }),
        (
          await page.waitForSelector("button[data-v-de104928].button.is-small")
        ).click(),
      ]);

      const downloadPath = await download.path();
      if (!downloadPath) {
        throw new Error("ダウンロードパスが取得できません");
      }
      return downloadPath;
    } catch (error) {
      throw new Error(
        `レポートダウンロード中にエラー: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async processCsv(filePath: string): Promise<RawMonkeyData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = buffer.toString("utf8").replace(/^\uFEFF/, "");

      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as RawMonkeyData[];

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

  private async transformData(rawData: RawMonkeyData[]) {
    const formatted = await Promise.all(
      rawData
        .filter((item) => {
          if (!item["タグ名"]) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const affiliateLinkName = item["タグ名"]?.trim();
            if (!affiliateLinkName) {
              this.logger.warn("タグ名が空です");
              return null;
            }

            const current_total_clicks = this.toInt(item["click"]);

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
