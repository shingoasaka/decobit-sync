import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { PrismaService } from "@prismaService";
import { SampleAffiliateActionLogRepository } from "../repositories/action-logs.repository";

@Injectable()
export class SampleAffiliateActionLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: SampleAffiliateActionLogRepository,
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

      // ✅ ログイン処理
      await page.goto("https://spectrum-sm.com/contents.php?c=user_login", {
        waitUntil: "domcontentloaded",
      });
      await page
        .locator('input[name="mail"]')
        .fill(process.env.SAMPLE_AFFILIATE_ID ?? "");
      await page
        .locator('input[name="pass"]')
        .fill(process.env.SAMPLE_AFFILIATE_PASSWORD ?? "");
      await page.getByRole("button", { name: "ログイン" }).click();

      // ログイン後のページ読み込み完了を待機
      await page.waitForLoadState("domcontentloaded");

      await page.getByRole("link", { name: "成果管理" }).click();
      await page.waitForLoadState("domcontentloaded");

      await page.getByRole("radio", { name: "今日" }).first().check();
      await page.getByRole("radio", { name: "今日" }).nth(1).check();
      await page.getByRole("button", { name: "検索する" }).click();

      // 検索結果のロードを待機
      await page.waitForLoadState("domcontentloaded");

      // ✅ CSVダウンロード画面に遷移
      const csvDownloadLink = page.getByRole("link", {
        name: "検索結果をCSVダウンロード",
      });

      // リンクが存在するか確認
      const isLinkVisible = await csvDownloadLink
        .isVisible()
        .catch(() => false);
      if (!isLinkVisible) {
        console.log(
          "CSVダウンロードリンクが見つかりません。データがない可能性があります。",
        );
        return 0;
      }

      await csvDownloadLink.click();

      // ✅ iframe のロードを明示的に待つ
      try {
        await page.waitForSelector('iframe[name^="TB_iframeContent"]', {
          timeout: 20000,
        });
      } catch (error) {
        console.error("iframeのロード中にタイムアウトしました:", error);
        console.log("処理を中止します。");
        return 0;
      }

      // ✅ iframe を取得（`name` が変化する問題を `name^="TB_iframeContent"` で解決）
      const iframeLocator = page.locator('iframe[name^="TB_iframeContent"]');
      const iframeElement = await iframeLocator.elementHandle();
      const iframeContent = await iframeElement?.contentFrame();
      if (!iframeContent) {
        console.log("Iframe not found. 処理を中止します。");
        return 0;
      }

      // ダウンロードボタンが表示されるまで待機（タイムアウト短縮）
      try {
        await iframeContent.waitForSelector(
          'input[value="CSVファイルをダウンロード"]',
          {
            state: "visible",
            timeout: 20000,
          },
        );
      } catch (error) {
        console.log("ダウンロードボタンが見つかりません。処理を中止します。");
        return 0;
      }

      // ✅ ダウンロードボタンをクリック
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 45000 }), // タイムアウトを45秒に短縮
        iframeContent
          .getByRole("button", { name: "CSVファイルをダウンロード" })
          .click(),
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

      // ✅ ファイルの保存パスを取得
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
      console.error("サンプルアフィリエイトログ取得エラー:", error);
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
