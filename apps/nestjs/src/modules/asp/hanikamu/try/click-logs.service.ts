import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";
import { HanikamuClickLogRepository } from "../repositories/click-logs.repository";
import { getNowJst, formatDateTime } from "src/libs/date-utils";

@Injectable()
export class TryClickLogService implements LogService {
  constructor(
    private readonly repository: HanikamuClickLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      // ログイン処理
      await page.goto("https://www.82comb.net/partner/login");
      await page
        .getByRole("textbox", { name: "Enter loginname" })
        .fill(process.env.HANIKAMU_USERNAME ?? "");
      await page
        .getByRole("textbox", { name: "Enter password" })
        .fill(process.env.HANIKAMU_PASSWORD ?? "");
      await page.getByRole("button", { name: "LOGIN" }).click();

      await page.waitForTimeout(2000);
      await page.getByRole("link", { name: " Reports" }).click();
      await page.getByRole("link", { name: "LP別" }).click();
      await page.goto("https://www.82comb.net/partner/report/lp");
      // ページの読み込みを待つ
      await page.waitForLoadState("networkidle");

      await page.getByLabel("広告選択").selectOption("1176");
      // 選択後のページ更新を待つ
      await page.waitForLoadState("networkidle");

      // 今日の日付を取得
      const today = getNowJst();
      const formattedDate = formatDateTime(today).split(" ")[0];

      try {
        // 日付フィルタ適用
        // 入力フィールドが表示されるのを待つ
        await page.waitForSelector('input[name="start_date"]');
        await page.waitForSelector('input[name="end_date"]');

        // 日付を設定
        await page.fill('input[name="start_date"]', formattedDate);
        await page.fill('input[name="end_date"]', formattedDate);

        // 日付入力後のページ更新を待つ
        await page.waitForLoadState("networkidle");

        // CSVダウンロード
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 60000 }),
          page
            .getByRole("button", { name: "  上記条件でCSVダウンロード" })
            .click(),
        ]);

        const downloadPath = await download.path();
        if (!downloadPath) {
          throw new Error("ダウンロードパスが取得できません");
        }

        return await this.processCsvAndSave(downloadPath);
      } catch (error) {
        console.error("Error during fetchAndInsertLogs:", error);
        return 0;
      }
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
