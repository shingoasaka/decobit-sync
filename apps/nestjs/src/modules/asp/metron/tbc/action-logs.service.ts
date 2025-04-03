import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { PrismaService } from "@prismaService";
import { LogService } from "src/modules/logs/types";
import dotenv from "dotenv";
import { MetronActionLogRepository } from "../repositories/action-logs-repository";

dotenv.config();

@Injectable()
export class TbcActionLogService implements LogService {
  constructor(
    private readonly repository: MetronActionLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto("https://sb.me-tron.net/partner/login");

      await page.locator('input[name="loginId"]').fill(process.env.METRON_USERNAME ?? "");
      await page.locator('input[name="password"]').fill(process.env.METRON_PASSWORD ?? "");

      await page.getByRole('button', { name: 'パートナー様ログイン' }).click();

      await page.getByRole('link', { name: ' レポート' }).click();
      await page.getByRole('link', { name: '獲得ログ' }).click();
      await page.getByRole('heading', { name: ' 検索条件' }).click();

      await page.getByRole('button', { name: '本日' }).click();
      await page.getByRole('button', { name: '検索する' }).click();

      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "CSVダウンロード" }).click();
      const download = await downloadPromise;
      const downloadPath = await download.path();

      if (!downloadPath) return 0;
      return await this.processCsvAndSave(downloadPath);
    } catch (error) {
      console.error("MeTron ログ取得エラー:", error);
      return 0;
    } finally {
      if (browser) await browser.close();
    }
  }

  private async processCsvAndSave(filePath: string): Promise<number> {
    const buffer = fs.readFileSync(filePath);
    const utf8Data = iconv.decode(buffer, "utf-8");
    
    const records = parse(utf8Data, {
      columns: true, 
      skip_empty_lines: true 
    });

    await this.repository.save(records);

    return records.length;
  }
}
