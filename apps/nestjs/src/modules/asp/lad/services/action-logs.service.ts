import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import dotenv from "dotenv";
import { LadActionLogRepository } from "../repositories/action-logs.repository";
import { parseToJst } from "src/libs/date-utils";
import { BaseAspService } from "../../base/base-asp.service";

dotenv.config();

interface RawLadData {
  成果日時?: string;
  遷移広告URL名?: string;
  "リファラ(クリック)"?: string;
}

@Injectable()
export class LadActionLogService extends BaseAspService implements LogService {
  constructor(private readonly repository: LadActionLogRepository) {
    super(LadActionLogService.name);
  }

  async fetchAndInsertLogs(): Promise<number> {
    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performLadActionOperation(page);
      },
      "Ladアクションログ取得エラー",
    );

    return result || 0;
  }

  private async performLadActionOperation(page: Page): Promise<number> {
    await this.navigateToPage(page, "https://admin038.l-ad.net/front/login/");

    await page
      .getByRole("textbox", { name: "ログインID" })
      .fill(process.env.LAD_MEN_USERNAME ?? "");
    await page
      .getByRole("textbox", { name: "パスワード" })
      .fill(process.env.LAD_MEN_PASSWORD ?? "");
    await page.getByRole("button", { name: "ログイン" }).click();

    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("link", { name: "ログ集計" }).click();
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("link", { name: "成果ログ" }).click();
    await page.waitForLoadState("domcontentloaded");

    await page.getByRole("button", { name: "本日" }).click();

    await page
      .waitForResponse(
        (response) =>
          response.url().includes("/admin/actionlog/") &&
          response.status() === 200,
        { timeout: 20000 },
      )
      .catch(() =>
        this.logger.warn("レスポンス待機タイムアウト、処理を継続します"),
      );

    await page.getByRole("button", { name: " CSV生成" }).click();

    await page.waitForTimeout(60000);

    await this.navigateToPage(
      page,
      "https://admin038.l-ad.net/admin/actionlog/list",
    );

    const [download] = await Promise.all([
      this.waitForDownload(page),
      page.click('div.csvInfoExport1 a[href^="javascript:void(0)"]'),
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

  private async processCsv(filePath: string): Promise<RawLadData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = iconv.decode(buffer, "Shift_JIS");

      const records = parse(utf8Data, {
        columns: true,
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
          if (!item["成果日時"] || !item["遷移広告URL名"]) {
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
            const affiliateLinkName = item["遷移広告URL名"]?.trim();
            const referrer_url = item["リファラ(クリック)"]?.trim() || null;

            if (!actionDateTime) {
              this.logger.warn(`Invalid date format: ${item["成果日時"]}`);
              return null;
            }

            if (!affiliateLinkName) {
              this.logger.warn("遷移広告URL名が空です");
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
