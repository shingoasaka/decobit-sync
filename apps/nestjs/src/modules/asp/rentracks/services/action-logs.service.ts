import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
import { RentracksActionLogRepository } from "../repositories/action-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import {
  getNowJstForDisplay,
  formatDateForRentracks,
} from "src/libs/date-utils";
import { parseToJst } from "src/libs/date-utils";
import { BaseAspService } from "../../base/base-asp.service";

interface RawRentracksData {
  成果日時?: string;
  サイト名?: string;
}

@Injectable()
export class RentracksActionLogService
  extends BaseAspService
  implements LogService
{
  constructor(private readonly repository: RentracksActionLogRepository) {
    super(RentracksActionLogService.name);
  }

  async fetchAndInsertLogs(): Promise<number> {
    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performRentracksActionOperation(page);
      },
      "Rentracksアクションログ取得エラー",
    );

    return result || 0;
  }

  private async performRentracksActionOperation(page: Page): Promise<number> {
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

    await page
      .locator("div")
      .filter({ hasText: /^注文リスト$/ })
      .getByRole("link")
      .click();
    await page
      .locator("#hnavInner")
      .getByRole("listitem")
      .filter({ hasText: /^注文リスト$/ })
      .getByRole("link")
      .click();
    await page.waitForTimeout(1000);

    await page.getByRole("textbox", { name: "すべての広告主" }).click();
    await page
      .getByRole("treeitem", {
        name: "株式会社エイチームライフデザイン(ナビクル車査定)",
      })
      .click();

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
          if (!item["成果日時"] || !item["サイト名"]) {
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
            const affiliateLinkName = item["サイト名"]?.trim();

            if (!actionDateTime) {
              this.logger.warn(`Invalid date format: ${item["成果日時"]}`);
              return null;
            }

            if (!affiliateLinkName) {
              this.logger.warn("サイト名が空です");
              return null;
            }

            const affiliateLink =
              await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

            return {
              actionDateTime,
              affiliate_link_id: affiliateLink.id,
              referrer_link_id: null,
              referrer_url: null,
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
