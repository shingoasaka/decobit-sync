import { Injectable, Logger } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { CatsActionLogRepository } from "../repositories/action-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { parseToJst } from "src/libs/date-utils";

interface RawCatsData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  遷移広告URL名?: string;
}

@Injectable()
export class CatsActionLogService {
  private readonly logger = new Logger(CatsActionLogService.name);
  constructor(private readonly repository: CatsActionLogRepository) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await this.setupPage(browser);

      await this.login(page);
      if (!(await this.navigateToReport(page))) {
        this.logger.warn(
          "検索結果が存在しないため、ダウンロードをスキップします",
        );
        return 0;
      }

      const downloadPath = await this.downloadReport(page);
      const rawData = await this.processCsv(downloadPath);
      const formattedData = await this.transformData(rawData);
      return await this.repository.save(formattedData);
    } catch (error) {
      this.handleError("fetchAndInsertLogs", error);
      return 0;
    } finally {
      await browser?.close();
    }
  }

  private async setupPage(browser: Browser): Promise<Page> {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(process.env.CATS_URL ?? "");
    return page;
  }

  private async login(page: Page): Promise<void> {
    try {
      await page.fill(
        'input[type="text"][name="loginId"]',
        process.env.CATS_ID ?? "",
      );
      await page.fill(
        'input[type="password"][name="password"]',
        process.env.CATS_PASSWORD ?? "",
      );
      await page.click("button.btn.btn-primary.btn-block.btn-flat.btn-lg");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      await page.goto(process.env.CATS_URL + "actionlog/list");
    } catch (error) {
      throw new Error("ログイン処理に失敗しました");
    }
  }

  private async navigateToReport(page: Page): Promise<boolean> {
    try {
      await page.click(
        "button.btn.btn-default.btn-sm.btn-flat.setDateButton[value='today']",
      );
      await page.waitForTimeout(2000);
      await page.click("button.btn.btn-primary.searchFormSubmit");
      await page.waitForTimeout(2000);

      const emptyDataElement = await page.$(".dataTables_empty");
      if (emptyDataElement) {
        const emptyDataMessage = await page.evaluate(
          (el) => el.textContent,
          emptyDataElement,
        );
        return !emptyDataMessage?.includes("データはありません");
      }

      await page.click("#csvBtn");
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForLoadState("networkidle");

      return true;
    } catch (error) {
      throw new Error("検索結果の取得に失敗しました");
    }
  }

  private async downloadReport(page: Page): Promise<string> {
    try {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 60000 }),
        page.click('div.csvInfoExport1 a[href^="javascript:void(0)"]'),
      ]);

      const downloadPath = await download.path();
      if (!downloadPath) throw new Error("ダウンロードパスが取得できません");
      return downloadPath;
    } catch (error) {
      throw new Error(
        `レポートのダウンロードに失敗しました: ${error instanceof Error ? error.message : error}`,
      );
    }
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
          referrerUrl: null,
          uid: null, // CATSは常にnull
        };
      }),
    );
  }

  private handleError(method: string, error: unknown): void {
    this.logger.error(
      `❌ ${method} でエラーが発生しました:`,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
