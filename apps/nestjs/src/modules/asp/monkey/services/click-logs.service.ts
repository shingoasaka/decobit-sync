import { Injectable } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { MonkeyClickLogRepository } from "../repositories/click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";

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

@Injectable()
export class MonkeyClickLogService implements LogService {
  constructor(
    private readonly repository: MonkeyClickLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await this.initializeBrowser();
      const page = await this.setupPage(browser);
      await this.login(page);
      await this.navigateToReport(page);
      const downloadPath = await this.downloadReport(page);
      return await this.processCsvAndSave(downloadPath);
    } catch (error) {
      this.handleError("fetchAndInsertLogs", error);
      return 0;
    } finally {
      if (browser) {
        await browser
          .close()
          .catch((error) => console.error("Browser closing error:", error));
      }
    }
  }

  private async initializeBrowser(): Promise<Browser> {
    try {
      return await chromium.launch({
        headless: true,
        timeout: 30000, // タイムアウト設定の追加
      });
    } catch (error) {
      throw new MonkeyServiceError(
        `Failed to initialize browser: ${error instanceof Error ? error.message : "Unknown error"}`,
        "initializeBrowser",
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
      throw new MonkeyServiceError(
        `Failed to setup page: ${error instanceof Error ? error.message : "Unknown error"}`,
        "setupPage",
      );
    }
  }

  private async login(page: Page): Promise<void> {
    await page.fill(CONFIG.SELECTORS.LOGIN.ID, process.env.MONKEY_ID ?? "");
    await page.fill(
      CONFIG.SELECTORS.LOGIN.PASSWORD,
      process.env.MONKEY_PASSWORD ?? "",
    );
    await (await page.waitForSelector(CONFIG.SELECTORS.LOGIN.SUBMIT)).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(CONFIG.WAIT_TIME.SHORT);
  }

  private async navigateToReport(page: Page): Promise<void> {
    try {
      await page.waitForTimeout(CONFIG.WAIT_TIME.SHORT);
      await (
        await page.waitForSelector(CONFIG.SELECTORS.REPORT.ACTION_TAB)
      ).click();
      await page.waitForTimeout(CONFIG.WAIT_TIME.SHORT);
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
        (await page.waitForSelector(CONFIG.SELECTORS.REPORT.DOWNLOAD)).click(),
      ]);

      const downloadPath = await download.path();
      if (!downloadPath) {
        throw new Error("ダウンロードパスが取得できません");
      }
      return downloadPath;
    } catch (error) {
      throw new MonkeyServiceError(
        `レポートダウンロード中にエラー: ${
          error instanceof Error ? error.message : error
        }`,
        "downloadReport",
      );
    }
  }

  private handleError(method: string, error: unknown): void {
    console.error(
      `Error in ${method}:`,
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  private async processCsvAndSave(filePath: string): Promise<number> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = buffer.toString("utf8").replace(/^\uFEFF/, "");

      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
        trim: true, // 空白文字の除去を追加
      });

      await this.repository.save(records);

      // ファイルの削除を追加
      await fs.promises
        .unlink(filePath)
        .catch((error) =>
          console.error("Failed to delete temporary file:", error),
        );

      return records.length;
    } catch (error) {
      throw new MonkeyServiceError(
        `Failed to process CSV: ${error instanceof Error ? error.message : "Unknown error"}`,
        "processCsvAndSave",
      );
    }
  }
}