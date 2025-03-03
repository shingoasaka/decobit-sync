import { Injectable } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";
import { AdebisClickLogRepository } from "../click-logs.repository";

interface SparkOripaSelectors {
  LOGIN: {
    ACOUNT_ID: string;
    ID: string;
    PASSWORD: string;
    SUBMIT: string;
  };
  REPORT: {
    OPEN_SEARCH: string;
    TODAY: string;
    SEARCH_BUTTON: string;
    DROP_DOWN_BUTTON: string;
    DOWNLOAD: string;
  };
}

const SELECTORS: SparkOripaSelectors = {
  LOGIN: {
    ACOUNT_ID: 'input[type="text"][name="account_key"]',
    ID: 'input[type="text"][name="username"]',
    PASSWORD: 'input[type="password"][name="password"]',
    SUBMIT: 'button[type="submit"][name="login"]',
  },
  REPORT: {
    OPEN_SEARCH: "div[role='button'][tabindex='0']",
    TODAY: '.navbar-nav .side-panel-item:has-text("今日")',
    SEARCH_BUTTON: "button.btn.btn-secondary.btn-sm",
    DROP_DOWN_BUTTON: ".nav-link-export",
    DOWNLOAD: 'a.dropdown-item:has-text("表を出力")',
  },
} as const;

const WAIT_TIME = {
  SHORT: 2000,
} as const;

@Injectable()
export class SparkOripaClickLogService implements LogService {
  constructor(
    private readonly repository: AdebisClickLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await this.initializeBrowser();
      const page = await this.setupPage(browser);
      await this.login(page);
      const hasData = await this.navigateToReport(page);
      if (!hasData) {
        console.warn("検索結果が存在しないため、ダウンロードをスキップします");
        return 0;
      }
      const downloadPath = await this.downloadReport(page);
      return await this.processCsvAndSave(downloadPath);
    } catch (error) {
      this.handleError("fetchAndInsertLogs", error);
      return 0;
    } finally {
      await browser?.close();
    }
  }

  private async initializeBrowser(): Promise<Browser> {
    return await chromium.launch({ headless: true });
  }

  private async setupPage(browser: Browser) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(process.env.AD_EBIS_URL ?? "");
    return page;
  }

  private async login(page: Page): Promise<void> {
    await page.fill(
      SELECTORS.LOGIN.ACOUNT_ID,
      process.env.AD_EBIS_ACOUNT_ID ?? "",
    );
    await page.fill(SELECTORS.LOGIN.ID, process.env.AD_EBIS_ID ?? "");
    await page.fill(
      SELECTORS.LOGIN.PASSWORD,
      process.env.AD_EBIS_PASSWORD ?? "",
    );
    await (await page.waitForSelector(SELECTORS.LOGIN.SUBMIT)).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(WAIT_TIME.SHORT);
    await page.goto("https://bishamon.ebis.ne.jp/details-analysis");
    await page.waitForLoadState("networkidle");
  }

  private async navigateToReport(page: Page): Promise<boolean> {
    try {
      await (await page.waitForSelector(SELECTORS.REPORT.OPEN_SEARCH)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await (await page.waitForSelector(SELECTORS.REPORT.TODAY)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await (
        await page.waitForSelector(SELECTORS.REPORT.SEARCH_BUTTON)
      ).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);

      return true; // データあり
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
    const downloadPromise = page.waitForEvent("download");
    await (
      await page.waitForSelector(SELECTORS.REPORT.DROP_DOWN_BUTTON)
    ).click();
    await page.waitForTimeout(WAIT_TIME.SHORT);
    await (await page.waitForSelector(SELECTORS.REPORT.DOWNLOAD)).click();
    const download = await downloadPromise;

    const downloadPath = await download.path();
    if (!downloadPath) {
      throw new Error("ダウンロードパスが取得できません");
    }
    return downloadPath;
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
      const sjisData = iconv.decode(buffer, "Shift_JIS");

      const records = parse(sjisData, {
        columns: true,
        skip_empty_lines: true,
      });

      await this.repository.save(records);
      return records.length;
    } catch (error) {
      this.handleError("processCsvAndSave", error);
      throw error;
    } finally {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error("Error deleting temporary file:", error);
      }
    }
  }
}
