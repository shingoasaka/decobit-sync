import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { SampleAffiliateClickLogRepository } from "../repositories/click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";

interface SampleAffiliateSelectors {
  LOGIN: {
    ID: string;
    PASSWORD: string;
    SUBMIT: string;
  };
  REPORT: {
    REPORT_MENU: string;
    ACTION_TAB: string;
    MEDIA: string;
    TODAY: string;
    SEARCH_BUTTON: string;
    DOWNLOAD: string;
  };
  DOWNLOAD_DIALOG: {
    IFRAME: string;
    CONFIRM_BUTTON: string;
  };
}

const SELECTORS: SampleAffiliateSelectors = {
  LOGIN: {
    ID: 'input[type="text"][name="mail"]',
    PASSWORD: 'input[type="password"][name="pass"]',
    SUBMIT: 'div.btn-block.btn-login input[type="submit"]',
  },
  REPORT: {
    REPORT_MENU: ".side-menu .s-report.dropdown-icon > span",
    ACTION_TAB: '.side-menu .s-report ul li a[href="./view.php?type=report"]',
    MEDIA: 'input[type="radio"][name="target"][value="media"]',
    TODAY: 'input[type="radio"][name="date_type"][value="0d"]',
    SEARCH_BUTTON: 'input[type="submit"][value="検索する"]',
    DOWNLOAD: '.btn-csv a.thickbox[title="検索結果をCSVダウンロード"]',
  },
  DOWNLOAD_DIALOG: {
    IFRAME: "#TB_iframeContent",
    CONFIRM_BUTTON: '.btn-send.btn-csv[value="CSVファイルをダウンロード"]',
  },
} as const;

const WAIT_TIME = {
  SHORT: 2000,
} as const;

interface RawSampleAffiliateData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  メディア?: string;
  "アクセス数[件]"?: string;
}

@Injectable()
export class SampleAffiliateClickLogService implements LogService {
  private readonly logger = new Logger(SampleAffiliateClickLogService.name);

  constructor(private readonly repository: SampleAffiliateClickLogRepository) {}

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
      this.logger.error("SampleAffiliateログ取得エラー:", error);
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
    await page.goto(process.env.SAMPLE_AFFILIATE_URL ?? "");
    return page;
  }

  private async login(page: Page): Promise<void> {
    await page.fill(SELECTORS.LOGIN.ID, process.env.SAMPLE_AFFILIATE_ID ?? "");
    await page.fill(
      SELECTORS.LOGIN.PASSWORD,
      process.env.SAMPLE_AFFILIATE_PASSWORD ?? "",
    );
    await (await page.waitForSelector(SELECTORS.LOGIN.SUBMIT)).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(WAIT_TIME.SHORT);
  }

  private async navigateToReport(page: Page): Promise<void> {
    try {
      await (await page.waitForSelector(SELECTORS.REPORT.REPORT_MENU)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);

      await (await page.waitForSelector(SELECTORS.REPORT.ACTION_TAB)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);

      await (await page.waitForSelector(SELECTORS.REPORT.MEDIA)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);

      await (await page.waitForSelector(SELECTORS.REPORT.TODAY)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await (
        await page.waitForSelector(SELECTORS.REPORT.SEARCH_BUTTON)
      ).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);

      const downloadButton = await page.$(SELECTORS.REPORT.DOWNLOAD);
      if (!downloadButton) {
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
    try {
      const downloadPath = await this.initiateAndHandleDownload(page);
      return downloadPath;
    } catch (error) {
      this.logger.error("ダウンロード中にエラーが発生しました:", error);
      throw error;
    }
  }

  private async initiateAndHandleDownload(page: Page): Promise<string> {
    await this.clickDownloadLink(page);

    const frameElement = await page.waitForSelector(
      SELECTORS.DOWNLOAD_DIALOG.IFRAME,
    );
    const frame = await frameElement.contentFrame();

    if (!frame) {
      throw new Error("ダウンロードダイアログのiframeが見つかりません");
    }

    const confirmButton = await frame.waitForSelector(
      SELECTORS.DOWNLOAD_DIALOG.CONFIRM_BUTTON,
    );
    if (!confirmButton) {
      throw new Error("ダウンロード確認ボタンが見つかりません");
    }

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60000 }),
      confirmButton.click(),
    ]);

    const downloadPath = await download.path();
    if (!downloadPath) {
      throw new Error("ダウンロードパスが取得できません");
    }

    return downloadPath;
  }

  private async clickDownloadLink(page: Page): Promise<void> {
    const downloadLink = await page.waitForSelector(SELECTORS.REPORT.DOWNLOAD);
    if (!downloadLink) {
      throw new Error("ダウンロードリンクが見つかりません");
    }
    await downloadLink.click();
    await page.waitForTimeout(WAIT_TIME.SHORT);
  }

  private async processCsv(
    filePath: string,
  ): Promise<RawSampleAffiliateData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const sjisData = iconv.decode(buffer, "Shift_JIS");

      const records = parse(sjisData, {
        columns: true,
        skip_empty_lines: true,
      }) as RawSampleAffiliateData[];

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

  private async transformData(rawData: RawSampleAffiliateData[]) {
    const formatted = await Promise.all(
      rawData
        .filter((item) => {
          if (!item.メディア) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const affiliateLinkName = item.メディア?.trim();
            if (!affiliateLinkName) {
              this.logger.warn("メディアが空です");
              return null;
            }

            const current_total_clicks = this.toInt(item["アクセス数[件]"]);
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
