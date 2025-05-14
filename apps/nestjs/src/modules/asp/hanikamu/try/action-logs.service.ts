import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import { HanikamuActionLogRepository } from "../repositories/action-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";
import { getNowJst } from "src/libs/date-utils";
import { format } from "date-fns";

@Injectable()
export class TryActionLogService implements LogService {
  constructor(
    private readonly repository: HanikamuActionLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      // ブラウザを起動 (ヘッドレスモード)
      browser = await chromium.launch({ headless: true });

      // 新しいブラウザコンテキストを作成
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto("https://www.82comb.net/partner/login");
      await page.fill(
        'input[name="c_login_name"]',
        process.env.HANIKAMU_USERNAME ?? "",
      );
      await page.fill(
        'input[name="c_login_password"]',
        process.env.HANIKAMU_PASSWORD ?? "",
      );

      await Promise.all([page.click('input[name="clientlogin"]')]);

      await page.click("//a[@href='/partner/conversion/tracking']");
      await page.waitForTimeout(2000);

      await page.locator("#select_site").selectOption("1176");
      await page.waitForTimeout(1000);

      // 日付フィルタ適用
      const today = getNowJst();
      const day = format(today, "d");  // "14" のような形式

      await page.locator('input[name="start_date"]').click();
      await page.getByRole("cell", { name: day }).first().click();
      await page.locator('input[name="end_date"]').click();
      await page.getByRole("cell", { name: day }).first().click();

      await page.locator("label").filter({ hasText: "成果発生日" }).click();

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
