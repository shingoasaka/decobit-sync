// import { Injectable } from "@nestjs/common";
// import { Browser, Page } from "playwright";
// import { MonkeyActionLogRepository } from "../repositories/action-logs.repository";
// import * as fs from "fs";
// import { parse } from "csv-parse/sync";
// import { LogService } from "src/modules/logs/types";
// import { parseToJst } from "src/libs/date-utils";
// import { BaseAspService } from "../../base/base-asp.service";

// interface RawMonkeyData {
//   成果日時?: string;
//   タグ?: string;
//   リファラ?: string;
// }

// @Injectable()
// export class MonkeyActionLogService
//   extends BaseAspService
//   implements LogService
// {
//   constructor(private readonly repository: MonkeyActionLogRepository) {
//     super(MonkeyActionLogService.name);
//   }

//   async fetchAndInsertLogs(): Promise<number> {
//     const result = await this.executeWithBrowser(
//       async (browser: Browser, page: Page) => {
//         return await this.performMonkeyActionOperation(page);
//       },
//       "Monkeyアクションログ取得エラー",
//     );

//     return result || 0;
//   }

//   private async performMonkeyActionOperation(page: Page): Promise<number> {
//     const url = process.env.MONKEY_URL;
//     if (!url) {
//       this.logger.error("MONKEY_URL is not defined");
//       return 0;
//     }

//     await this.navigateToPage(page, url);

//     await page.fill('input[type="text"].ef', process.env.MONKEY_ID ?? "");
//     await page.fill(
//       'input[type="password"].ef',
//       process.env.MONKEY_PASSWORD ?? "",
//     );
//     await (await page.waitForSelector("button.button.button-squere")).click();
//     await page.waitForLoadState("networkidle");
//     await page.waitForTimeout(2000);

//     try {
//       await (
//         await page.waitForSelector(
//           'li[data-v-1e3b336f] div[data-v-1e3b336f] a[href="#/logs"].has-text-white',
//         )
//       ).click();
//       await page.waitForTimeout(2000);

//       // 検索結果の有無を確認
//       const noDataElement = await page.$(".log-not-found");
//       if (noDataElement) {
//         this.logger.warn("検索結果が存在しません");
//         return 0;
//       }
//     } catch (error: unknown) {
//       this.logger.error(
//         "レポートナビゲーション中にエラーが発生しました:",
//         error,
//       );
//       return 0;
//     }

//     const [download] = await Promise.all([
//       this.waitForDownload(page),
//       (
//         await page.waitForSelector("button[data-v-2e9de55a].button.is-small")
//       ).click(),
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

//   private async processCsv(filePath: string): Promise<RawMonkeyData[]> {
//     try {
//       const buffer = fs.readFileSync(filePath);
//       const utf8Data = buffer.toString("utf8").replace(/^\uFEFF/, "");

//       const records = parse(utf8Data, {
//         columns: true,
//         skip_empty_lines: true,
//       }) as RawMonkeyData[];

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
//         this.logger.error("一時ファイルの削除に失敗しました:", error);
//       }
//     }
//   }

//   private async transformData(rawData: RawMonkeyData[]) {
//     const formatted = await Promise.all(
//       rawData
//         .filter((item) => {
//           if (!item["成果日時"] || !item["タグ"]) {
//             this.logger.warn(
//               `Skipping invalid record: ${JSON.stringify(item)}`,
//             );
//             return false;
//           }
//           return true;
//         })
//         .map(async (item) => {
//           try {
//             const actionDateTime = parseToJst(item["成果日時"]);
//             const affiliateLinkName = item["タグ"]?.trim();
//             const referrer_url = item["リファラ"]?.trim() || null;

//             if (!actionDateTime) {
//               this.logger.warn(`Invalid date format: ${item["成果日時"]}`);
//               return null;
//             }

//             if (!affiliateLinkName) {
//               this.logger.warn("タグ名が空です");
//               return null;
//             }

//             const affiliateLink =
//               await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

//             const { referrerLinkId, referrer_url: processedReferrerUrl } =
//               await this.repository.processReferrerLink(referrer_url);

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
