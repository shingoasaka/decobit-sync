import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { PrismaService } from "@prismaService";
import { LogService } from "src/modules/logs/types";
import dotenv from "dotenv";
import { LadActionLogRepository } from "../repositories/action-logs.repository";

dotenv.config();

@Injectable()
export class LadActionLogService implements LogService {
  constructor(
    private readonly repository: LadActionLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        acceptDownloads: true,
      });
      const page = await context.newPage();

      await page.goto("https://admin038.l-ad.net/front/login/");

      await page
        .getByRole("textbox", { name: "ログインID" })
        .fill(process.env.LAD_USERNAME ?? "");
      await page
        .getByRole("textbox", { name: "パスワード" })
        .fill(process.env.LAD_PASSWORD ?? "");
      await page.getByRole("button", { name: "ログイン" }).click();

      await page.getByRole("link", { name: "ログ集計" }).click();
      await page.getByRole("link", { name: "成果ログ" }).click();

      await page.getByRole("button", { name: "本日" }).click();

      // CSV生成のクリック
      await page.getByRole("button", { name: " CSV生成" }).click();
      await page.waitForTimeout(10000);
      await page.goto("https://admin038.l-ad.net/admin/actionlog/list");
      
      // ダウンロードの実行（Promise.allパターン使用）
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 60000 }),
        page.click('div.csvInfoExport1 a[href^="javascript:void(0)"]')
      ]);
      
      const downloadPath = await download.path();
      if (!downloadPath) {
        throw new Error("ダウンロードパスが取得できません");
      }

      return await this.processCsvAndSave(downloadPath);
    } catch (error) {
      console.error("Ladログ取得エラー:", error);
      return 0;
    } finally {
      if (browser) await browser.close();
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
