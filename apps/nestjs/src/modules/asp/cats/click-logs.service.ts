import { Injectable } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { CatsClickLogRepository } from "./click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";

interface CatsSelectors {
  LOGIN: {
    ID: string;
    PASSWORD: string;
    SUBMIT: string;
  };
  REPORT: {
    TODAY: string;
    SEARCH_BUTTON: string;
    CSV_GENERATE_BUTTON: string;
    DOWNLOAD: string;
  };
}

const SELECTORS: CatsSelectors = {
  LOGIN: {
    ID: 'input[type="text"][name="loginId"]',
    PASSWORD: 'input[type="password"][name="password"]',
    SUBMIT: "button.btn.btn-primary.btn-block.btn-flat.btn-lg",
  },
  REPORT: {
    TODAY:
      "button.btn.btn-default.btn-sm.btn-flat.setDateButton[value='today']",
    SEARCH_BUTTON: "button.btn.btn-primary.searchFormSubmit",
    CSV_GENERATE_BUTTON: "#csvBtn",
    DOWNLOAD: 'div.csvInfoExport1 a[href^="javascript:void(0)"]',
  },
} as const;

const WAIT_TIME = {
  SHORT: 2000,
} as const;

@Injectable()
export class CatsClickLogService implements LogService {
  constructor(
    private readonly repository: CatsClickLogRepository,
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
    await page.goto(process.env.CATS_URL ?? "");
    return page;
  }

  private async login(page: Page): Promise<void> {
    await page.fill(SELECTORS.LOGIN.ID, process.env.CATS_ID ?? "");
    await page.fill(SELECTORS.LOGIN.PASSWORD, process.env.CATS_PASSWORD ?? "");
    await (await page.waitForSelector(SELECTORS.LOGIN.SUBMIT)).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(WAIT_TIME.SHORT);
    await page.goto(process.env.CATS_URL + "clicklog/list");
  }

  private async navigateToReport(page: Page): Promise<boolean> {
    try {
      await (await page.waitForSelector(SELECTORS.REPORT.TODAY)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await (
        await page.waitForSelector(SELECTORS.REPORT.SEARCH_BUTTON)
      ).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);

      const emptyDataElement = await page.$(".dataTables_empty");
      if (emptyDataElement) {
        const emptyDataMessage = await page.evaluate(
          (el) => el.textContent,
          emptyDataElement,
        );
        if (
          emptyDataMessage &&
          emptyDataMessage.includes("データはありません")
        ) {
          console.warn("検索結果が存在しませんが、処理を継続します");
          return false; // データなし
        }
      }

      await (
        await page.waitForSelector(SELECTORS.REPORT.CSV_GENERATE_BUTTON)
      ).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await page.reload();
      await page.waitForLoadState("networkidle");

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
