import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
// import { FinebirdClickLogRepository } from "../repositories/click-logs.repository";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { LogService } from "src/modules/logs/types";
// import { PrismaService } from "@prismaService";
// import { processReferrerLink } from "../../base/repository.base";
import { BaseAspService } from "../../base/base-asp.service";
import { writeToSpreadsheet, convertTo2DArray } from "../../../../libs/spreadsheet-utils";

// interface RawFinebirdData {
interface RawLadData {

//   サイト名?: string;
//   総クリック?: string;
//   リファラ?: string;
  [key: string]: string | undefined;
}

interface FinebirdSelectors {
  LOGIN: {
    ID: string;
    PASSWORD: string;
    SUBMIT: string;
  };
  REPORT: {
    OPEN_SEARCH: string;
    YESTERDAY: string;
    SEARCH_BUTTON: string;
    DOWNLOAD: string;
  };
}

const SELECTORS: FinebirdSelectors = {
  LOGIN: {
    ID: 'input[type="text"][name="loginId"]',
    PASSWORD: 'input[type="password"][name="password"]',
    SUBMIT: 'input[type="submit"][value="パートナー様ログイン"]',
  },
  REPORT: {
    OPEN_SEARCH: "div#searchField .card-header .card-title",
    YESTERDAY: "#yesterday",
    SEARCH_BUTTON: "button.btn.btn-info.mt-1",
    DOWNLOAD: "button.btn.btn-outline-primary.float-end",
  },
} as const;

const WAIT_TIME = {
  SHORT: 2000,
} as const;

@Injectable()
export class FinebirdClickLogYesterdayService
  extends BaseAspService
  implements LogService
{
//   constructor(
//     private readonly repository: FinebirdClickLogRepository,
//     private readonly prisma: PrismaService,
//   ) {
  constructor() {
    super(FinebirdClickLogYesterdayService.name);
  }

//   async fetchAndInsertLogs(): Promise<number> {
  async fetchAndInsertLogs(): Promise<RawLadData[]> {
    console.log("🧪 fetchAndInsertLogs 実行されました");

    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performFinebirdOperation(page);
      },
      "Finebirdクリックログ取得エラー",
    );

    // return result || 0;
    return result || [];
}

