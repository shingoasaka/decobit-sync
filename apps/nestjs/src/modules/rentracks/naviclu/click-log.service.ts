import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { PrismaService } from "@prismaService";
import { LogService } from "src/modules/logs/types";
import { RentracksClickLogRepository } from "../click-log.repository";
import dotenv from "dotenv";
import { getToday } from "src/libs/date-utils";

dotenv.config();

@Injectable()
export class NavicluClickLogService implements LogService {
  constructor(
    private readonly repository: RentracksClickLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto("https://manage.rentracks.jp/manage/login");
      await page.fill(
        'input[name="idMailaddress"]',
        process.env.RENTRACKS_USERNAME ?? "",
      );
      await page.fill(
        'input[name="idLoginPassword"]',
        process.env.RENTRACKS_PASSWORD ?? "",
      );
      await page.getByRole("button", { name: "SIGN IN" }).click();

      await page.click('a:has-text("アクセス統計")');
      await page
        .locator("#hnavInner")
        .getByRole("link", { name: "アクセス統計（備考別）" })
        .click();
      await page.getByRole("combobox", { name: "すべての広告主" }).click();
      await page
        .getByRole("treeitem", {
          name: "株式会社エイチームライフデザイン(ナビクル車査定)",
        })
        .click();
      await page.waitForTimeout(1000);

      const today = getToday();
      await page.locator("#idTermSelect").selectOption(today);
      await page.getByRole("button", { name: "再表示" }).click();

      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "ダウンロード" }).click();
      const download = await downloadPromise;
      const downloadPath = await download.path();

      return await this.processCsvAndSave(downloadPath);
    } catch (error) {
      console.error("エラー発生: ", error);
      return 0;
    } finally {
      if (browser) await browser.close();
    }
  }

  private async processCsvAndSave(filePath: string): Promise<number> {
    const buffer = fs.readFileSync(filePath);
    const utf8Data = iconv.decode(buffer, "Shift_JIS");
    const records = parse(utf8Data, { columns: true, skip_empty_lines: true });
    await this.repository.save(records);
    return records.length;
  }
}
