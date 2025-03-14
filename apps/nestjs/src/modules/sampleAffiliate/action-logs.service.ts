import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { PrismaService } from "@prismaService";
import { SampleAffiliateActionLogRepository } from "./action-logs.repository";

@Injectable()
export class SampleAffiliateActionLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: SampleAffiliateActionLogRepository,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      // ✅ ログイン処理
      await page.goto("https://spectrum-sm.com/contents.php?c=user_login");
      await page
        .locator('input[name="mail"]')
        .fill(process.env.SAMPLE_AFFILIATE_ID ?? "");
      await page
        .locator('input[name="pass"]')
        .fill(process.env.SAMPLE_AFFILIATE_PASSWORD ?? "");
      await page.getByRole("button", { name: "ログイン" }).click();

      await page.waitForTimeout(2000);
      await page.getByRole("link", { name: "成果管理" }).click();
      await page.getByRole("radio", { name: "今日" }).first().check();
      await page.getByRole("radio", { name: "今日" }).nth(1).check();
      await page.getByRole("button", { name: "検索する" }).click();

      // ✅ CSVダウンロード画面に遷移
      await page
        .getByRole("link", { name: "検索結果をCSVダウンロード" })
        .click();

      // ✅ iframe のロードを明示的に待つ
      await page.waitForSelector('iframe[name^="TB_iframeContent"]', {
        timeout: 10000,
      });

      // ✅ iframe を取得（`name` が変化する問題を `name^="TB_iframeContent"` で解決）
      const iframeLocator = page.locator('iframe[name^="TB_iframeContent"]');
      const iframeElement = await iframeLocator.elementHandle();
      const iframeContent = await iframeElement?.contentFrame();
      if (!iframeContent) throw new Error("Iframe not found");

      // ✅ ダウンロードボタンをクリック
      const downloadPromise = page.waitForEvent("download");
      await iframeContent
        .getByRole("button", { name: "CSVファイルをダウンロード" })
        .click();
      const download = await downloadPromise;

      // ✅ ファイルの保存パスを取得
      const downloadPath = await download.path();
      if (!downloadPath) {
        throw new Error("Download path not found");
      }

      return await this.processCsvAndSave(downloadPath);
    } catch (error) {
      return 0;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async processCsvAndSave(filePath: string): Promise<number> {
    const buffer = fs.readFileSync(filePath);
    const utf8Data = iconv.decode(buffer, "Shift_JIS");

    const records = parse(utf8Data, {
      columns: true,
      skip_empty_lines: true,
    });
    await this.repository.save(records);

    return records.length;
  }
}
