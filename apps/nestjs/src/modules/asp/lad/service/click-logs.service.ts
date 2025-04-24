import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { PrismaService } from "@prismaService";
import { LogService } from "src/modules/logs/types";
import dotenv from "dotenv";
import { LadClickLogRepository } from "../repositories/click-logs.repository";

dotenv.config();

@Injectable()
export class LadClickLogService implements LogService {
  constructor(
    private readonly repository: LadClickLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        timeout: 30000, // ブラウザ起動のタイムアウトを30秒に設定
      });
      const context = await browser.newContext({
        acceptDownloads: true,
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();

      // ナビゲーションのタイムアウトを45秒に設定（短縮）
      page.setDefaultNavigationTimeout(45000);
      page.setDefaultTimeout(30000); // その他のアクションのタイムアウトを30秒に設定

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

      // ログイン後のページ読み込み完了を待機
      await page.waitForLoadState("domcontentloaded");

      await page.getByRole("link", { name: "ログ集計" }).click();
      await page.waitForLoadState("domcontentloaded");

      await page
        .getByRole("link", { name: "クリックログ", exact: true })
        .click();
      await page.waitForLoadState("domcontentloaded");

      await page.getByRole("button", { name: "本日" }).click();

      // より短いタイムアウトでレスポンスを待機
      await page
        .waitForResponse(
          (response) =>
            response.url().includes("/admin/clicklog/") &&
            response.status() === 200,
          { timeout: 20000 },
        )
        .catch(() =>
          console.log("レスポンス待機タイムアウト、処理を継続します"),
        );

      // CSV生成のクリック
      await page.getByRole("button", { name: " CSV生成" }).click();

      // CSV生成完了を示す要素の表示を待機（30秒に短縮）
      try {
        await page.waitForSelector("div.csvInfoExport1", { timeout: 30000 });
      } catch (error) {
        console.log(
          "CSV生成待機中にタイムアウトしました。ダウンロードページに移動を試みます。",
        );
      }

      await page.waitForTimeout(10000);

      // CSVダウンロードページへ移動
      await page.goto("https://admin038.l-ad.net/admin/clicklog/list", {
        waitUntil: "domcontentloaded",
      });

      // ダウンロードの実行（Promise.allパターン使用）- タイムアウトを45秒に短縮
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 45000 }),
        page.click('div.csvInfoExport1 a[href^="javascript:void(0)"]'),
      ]).catch((error) => {
        console.error("ダウンロード待機中にエラーが発生しました:", error);
        return [null];
      });

      if (!download) {
        console.log(
          "ダウンロードイベントが取得できませんでした。処理を中止します。",
        );
        return 0;
      }

      // ダウンロードの完了を待機（30秒タイムアウト）
      const downloadPath = await download.path().catch((error) => {
        console.error("ダウンロードパスの取得に失敗しました:", error);
        return null;
      });

      if (!downloadPath) {
        console.log("ダウンロードパスが取得できません。処理を中止します。");
        return 0;
      }

      return await this.processCsvAndSave(downloadPath);
    } catch (error) {
      console.error("クリックログ取得エラー:", error);
      return 0;
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (error) {
          console.error("ブラウザのクローズに失敗しました:", error);
        }
      }
    }
  }

  private async processCsvAndSave(filePath: string): Promise<number> {
    const buffer = fs.readFileSync(filePath);
    const utf8Data = iconv.decode(buffer, "Shift_JIS");

    const records = parse(utf8Data, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    await this.repository.save(records);

    // 一時ファイルの削除
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error("一時ファイルの削除に失敗しました:", error);
    }

    return records.length;
  }
}
