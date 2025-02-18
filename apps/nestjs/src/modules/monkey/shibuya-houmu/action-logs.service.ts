import { Injectable } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { MonkeyActionLogRepository } from "../action-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";

const SELECTORS = {
  LOGIN: {
    ID: 'input[type="text"].ef',
    PASSWORD: 'input[type="password"].ef',
    SUBMIT: "button.button.button-squere",
  },
  REPORT: {
    ACTION_TAB:
      'li[data-v-1e3b336f] div[data-v-1e3b336f] a[href="#/logs"].has-text-white',
    SEARCH:
      "button[data-v-9dae462e].button.is-success-black.is-rounded.is-small",
    SEARCH_INPUT:
      "input[data-v-9dae462e][type='text'][name='campaignName'].input.is-small",
    DOWNLOAD: "button[data-v-2e9de55a].button.is-small",
    NO_DATA: ".log-not-found",
  },
} as const;

const WAIT_TIME = {
  SHORT: 2000,
} as const;

@Injectable()
export class ShibuyaHoumuActionLogService implements LogService {
  constructor(
    private readonly repository: MonkeyActionLogRepository,
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
      await browser?.close();
    }
  }

  private async initializeBrowser(): Promise<Browser> {
    return await chromium.launch({ headless: true });
  }

  private async setupPage(browser: Browser) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(process.env.MONKEY_URL ?? "");
    return page;
  }

  private async login(page: Page): Promise<void> {
    await page.fill(SELECTORS.LOGIN.ID, process.env.MONKEY_ID ?? "");
    await page.fill(
      SELECTORS.LOGIN.PASSWORD,
      process.env.MONKEY_PASSWORD ?? "",
    );
    await (await page.waitForSelector(SELECTORS.LOGIN.SUBMIT)).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(WAIT_TIME.SHORT);
  }

  private async navigateToReport(page: Page): Promise<void> {
    try {
      await (await page.waitForSelector(SELECTORS.REPORT.ACTION_TAB)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await (await page.waitForSelector(SELECTORS.REPORT.SEARCH)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await page.fill(SELECTORS.REPORT.SEARCH_INPUT, "渋谷法務総合事務所");
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await (
        await page.waitForSelector(SELECTORS.REPORT.SEARCH_INPUT)
      ).press("Enter");
      await page.waitForTimeout(WAIT_TIME.SHORT);

      // 検索結果の有無を確認
      const noDataElement = await page.$(SELECTORS.REPORT.NO_DATA);
      if (noDataElement) {
        throw new Error("検索結果が存在しません");
      }
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
    const buffer = fs.readFileSync(filePath);
    // BOM付きUTF-8として読み込む
    const utf8Data = buffer.toString("utf8").replace(/^\uFEFF/, ""); // BOMを除去

    const records = parse(utf8Data, {
      columns: true,
      skip_empty_lines: true,
    });

    // デバッグ用にレコードの内容を確認
    console.log("Parsed records:", JSON.stringify(records, null, 2));

    await this.repository.save(records);

    return records.length;
  }
}
