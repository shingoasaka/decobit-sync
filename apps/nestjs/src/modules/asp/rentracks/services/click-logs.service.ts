import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
import { RentracksClickLogRepository } from "../repositories/click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import {
  getNowJstForDisplay,
  formatDateForRentracks,
} from "src/libs/date-utils";
import { BaseAspService } from "../../base/base-asp.service";

interface RawRentracksData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  備考?: string;
  クリック数?: string;
}

@Injectable()
export class RentracksClickLogService
  extends BaseAspService
  implements LogService
{
  constructor(private readonly repository: RentracksClickLogRepository) {
    super(RentracksClickLogService.name);
  }

  async fetchAndInsertLogs(): Promise<number> {
    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performRentracksOperation(page);
      },
      "Rentracksクリックログ取得エラー",
    );

    return result || 0;
  }

  private async performRentracksOperation(page: Page): Promise<number> {
    await this.navigateToPage(page, "https://manage.rentracks.jp/manage/login");

    await page.fill(
      'input[name="idMailaddress"]',
      process.env.RENTRACKS_USERNAME ?? "",
    );
    await page.fill(
      'input[name="idLoginPassword"]',
      process.env.RENTRACKS_PASSWORD ?? "",
    );
    await page.getByRole("button", { name: "SIGN IN" }).click();

    await page.click('a:has-text("アクセス統計")');
    await page
      .locator("#hnavInner")
      .getByRole("link", { name: "アクセス統計（備考別）" })
      .click();
    await page.getByRole("combobox", { name: "すべての広告主" }).click();
    await page
      .getByRole("treeitem", {
        name: "株式会社エイチームライフデザイン(ナビクル車査定)",
      })
      .click();
    await page.waitForTimeout(1000);

    const today = getNowJstForDisplay();
    const formattedDate = formatDateForRentracks(today);
    await page.locator("#idTermSelect").selectOption(formattedDate);
    await page.getByRole("button", { name: "再表示" }).click();

    const [download] = await Promise.all([
      this.waitForDownload(page),
      page.getByRole("button", { name: "ダウンロード" }).click(),
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

  private async processCsv(filePath: string): Promise<RawRentracksData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = iconv.decode(buffer, "Shift_JIS");
      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
      }) as RawRentracksData[];

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

  private async transformData(rawData: RawRentracksData[]) {
    const formatted = await Promise.all(
      rawData
        .filter((item) => {
          if (!item.備考) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const affiliateLinkName = item.備考?.trim();
            if (!affiliateLinkName) {
              this.logger.warn("備考が空です");
              return null;
            }

            const current_total_clicks = this.toInt(item.クリック数);
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