//   private async performFinebirdOperation(page: Page): Promise<number> {
  private async performFinebirdOperation(page: Page): Promise<RawLadData[]> {

    await this.navigateToPage(page, process.env.FINEBIRD_URL ?? "");

    await page.fill(SELECTORS.LOGIN.ID, process.env.FINEBIRD_ID ?? "");
    await page.fill(
      SELECTORS.LOGIN.PASSWORD,
      process.env.FINEBIRD_PASSWORD ?? "",
    );
    await (await page.waitForSelector(SELECTORS.LOGIN.SUBMIT)).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(WAIT_TIME.SHORT);
    await page.goto(process.env.FINEBIRD_URL + "partneradmin/report/ad/list");

    const hasData = await this.navigateToReport(page);
    if (!hasData) {
      this.logger.warn(
        "検索結果が存在しないため、ダウンロードをスキップします",
      );
      return [];
    }

    const [download] = await Promise.all([
      this.waitForDownload(page),
      (await page.waitForSelector(SELECTORS.REPORT.DOWNLOAD)).click(),
    ]).catch((error: unknown) => {
      this.logger.error("ダウンロード待機中にエラーが発生しました:", error);
      return [null];
    });

    if (!download) {
      this.logger.warn(
        "ダウンロードイベントが取得できませんでした。処理を中止します。",
      );
      return [];
    }

    const downloadPath = await download.path().catch((error: unknown) => {
      this.logger.error("ダウンロードパスの取得に失敗しました:", error);
      return null;
    });

    if (!downloadPath) {
      this.logger.warn("ダウンロードパスが取得できません。処理を中止します。");
      return [];
    }

    const rawData = await this.processCsv(downloadPath);
    // const formattedData = await this.transformData(rawData);
    // return await this.repository.save(formattedData);
    console.log("🧪 rawData 件数:", rawData.length);
    // スプレッドシート書き込み処理
    try {
    await writeToSpreadsheet({
        spreadsheetId: process.env.SPREADSHEET_ID_FINEBIRD || "",
        sheetName: "afb_click_Yesterday_test",
        values: convertTo2DArray(rawData),
    });

    this.logger.log("スプレッドシートへの書き出しに成功しました。");
    } catch (e) {
    this.logger.error(`スプレッドシートへの書き出しに失敗しました: ${e}`);
    }

    return rawData;       
  }

  private async navigateToReport(page: Page): Promise<boolean> {
    try {
      await (await page.waitForSelector(SELECTORS.REPORT.OPEN_SEARCH)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await (await page.waitForSelector(SELECTORS.REPORT.YESTERDAY)).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);
      await (
        await page.waitForSelector(SELECTORS.REPORT.SEARCH_BUTTON)
      ).click();
      await page.waitForTimeout(WAIT_TIME.SHORT);

      /**
       * Finebirdのレポートページでデータが存在しない場合のチェック
       * Finebirdはデータが存在しない場合、colspan='17'の空のtd要素を表示する
       * そのため、colspan='17'のtd要素が存在する場合、データが存在しないと判断する
       */
      const emptyDataElement = await page.$("td[colspan='12']");
      if (emptyDataElement) {
        const emptyDataMessage = await page.evaluate(
          (el) => el.textContent,
          emptyDataElement,
        );
        if (
          emptyDataMessage &&
          emptyDataMessage.includes("該当するデータがありませんでした。")
        ) {
          this.logger.warn("検索結果が存在しませんが、処理を継続します");
          return false;
        }
      }

      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("TimeoutError")) {
        throw new Error(
          "ページ要素の取得に失敗しました。タイムアウトが発生しました。",
        );
      }
      throw error;
    }
  }

//   private async processCsv(filePath: string): Promise<RawFinebirdData[]> {
  private async processCsv(filePath: string): Promise<RawLadData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = buffer.toString("utf8").replace(/^\uFEFF/, "");

      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
    //   }) as RawFinebirdData[];
      }) as RawLadData[];

      if (!records || records.length === 0) {
        this.logger.warn("CSVにデータがありませんでした");
        return [];
      }

      return records;
    } catch (error: unknown) {
      this.logger.error("CSVの処理に失敗しました:", error);
      return [];
    } finally {
      try {
        fs.unlinkSync(filePath);
      } catch (error: unknown) {
        this.logger.error("Error deleting temporary file:", error);
      }
    }
  }

//   private async transformData(rawData: RawFinebirdData[]) {
//     const formatted = await Promise.all(
//       rawData
//         .filter((item) => {
//           if (!item["サイト名"]) {
//             this.logger.warn(
//               `Skipping invalid record: ${JSON.stringify(item)}`,
//             );
//             return false;
//           }
//           return true;
//         })
//         .map(async (item) => {
//           try {
//             const affiliateLinkName = item["サイト名"]?.trim();
//             const referrer_url = item["リファラ"] || null;

//             if (!affiliateLinkName) {
//               this.logger.warn("サイト名が空です");
//               return null;
//             }

//             const current_total_clicks = this.toInt(item["総クリック"]);

//             const affiliateLink =
//               await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

//             const { referrerLinkId, referrer_url: processedReferrerUrl } =
//               await processReferrerLink(this.prisma, this.logger, referrer_url);

//             return {
//               affiliate_link_id: affiliateLink.id,
//               current_total_clicks,
//               referrer_link_id: referrerLinkId,
//               referrer_url: processedReferrerUrl,
//             };
//           } catch (error) {
//             this.logger.error(
//               `Error processing record: ${JSON.stringify(item)}`,
//               error,
//             );
//             return null;
//           }
//         }),
//     );

//     return formatted.filter(
//       (record): record is NonNullable<typeof record> => record !== null,
//     );
//   }
}
