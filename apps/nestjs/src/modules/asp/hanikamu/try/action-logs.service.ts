import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
import { HanikamuActionLogRepository } from "../repositories/action-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { getNowJstForDisplay } from "src/libs/date-utils";
import { parseToJst } from "src/libs/date-utils";
import { BaseAspService } from "../../base/base-asp.service";

interface RawHanikamuData {
  成果発生日?: string;
  ランディングページ?: string;
}

@Injectable()
export class TryActionLogService extends BaseAspService implements LogService {
  constructor(private readonly repository: HanikamuActionLogRepository) {
    super(TryActionLogService.name);
  }

  async fetchAndInsertLogs(): Promise<number> {
    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performHanikamuActionOperation(page);
      },
      "Hanikamuアクションログ取得エラー",
    );

    return result || 0;
  }

  private async performHanikamuActionOperation(page: Page): Promise<number> {
    await this.navigateToPage(page, "https://www.82comb.net/partner/login");

    await page.fill(
      'input[name="c_login_name"]',
      process.env.HANIKAMU_USERNAME ?? "",
    );
    await page.fill(
      'input[name="c_login_password"]',
      process.env.HANIKAMU_PASSWORD ?? "",
    );

    await Promise.all([page.click('input[name="clientlogin"]')]);

    await page.click("//a[@href='/partner/conversion/tracking']");
    await page.waitForTimeout(2000);

    await page.locator("#select_site").selectOption("1176");
    await page.waitForTimeout(1000);

    const today = getNowJstForDisplay();
    const formattedDate = today.getDate().toString();
    await page.locator('#search input[name="start_date"]').click();

    await page.waitForSelector(".datepicker-days", { timeout: 10000 });
    const startCalendar = page.locator(".datepicker-days").first();

    await startCalendar
      .locator("td.day")
      .first()
      .waitFor({ state: "attached", timeout: 10000 });

    await startCalendar
      .locator("td.day:not(.old):not(.new)", {
        hasText: new RegExp(`^${formattedDate}$`),
      })
      .click({ timeout: 10000 });

    await page.locator('#search input[name="end_date"]').click();

    const endCalendar = page.locator(".datepicker-days").nth(1);
    await endCalendar
      .locator("td.day")
      .nth(1)
      .waitFor({ state: "attached", timeout: 10000 });

    await endCalendar
      .locator("td.day:not(.old):not(.new)", {
        hasText: new RegExp(`^${formattedDate}$`),
      })
      .click({ timeout: 10000 });

    await page.locator("label").filter({ hasText: "成果発生日" }).click();

    const [download] = await Promise.all([
      this.waitForDownload(page),
      page.getByRole("button", { name: "  上記条件でCSVダウンロード" }).click(),
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

  private async processCsv(filePath: string): Promise<RawHanikamuData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = iconv.decode(buffer, "Shift_JIS");

      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
      }) as RawHanikamuData[];

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
        this.logger.error("Error deleting temporary file:", error);
      }
    }
  }

  private async transformData(rawData: RawHanikamuData[]) {
    const formatted = await Promise.all(
      rawData
        .filter((item) => {
          if (!item["成果発生日"] || !item["ランディングページ"]) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const actionDateTime = parseToJst(item["成果発生日"]);
            const affiliateLinkName = item["ランディングページ"]?.trim();

            if (!actionDateTime) {
              this.logger.warn(`Invalid date format: ${item["成果発生日"]}`);
              return null;
            }

            if (!affiliateLinkName) {
              this.logger.warn("ランディングページが空です");
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
