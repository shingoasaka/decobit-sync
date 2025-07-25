// import { Injectable } from "@nestjs/common";
// import { Browser, Page } from "playwright";
// import { FinebirdClickLogRepository } from "../repositories/click-logs.repository";
// import * as fs from "fs";
// import { parse } from "csv-parse/sync";
// import { LogService } from "src/modules/logs/types";
// import { PrismaService } from "@prismaService";
// import { processReferrerLink } from "../../base/repository.base";
// import { BaseAspService } from "../../base/base-asp.service";

// interface RawFinebirdData {
//   サイト名?: string;
//   総クリック?: string;
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
// export class FinebirdClickLogService
//   extends BaseAspService
//   implements LogService
// {
//   constructor(
//     private readonly repository: FinebirdClickLogRepository,
//     private readonly prisma: PrismaService,
//   ) {
//     super(FinebirdClickLogService.name);
//   }

//   async fetchAndInsertLogs(): Promise<number> {
//     const result = await this.executeWithBrowser(
//       async (browser: Browser, page: Page) => {
//         return await this.performFinebirdOperation(page);
//       },
//       "Finebirdクリックログ取得エラー",
//     );

//     return result || 0;
//   }

//   private async performFinebirdOperation(page: Page): Promise<number> {
//     await this.navigateToPage(page, process.env.FINEBIRD_URL ?? "");

//     await page.fill(SELECTORS.LOGIN.ID, process.env.FINEBIRD_ID ?? "");
//     await page.fill(
//       SELECTORS.LOGIN.PASSWORD,
//       process.env.FINEBIRD_PASSWORD ?? "",
//     );
//     await (await page.waitForSelector(SELECTORS.LOGIN.SUBMIT)).click();
//     await page.waitForLoadState("networkidle");
//     await page.waitForTimeout(WAIT_TIME.SHORT);
//     await page.goto(process.env.FINEBIRD_URL + "partneradmin/report/ad/list");

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

//       const noDataElement = await page.$(".no-data");
//       if (noDataElement) {
//         return false;
//       }

//       return true;
//     } catch (error: unknown) {
//       this.logger.error(
//         "レポートナビゲーション中にエラーが発生しました:",
//         error,
//       );
//       return false;
//     }
//   }

//   private toInt(value: string | null | undefined): number {
//     if (!value) return 0;
//     try {
//       const cleanValue = value.replace(/[,¥]/g, "");
//       const num = parseInt(cleanValue, 10);
//       return isNaN(num) ? 0 : num;
//     } catch (error: unknown) {
//       this.logger.warn(`Invalid number format: ${value}`);
//       return 0;
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
//     } catch (error: unknown) {
//       this.logger.error("CSVの処理に失敗しました:", error);
//       return [];
//     } finally {
//       try {
//         fs.unlinkSync(filePath);
//       } catch (error: unknown) {
//         this.logger.error("Error deleting temporary file:", error);
//       }
//     }
//   }

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
// }
