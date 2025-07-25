// import { Injectable } from "@nestjs/common";
// import { Browser, Page } from "playwright";
// import { FinebirdActionLogRepository } from "../repositories/action-logs.repository";
// import * as fs from "fs";
// import { parse } from "csv-parse/sync";
// import { LogService } from "src/modules/logs/types";
// import { PrismaService } from "@prismaService";
// import { processReferrerLink } from "../../base/repository.base";
// import { parseToJst } from "src/libs/date-utils";
// import { BaseAspService } from "../../base/base-asp.service";

// interface RawFinebirdData {
//   注文日時?: string;
//   サイト名?: string;
//   リファラ?: string;
// }

// interface FinebirdSelectors {
//   LOGIN: {
//     ID: string;
//     PASSWORD: string;
//     SUBMIT: string;
//   };
//   REPORT: {
//     OPEN_SEARCH: string;
//     TODAY: string;
//     SEARCH_BUTTON: string;
//     DOWNLOAD: string;
//   };
// }

// const SELECTORS: FinebirdSelectors = {
//   LOGIN: {
//     ID: 'input[type="text"][name="loginId"]',
//     PASSWORD: 'input[type="password"][name="password"]',
//     SUBMIT: 'input[type="submit"][value="パートナー様ログイン"]',
//   },
//   REPORT: {
//     OPEN_SEARCH: "div#searchField .card-header .card-title",
//     TODAY: "#today",
//     SEARCH_BUTTON: "button.btn.btn-info.mt-1",
//     DOWNLOAD: "button.btn.btn-outline-primary.float-end",
//   },
// } as const;

// const WAIT_TIME = {
//   SHORT: 2000,
// } as const;

// @Injectable()
// export class FinebirdActionLogService
//   extends BaseAspService
//   implements LogService
// {
//   constructor(
//     private readonly repository: FinebirdActionLogRepository,
//     private readonly prisma: PrismaService,
//   ) {
//     super(FinebirdActionLogService.name);
//   }

//   async fetchAndInsertLogs(): Promise<number> {
//     const result = await this.executeWithBrowser(
//       async (browser: Browser, page: Page) => {
//         return await this.performFinebirdActionOperation(page);
//       },
//       "Finebirdアクションログ取得エラー",
//     );

//     return result || 0;
//   }

//   private async performFinebirdActionOperation(page: Page): Promise<number> {
//     await this.navigateToPage(page, process.env.FINEBIRD_URL ?? "");

//     await page.fill(SELECTORS.LOGIN.ID, process.env.FINEBIRD_ID ?? "");
//     await page.fill(
//       SELECTORS.LOGIN.PASSWORD,
//       process.env.FINEBIRD_PASSWORD ?? "",
//     );
//     await (await page.waitForSelector(SELECTORS.LOGIN.SUBMIT)).click();
//     await page.waitForLoadState("networkidle");
//     await page.waitForTimeout(WAIT_TIME.SHORT);
//     await page.goto(
//       (process.env.FINEBIRD_URL ?? "") + "partneradmin/report/action/log/list",
//     );

//     const hasData = await this.navigateToReport(page);
//     if (!hasData) {
//       this.logger.warn(
//         "検索結果が存在しないため、ダウンロードをスキップします",
//       );
//       return 0;
//     }

//     const [download] = await Promise.all([
//       this.waitForDownload(page),
//       (await page.waitForSelector(SELECTORS.REPORT.DOWNLOAD)).click(),
//     ]).catch((error: unknown) => {
//       this.logger.error("ダウンロード待機中にエラーが発生しました:", error);
//       return [null];
//     });

//     if (!download) {
//       this.logger.warn(
//         "ダウンロードイベントが取得できませんでした。処理を中止します。",
//       );
//       return 0;
//     }

//     const downloadPath = await download.path().catch((error: unknown) => {
//       this.logger.error("ダウンロードパスの取得に失敗しました:", error);
//       return null;
//     });

