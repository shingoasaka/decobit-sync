import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";
import { HanikamuClickLogRepository } from "../repositories/click-logs.repository";
import { getNowJst } from "src/libs/date-utils";
import { format } from "date-fns";

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
      await page.getByRole("link", { name: " Reports" }).click();
      await page.getByRole("link", { name: "LP別" }).click();
      await page.goto("https://www.82comb.net/partner/report/lp");
      await page.getByLabel("広告選択").selectOption("1176");

      // 日付フィルタ適用
      const today = getNowJst();
      const day = format(today, "d");

      await page.locator("#search input[name='start_date']").click();
      await page.getByRole("cell", { name: day }).first().click();
      await page.locator("#search input[name='end_date']").click();
      await page.getByRole("cell", { name: day }).first().click();

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
