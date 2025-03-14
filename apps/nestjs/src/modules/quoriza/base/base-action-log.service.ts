import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";
import { QuorizaActionLogRepository } from "../action-log.repository";

@Injectable()
export abstract class  QuorizaBaseActionLogService implements LogService {
  constructor(
    protected readonly repository: QuorizaActionLogRepository,
    protected readonly prisma: PrismaService,
  ) {}

  protected abstract getUsername(): string;
  protected abstract getPassword(): string;

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      // ログイン処理
      await page.goto("https://quoriza.net/partner/login");
      await page
        .getByRole("textbox", { name: "Enter loginname" })
        .fill(this.getUsername());
      await page
        .getByRole("textbox", { name: "Enter password" })
        .fill(this.getPassword());
      await page.getByRole("button", { name: "LOGIN" }).click();

      // メインページへ遷移
      await page.waitForTimeout(2000);
      await page.goto("https://quoriza.net/partner/main");

      // コンバージョンページへ遷移
      await page.click("//a[@href='/partner/conversion/tracking']");

      // 日付フィルタ適用（「今日」ボタンをクリック）
      await page.getByRole("link", { name: "今日" }).click();
      await page.locator("label").filter({ hasText: "成果発生日" }).click();

      // CSVダウンロード
      const downloadPromise = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "  上記条件でCSVダウンロード" })
        .click();
      const download = await downloadPromise;

      const downloadPath = await download.path();
      if (!downloadPath) {
        return 0;
      }

      return await this.processCsvAndSave(downloadPath);
    } catch (error) {
      console.error("Error during fetchAndInsertLogs:", error);
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
