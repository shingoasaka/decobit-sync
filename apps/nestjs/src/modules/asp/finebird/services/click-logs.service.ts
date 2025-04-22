import { Injectable } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";
import { FinebirdClickLogRepository } from "../repositories/click-logs.repository";

interface FinebirdSelectors {
  LOGIN: {
    ID: string;
    PASSWORD: string;
    SUBMIT: string;
  };
  REPORT: {
    OPEN_SEARCH: string;
    TODAY: string;
    SEARCH_BUTTON: string;
    DOWNLOAD: string;
  };
}

const SELECTORS: FinebirdSelectors = {
  LOGIN: {
    ID: 'input[type="text"][name="loginId"]',
    PASSWORD: 'input[type="password"][name="password"]',
    SUBMIT: 'input[type="submit"][value="パートナー様ログイン"]',
  },
  REPORT: {
    OPEN_SEARCH: "div#searchField .card-header .card-title",
    TODAY: "#today",
    SEARCH_BUTTON: "button.btn.btn-info.mt-1",
    DOWNLOAD: "button.btn.btn-outline-primary.float-end",
  },
} as const;

const WAIT_TIME = {
  SHORT: 2000,
} as const;

@Injectable()
export class FinebirdClickLogService implements LogService {
  constructor(
    private readonly repository: FinebirdClickLogRepository,
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
    await page.goto(process.env.FINEBIRD_URL ?? "");
    return page;
  }

  private async login(page: Page): Promise<void> {
    await page.fill(SELECTORS.LOGIN.ID, process.env.FINEBIRD_ID ?? "");
    await page.fill(
      SELECTORS.LOGIN.PASSWORD,
      process.env.FINEBIRD_PASSWORD ?? "",
    );
    await (await page.waitForSelector(SELECTORS.LOGIN.SUBMIT)).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(WAIT_TIME.SHORT);
    await page.goto(process.env.FINEBIRD_URL + "partneradmin/report/ad/list");
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

      const emptyDataElement = await page.$("td[colspan='17']");
      if (emptyDataElement) {
        const emptyDataMessage = await page.evaluate(
          (el) => el.textContent,
          emptyDataElement,
        );
        if (
          emptyDataMessage &&
          emptyDataMessage.includes("該当するデータがありませんでした。")
        ) {
          console.warn("検索結果が存在しませんが、処理を継続します");
          return false;
        }
      }

      return true;
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
    const downloadBtn = await page.$(SELECTORS.REPORT.DOWNLOAD);
    if (!downloadBtn) {
      throw new Error("ダウンロードボタンが見つかりませんでした");
    }

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 45000 }),
      downloadBtn.click(),
    ]);

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
      const utf8Data = buffer.toString("utf8").replace(/^\uFEFF/, "");

      const records = parse(utf8Data, {
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
