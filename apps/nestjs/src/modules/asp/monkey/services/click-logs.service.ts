import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
import { MonkeyClickLogRepository } from "../repositories/click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { LogService } from "src/modules/logs/types";
import { BaseAspService } from "../../base/base-asp.service";

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
export class MonkeyClickLogService
  extends BaseAspService
  implements LogService
{
  constructor(private readonly repository: MonkeyClickLogRepository) {
    super(MonkeyClickLogService.name);
  }

  async fetchAndInsertLogs(): Promise<number> {
    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performMonkeyOperation(page);
      },
      "Monkeyクリックログ取得エラー",
    );

    return result || 0;
  }

  private async performMonkeyOperation(page: Page): Promise<number> {
    const url = process.env.MONKEY_URL;
    if (!url) {
      this.logger.error("MONKEY_URL is not defined");
      return 0;
    }

    await this.navigateToPage(page, url);

    await page.fill('input[type="text"].ef', process.env.MONKEY_ID ?? "");
    await page.fill(
      'input[type="password"].ef',
      process.env.MONKEY_PASSWORD ?? "",
    );
    await (await page.waitForSelector("button.button.button-squere")).click();

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.waitForTimeout(2000);
    await (
      await page.waitForSelector('li[data-v-d2f0d4f2][id="TAG"].is-size-5')
    ).click();
    await page.waitForTimeout(2000);

    const [download] = await Promise.all([
      this.waitForDownload(page),
      (
        await page.waitForSelector("button[data-v-de104928].button.is-small")
      ).click(),
    ]).catch((error: unknown) => {
      this.logger.error("ダウンロード待機中にエラーが発生しました:", error);
      return [null];
    });

    if (!download) {
      this.logger.warn(
        "ダウンロードイベントが取得できませんでした。処理を中止します。",
      );
      return 0;
    }

    const downloadPath = await download.path().catch((error: unknown) => {
      this.logger.error("ダウンロードパスの取得に失敗しました:", error);
      return null;
    });

    if (!downloadPath) {
      this.logger.warn("ダウンロードパスが取得できません。処理を中止します。");
      return 0;
    }

    const rawData = await this.processCsv(downloadPath);
    const formattedData = await this.transformData(rawData);
    return await this.repository.save(formattedData);
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
    } catch (error: unknown) {
      this.logger.error("CSVの処理に失敗しました:", error);
      return [];
    } finally {
      try {
        fs.unlinkSync(filePath);
      } catch (error: unknown) {
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
