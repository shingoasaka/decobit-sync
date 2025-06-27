import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
import { LogService } from "src/modules/logs/types";
import { CatsActionLogRepository } from "../repositories/action-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { parseToJst } from "src/libs/date-utils";
import { BaseAspService } from "../../base/base-asp.service";

interface RawCatsData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  遷移広告URL名?: string;
}

@Injectable()
export class CatsActionLogService extends BaseAspService implements LogService {
  constructor(private readonly repository: CatsActionLogRepository) {
    super(CatsActionLogService.name);
  }

  async fetchAndInsertLogs(): Promise<number> {
    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performCatsActionOperation(page);
      },
      "Catsアクションログ取得エラー",
    );

    return result || 0;
  }

  private async performCatsActionOperation(page: Page): Promise<number> {
    await this.navigateToPage(page, process.env.CATS_URL ?? "");

    await page.fill('input[name="login_id"]', process.env.CATS_ID ?? "");
    await page.fill('input[name="password"]', process.env.CATS_PASSWORD ?? "");
    await page.click('input[type="submit"]');

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.click('a[href="/report/action"]');
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
      return parse(utf8Content, {
        columns: true,
        skip_empty_lines: true,
      }) as RawCatsData[];
    } catch (error) {
      throw new Error(
        `CSVの処理に失敗しました: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async transformData(rawData: RawCatsData[]) {
    return await Promise.all(
      rawData.map(async (item) => {
        const actionDateTime = parseToJst(item["成果日時"]);
        const affiliateLinkName = item["遷移広告URL名"];

        if (!actionDateTime || !affiliateLinkName) {
          throw new Error("必須データが不足しています");
        }

        const affiliateLink =
          await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

        return {
          actionDateTime,
          affiliate_link_id: affiliateLink.id,
          referrer_link_id: null, // CATSは常にnull
          referrer_url: null,
          uid: null, // CATSは常にnull
        };
      }),
    );
  }
}
