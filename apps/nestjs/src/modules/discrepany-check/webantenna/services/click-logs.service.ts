import { Injectable } from "@nestjs/common";
import { chromium, Browser } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import { PrismaService } from "@prismaService";
import { WebantennaClickLogRepository } from "../repositories/click-logs.repository";

@Injectable()
export class WebantennaClickLogService implements LogService {
  private readonly SELECTORS = {
    LOGIN: {
      USERNAME: 'input[name="user_name"]',
      PASSWORD: 'input[name="password"]',
      SUBMIT: 'input[type="image"][id="submit_button"]',
    },
    REPORT: {
      BANNER_TAB: "#id-tab-banner",
      TODAY: "#id-term-today",
      DOWNLOAD: "#id-csv-download",
    },
  };

  constructor(
    private readonly repository: WebantennaClickLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto("https://report.webantenna.info/");

      // ログイン処理
      await page.fill(
        this.SELECTORS.LOGIN.USERNAME,
        process.env.WEBANTENNA_USER_ID ?? "",
      );
      await page.fill(
        this.SELECTORS.LOGIN.PASSWORD,
        process.env.WEBANTENNA_PASSWORD ?? "",
      );

      await (await page.waitForSelector(this.SELECTORS.LOGIN.SUBMIT)).click();
      await page.waitForLoadState("networkidle");

      // レポート画面の操作
      await (
        await page.waitForSelector(this.SELECTORS.REPORT.BANNER_TAB)
      ).click();
      await page.waitForTimeout(2000);
      await (await page.waitForSelector(this.SELECTORS.REPORT.TODAY)).click();
      await page.waitForTimeout(2000);

      // ダウンロード処理
      const downloadPromise = page.waitForEvent("download");
      await (
        await page.waitForSelector(this.SELECTORS.REPORT.DOWNLOAD)
      ).click();
      const download = await downloadPromise;

      const downloadPath = await download.path();
      if (!downloadPath) {
        throw new Error("ダウンロードパスが取得できません");
      }

      return await this.processCsvAndSave(downloadPath);
    } catch (error) {
      console.error(
        "Error in fetchAndInsertLogs:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return 0;
    } finally {
      await browser?.close();
    }
  }

  private async processCsvAndSave(filePath: string): Promise<number> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = iconv.decode(buffer, "Shift_JIS");

      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        relax_quotes: true,
      });

      if (!Array.isArray(records) || records.length === 0) {
        console.warn("CSVにレコードが存在しません");
        return 0;
      }

      await this.repository.save(records);
      return records.length;
    } catch (error) {
      console.error(
        "Error in processCsvAndSave:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return 0;
    }
  }
}
