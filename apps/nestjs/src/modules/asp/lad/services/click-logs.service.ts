import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { PrismaService } from "@prismaService";
import { LogService } from "src/modules/logs/types";
import dotenv from "dotenv";
import { LadClickLogRepository } from "../repositories/click-logs.repository";
import { processReferrerLink } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

dotenv.config();

interface RawLadData {
  クリック日時?: string;
  広告名?: string;
  リファラ?: string;
}

@Injectable()
export class LadClickLogService implements LogService {
  private readonly logger = new Logger(LadClickLogService.name);

  constructor(
    private readonly repository: LadClickLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        timeout: 30000,
      });
      const context = await browser.newContext({
        acceptDownloads: true,
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();

      page.setDefaultNavigationTimeout(45000);
      page.setDefaultTimeout(30000);

      await page.goto("https://admin038.l-ad.net/front/login/", {
        waitUntil: "domcontentloaded",
      });

      await page
        .getByRole("textbox", { name: "ログインID" })
        .fill(process.env.LAD_USERNAME ?? "");
      await page
        .getByRole("textbox", { name: "パスワード" })
        .fill(process.env.LAD_PASSWORD ?? "");
      await page.getByRole("button", { name: "ログイン" }).click();

      await page.waitForLoadState("domcontentloaded");

      await page.getByRole("link", { name: "ログ集計" }).click();
      await page.waitForLoadState("domcontentloaded");

      await page
        .getByRole("link", { name: "クリックログ", exact: true })
        .click();
      await page.waitForLoadState("domcontentloaded");

      await page.getByRole("button", { name: "本日" }).click();

      await page
        .waitForResponse(
          (response) =>
            response.url().includes("/admin/clicklog/") &&
            response.status() === 200,
          { timeout: 20000 },
        )
        .catch(() =>
          this.logger.warn("レスポンス待機タイムアウト、処理を継続します"),
        );

      await page.getByRole("button", { name: " CSV生成" }).click();

      await page.waitForTimeout(60000);

      await page.goto("https://admin038.l-ad.net/admin/clicklog/list", {
        waitUntil: "domcontentloaded",
      });

      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 45000 }),
        page.click('div.csvInfoExport1 a[href^="javascript:void(0)"]'),
      ]).catch((error) => {
        this.logger.error("ダウンロード待機中にエラーが発生しました:", error);
        return [null];
      });

      if (!download) {
        this.logger.warn(
          "ダウンロードイベントが取得できませんでした。処理を中止します。",
        );
        return 0;
      }

      const downloadPath = await download.path().catch((error) => {
        this.logger.error("ダウンロードパスの取得に失敗しました:", error);
        return null;
      });

      if (!downloadPath) {
        this.logger.warn(
          "ダウンロードパスが取得できません。処理を中止します。",
        );
        return 0;
      }

      const rawData = await this.processCsv(downloadPath);
      const formattedData = await this.transformData(rawData);
      return await this.repository.save(formattedData);
    } catch (error) {
      this.logger.error("クリックログ取得エラー:", error);
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

  private async processCsv(filePath: string): Promise<RawLadData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      let utf8Data = iconv.decode(buffer, "CP932");
      utf8Data = utf8Data.replace(/^\uFEFF/, "");

      const records = parse(utf8Data, {
        columns: (header: string[]) => header.map((h) => h.trim()),
        skip_empty_lines: true,
        relax_column_count: true,
      }) as RawLadData[];

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

  private async transformData(rawData: RawLadData[]) {
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
            const affiliateLinkName = item["広告名"]?.trim();
            const referrerUrl = item["リファラ"]?.trim() || null;

            if (!clickDateTime) {
              this.logger.warn(`Invalid date format: ${item["クリック日時"]}`);
              return null;
            }

            if (!affiliateLinkName) {
              this.logger.warn("広告名が空です");
              return null;
            }

            const affiliateLink =
              await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

            const { referrerLinkId, referrerUrl: processedReferrerUrl } =
              await processReferrerLink(this.prisma, this.logger, referrerUrl);

            return {
              clickDateTime,
              affiliate_link_id: affiliateLink.id,
              referrer_link_id: referrerLinkId,
              referrerUrl: processedReferrerUrl,
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
