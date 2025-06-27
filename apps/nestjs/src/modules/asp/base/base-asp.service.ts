import { Injectable, Logger } from "@nestjs/common";
import { Browser, Page } from "playwright";
import { BrowserConfig } from "src/libs/browser-config";

/**
 * ASPサービスのベースクラス
 * ブラウザ操作の共通処理を提供
 */
@Injectable()
export abstract class BaseAspService {
  protected readonly logger: Logger;

  constructor(serviceName: string) {
    this.logger = new Logger(serviceName);
  }

  /**
   * ブラウザセットアップの共通処理
   */
  protected async setupBrowser(): Promise<{ browser: Browser; page: Page }> {
    const browser = await BrowserConfig.launchBrowser();
    const context = await BrowserConfig.createContext(browser);
    const page = await BrowserConfig.createPage(context);

    return { browser, page };
  }

  /**
   * ブラウザクリーンアップの共通処理
   */
  protected async cleanupBrowser(browser: Browser | null): Promise<void> {
    await BrowserConfig.closeBrowser(browser);
  }

  /**
   * エラーハンドリング付きのブラウザ操作実行
   */
  protected async executeWithBrowser<T>(
    operation: (browser: Browser, page: Page) => Promise<T>,
    errorMessage: string = "ブラウザ操作でエラーが発生しました",
  ): Promise<T | null> {
    let browser: Browser | null = null;

    try {
      const { browser: browserInstance, page } = await this.setupBrowser();
      browser = browserInstance;

      return await operation(browser, page);
    } catch (error) {
      this.logger.error(errorMessage, error);
      return null;
    } finally {
      await this.cleanupBrowser(browser);
    }
  }

  /**
   * ページナビゲーションの共通処理
   */
  protected async navigateToPage(
    page: Page,
    url: string,
    waitUntil: "domcontentloaded" | "load" | "networkidle" = "domcontentloaded",
  ): Promise<void> {
    await page.goto(url, { waitUntil });
  }

  /**
   * 要素待機の共通処理
   */
  protected async waitForElement(
    page: Page,
    selector: string,
    timeout: number = 30000,
  ): Promise<void> {
    await page.waitForSelector(selector, { timeout });
  }

  /**
   * ダウンロード待機の共通処理
   */
  protected async waitForDownload(
    page: Page,
    timeout: number = 45000,
  ): Promise<any> {
    return await page.waitForEvent("download", { timeout });
  }
}