//     if (!downloadPath) {
//       this.logger.warn("ダウンロードパスが取得できません。処理を中止します。");
//       return 0;
//     }

//     const rawData = await this.processCsv(downloadPath);
//     const formattedData = await this.transformData(rawData);
//     return await this.repository.save(formattedData);
//   }

//   private async navigateToReport(page: Page): Promise<boolean> {
//     try {
//       await (await page.waitForSelector(SELECTORS.REPORT.OPEN_SEARCH)).click();
//       await page.waitForTimeout(WAIT_TIME.SHORT);
//       await (await page.waitForSelector(SELECTORS.REPORT.TODAY)).click();
//       await page.waitForTimeout(WAIT_TIME.SHORT);
//       await (
//         await page.waitForSelector(SELECTORS.REPORT.SEARCH_BUTTON)
//       ).click();
//       await page.waitForTimeout(WAIT_TIME.SHORT);

//       /**
//        * Finebirdのレポートページでデータが存在しない場合のチェック
//        * Finebirdはデータが存在しない場合、colspan='17'の空のtd要素を表示する
//        * そのため、colspan='17'のtd要素が存在する場合、データが存在しないと判断する
//        */
//       const emptyDataElement = await page.$("td[colspan='17']");
//       if (emptyDataElement) {
//         const emptyDataMessage = await page.evaluate(
//           (el) => el.textContent,
//           emptyDataElement,
//         );
//         if (
//           emptyDataMessage &&
//           emptyDataMessage.includes("該当するデータがありませんでした。")
//         ) {
//           this.logger.warn("検索結果が存在しませんが、処理を継続します");
//           return false;
//         }
//       }

//       return true;
//     } catch (error) {
//       if (error instanceof Error && error.message.includes("TimeoutError")) {
//         throw new Error(
//           "ページ要素の取得に失敗しました。タイムアウトが発生しました。",
//         );
//       }
//       throw error;
//     }
//   }

//   private async processCsv(filePath: string): Promise<RawFinebirdData[]> {
//     try {
//       const buffer = fs.readFileSync(filePath);
//       const utf8Data = buffer.toString("utf8").replace(/^\uFEFF/, "");

//       const records = parse(utf8Data, {
//         columns: true,
//         skip_empty_lines: true,
//       }) as RawFinebirdData[];

//       if (!records || records.length === 0) {
//         this.logger.warn("CSVにデータがありませんでした");
//         return [];
//       }

//       return records;
//     } catch (error) {
//       throw new Error(
//         `CSVの処理に失敗しました: ${error instanceof Error ? error.message : error}`,
//       );
//     } finally {
//       try {
//         fs.unlinkSync(filePath);
//       } catch (error) {
//         this.logger.error("Error deleting temporary file:", error);
//       }
//     }
//   }

//   private async transformData(rawData: RawFinebirdData[]) {
//     const formatted = await Promise.all(
//       rawData
//         .filter((item) => {
//           if (!item["注文日時"] || !item["サイト名"]) {
//             this.logger.warn(
//               `Skipping invalid record: ${JSON.stringify(item)}`,
//             );
//             return false;
//           }
//           return true;
//         })
//         .map(async (item) => {
//           try {
//             const actionDateTime = parseToJst(item["注文日時"]);
//             const affiliateLinkName = item["サイト名"]?.trim();
//             const referrer_url = item["リファラ"] || null;

//             if (!actionDateTime) {
//               this.logger.warn(`Invalid date format: ${item["注文日時"]}`);
//               return null;
//             }

//             if (!affiliateLinkName) {
//               this.logger.warn("サイト名が空です");
//               return null;
//             }

//             const affiliateLink =
//               await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

//             const { referrerLinkId, referrer_url: processedReferrerUrl } =
//               await processReferrerLink(this.prisma, this.logger, referrer_url);

//             return {
//               actionDateTime,
//               affiliate_link_id: affiliateLink.id,
//               referrer_link_id: referrerLinkId,
//               referrer_url: processedReferrerUrl,
//               uid: null,
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
// }
