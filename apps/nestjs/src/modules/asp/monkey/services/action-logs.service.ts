import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { MonkeyActionLogRepository } from "../repositories/action-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { LogService } from "src/modules/logs/types";
import { parseToJst } from "src/libs/date-utils";

interface RawMonkeyData {
  成果日時?: string;
  タグ?: string;
  リファラ?: string;
}

@Injectable()
export class MonkeyActionLogService implements LogService {
  private readonly logger = new Logger(MonkeyActionLogService.name);

  constructor(private readonly repository: MonkeyActionLogRepository) {}

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
    return await chromium.launch({ headless: true });
  }

  private async setupPage(browser: Browser) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(process.env.MONKEY_URL ?? "");
    return page;
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
      await (
        await page.waitForSelector(
          'li[data-v-1e3b336f] div[data-v-1e3b336f] a[href="#/logs"].has-text-white',
        )
      ).click();
      await page.waitForTimeout(2000);

      // 検索結果の有無を確認
      const noDataElement = await page.$(".log-not-found");
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
    try {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 60000 }),
        (
          await page.waitForSelector("button[data-v-2e9de55a].button.is-small")
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
          if (!item["成果日時"] || !item["タグ"]) {
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
            const affiliateLinkName = item["タグ"]?.trim();
            const referrer_url = item["リファラ"]?.trim() || null;

            if (!actionDateTime) {
              this.logger.warn(`Invalid date format: ${item["成果日時"]}`);
              return null;
            }

            if (!affiliateLinkName) {
              this.logger.warn("タグ名が空です");
              return null;
            }

            const affiliateLink =
              await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

            const { referrerLinkId, referrer_url: processedReferrerUrl } =
              await this.repository.processReferrerLink(referrer_url);

            return {
              actionDateTime,
              affiliate_link_id: affiliateLink.id,
              referrer_link_id: referrerLinkId,
              referrer_url: processedReferrerUrl,
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
