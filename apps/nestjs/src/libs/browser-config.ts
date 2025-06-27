import { chromium, Browser, BrowserContext, Page } from "playwright";

/**
 * GCP対応のブラウザ設定を管理するクラス
 * 全ASPサービスで共通して使用
 */
export class BrowserConfig {
  /**
   * GCP対応のブラウザを起動
   */
  static async launchBrowser(): Promise<Browser> {
    return await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
      timeout: 30000,
    });
  }

  /**
   * ブラウザコンテキストを作成
   */
  static async createContext(browser: Browser): Promise<BrowserContext> {
    return await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 720 },
    });
  }

  /**
   * ページを作成
   */
  static async createPage(context: BrowserContext): Promise<Page> {
    const page = await context.newPage();

    // デフォルトタイムアウト設定
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(30000);

    return page;
  }

  /**
   * ブラウザを安全にクローズ
   */
  static async closeBrowser(browser: Browser | null): Promise<void> {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error("ブラウザのクローズに失敗しました:", error);
      }
    }
  }
}
