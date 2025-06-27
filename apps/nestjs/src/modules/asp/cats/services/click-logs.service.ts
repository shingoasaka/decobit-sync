import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
import { LogService } from "src/modules/logs/types";
import { CatsClickLogRepository } from "../repositories/click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { parseToJst } from "src/libs/date-utils";
import { BaseAspService } from "../../base/base-asp.service";

interface RawCatsData {
  クリック日時?: string;
  広告名?: string;
}

@Injectable()
export class CatsClickLogService extends BaseAspService implements LogService {
  constructor(private readonly repository: CatsClickLogRepository) {
    super(CatsClickLogService.name);
  }

  async fetchAndInsertLogs(): Promise<number> {
    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performCatsOperation(page);
      },
      "Catsクリックログ取得エラー",
    );

    return result || 0;
  }

  private async performCatsOperation(page: Page): Promise<number> {
    await this.navigateToPage(page, process.env.CATS_URL ?? "");

    await page.fill('input[name="login_id"]', process.env.CATS_ID ?? "");
    await page.fill('input[name="password"]', process.env.CATS_PASSWORD ?? "");
    await page.click('input[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.click('a[href="/report/click"]');
    await page.waitForTimeout(2000);

    await page.click('input[name="date_type"][value="today"]');
    await page.waitForTimeout(2000);

    await page.click('input[type="submit"]');
    await page.waitForTimeout(2000);

    const [download] = await Promise.all([
      this.waitForDownload(page),
      page.click('a[href*="download"]'),
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

  private async processCsv(downloadPath: string): Promise<RawCatsData[]> {
    try {
      const fileBuffer = fs.readFileSync(downloadPath);
      const utf8Content = iconv.decode(fileBuffer, "Shift_JIS");
      const records = parse(utf8Content, {
        columns: true,
        skip_empty_lines: true,
      }) as RawCatsData[];
      if (!records || records.length === 0) {
        this.logger.warn("CSVにデータがありませんでした");
        return [];
      }

      return records;
    } catch (error) {
      throw new Error(
        `CSVの処理に失敗しました: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async transformData(rawData: RawCatsData[]) {
    const formatted = await Promise.all(
      rawData
        .filter((item) => {
          if (!item["クリック日時"] || !item["広告名"]) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const clickDateTime = parseToJst(item["クリック日時"]);
            const affiliateLinkName = item["広告名"];

            if (!clickDateTime) {
              this.logger.warn(`Invalid date format: ${item["クリック日時"]}`);
              return null;
            }

            const affiliateLink =
              await this.repository.getOrCreateAffiliateLink(
                affiliateLinkName!,
              );

            return {
              clickDateTime,
              affiliate_link_id: affiliateLink.id,
              referrer_link_id: null, // CATSは常にnull
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
}
