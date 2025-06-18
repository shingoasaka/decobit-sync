import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import { HanikamuActionLogRepository } from "../repositories/action-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";
import { getNowJstForDisplay } from "src/libs/date-utils";
import { parseToJst } from "src/libs/date-utils";

interface RawHanikamuData {
  成果発生日?: string;
  ランディングページ?: string;
}

@Injectable()
export class TryActionLogService implements LogService {
  private readonly logger = new Logger(TryActionLogService.name);

  constructor(
    private readonly repository: HanikamuActionLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      // ブラウザを起動 (ヘッドレスモード)
      browser = await chromium.launch({ headless: true });

      // 新しいブラウザコンテキストを作成
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto("https://www.82comb.net/partner/login");
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

      // 今日の日付を取得
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
        page.waitForEvent("download", { timeout: 60000 }),
        page
          .getByRole("button", { name: "  上記条件でCSVダウンロード" })
          .click(),
      ]);

      const downloadPath = await download.path();
      if (!downloadPath) {
        throw new Error("ダウンロードパスが取得できません");
      }

      const rawData = await this.processCsv(downloadPath);
      const formattedData = await this.transformData(rawData);
      return await this.repository.save(formattedData);
    } catch (error) {
      this.logger.error("Error during fetchAndInsertLogs:", error);
      return 0;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
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
    } catch (error) {
      throw new Error(
        `CSVの処理に失敗しました: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
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
              referrerUrl: null,
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
