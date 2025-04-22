import { Injectable } from "@nestjs/common";
import { chromium, Browser, Page } from "playwright";
import { CatsClickLogRepository } from "../repositories/click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";

@Injectable()
export class CatsClickLogService {
  constructor(private readonly repository: CatsClickLogRepository) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await this.setupPage(browser);

      await this.login(page);
      if (!(await this.navigateToReport(page))) {
        console.warn("検索結果が存在しないため、ダウンロードをスキップします");
        return 0;
      }

      const downloadPath = await this.downloadReport(page);
      return await this.repository.processCsvAndSave(downloadPath);
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
      await page.goto(process.env.CATS_URL + "clicklog/list");
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

  private handleError(method: string, error: unknown): void {
    console.error(
      `❌ ${method} でエラーが発生しました:`,
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}