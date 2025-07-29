import { Injectable } from "@nestjs/common";
import { Browser, Page, Download } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import dotenv from "dotenv";
import { BaseAspService } from "../../base/base-asp.service";
import { writeToSpreadsheet, convertTo2DArray } from "../../../../libs/spreadsheet-utils";

dotenv.config();

interface RawLadData {
  [key: string]: string | undefined;
}

@Injectable()
export class WebanntenaActionLogYesterdayService extends BaseAspService implements LogService {
  constructor() {
    super(WebanntenaActionLogYesterdayService.name);
  }

  async fetchAndInsertLogs(): Promise<RawLadData[]> {
    console.log("🧪 fetchAndInsertLogs 実行されました");

    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performWebanntenaActionOperation(page);
      },
      "Webanntenaアクションログ取得エラー",
    );

    return result || [];
  }

  private async performWebanntenaActionOperation(page: Page): Promise<RawLadData[]> {
    await this.navigateToPage(page, "https://report.webantenna.info/");

    await page.waitForTimeout(3000);

    await page.locator("#password").fill(process.env.WEBANNTENA_PASSWORD ?? "");
    await page.locator("#user_name").fill(process.env.WEBANNTENA_ID ?? "");

    await page.waitForTimeout(3000);
    await page.locator("#submit_button").click();

    // ログイン成功後の目印となる要素を待機
    await page.waitForSelector("#id-csv-download", { timeout: 3000 });

    // バナークリックとページ読み込み待機
    await page.getByAltText("バナー").click();
    await page.waitForLoadState("domcontentloaded");

    await page.waitForSelector("#id-csv-download", { timeout: 10000 });
    await page.locator("#id-term-yesterday").click();

    const downloadButton = page.locator("#id-csv-download");

    let download: Download | null = null;
    try {
      const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
      await downloadButton.click();
      download = await downloadPromise;
    } catch (error) {
      this.logger.error("📛 ダウンロード待機中にエラーが発生しました:", error);
    }

    if (!download) {
      this.logger.warn("⚠️ ダウンロードイベントが取得できませんでした。処理を中止します。");
      return [];
    }

    const downloadPath = await download.path();
    if (!downloadPath) {
      this.logger.warn("⚠️ ダウンロードパスが無効です。");
      return [];
    }

    const buffer = fs.readFileSync(downloadPath);
    this.logger.log(`📁 ${buffer.length} bytes のデータを取得しました`);

    const rawData = this.parseCsvFromBuffer(buffer);
    console.log("🧪 rawData 件数:", rawData.length);

    try {
      await writeToSpreadsheet({
        spreadsheetId: process.env.SPREADSHEET_ID_WEBANNTENA || "",
        sheetName: "TBC_Yesterday_test",
        values: convertTo2DArray(rawData),
      });
      this.logger.log("✅ スプレッドシートへの書き出しに成功しました。");
    } catch (e) {
      this.logger.error(`📛 スプレッドシートへの書き出しに失敗しました: ${e}`);
    }

    return rawData;
  }

  private parseCsvFromBuffer(buffer: Buffer): RawLadData[] {
    try {
      const utf8Data = iconv.decode(buffer, "Shift_JIS");

      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as RawLadData[];

      if (!records || records.length === 0) {
        this.logger.warn("CSVにデータがありませんでした");
        return [];
      }

      return records;
    } catch (error) {
      throw new Error(
        `CSVバッファの処理に失敗しました: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}

