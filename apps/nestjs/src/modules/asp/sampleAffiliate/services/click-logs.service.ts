// import { Injectable } from "@nestjs/common";
// import { Browser, Page } from "playwright";
// import { SampleAffiliateClickLogRepository } from "../repositories/click-logs.repository";
// import * as fs from "fs";
// import { parse } from "csv-parse/sync";
// import * as iconv from "iconv-lite";
// import { LogService } from "src/modules/logs/types";
// import { BaseAspService } from "../../base/base-asp.service";

// interface SampleAffiliateSelectors {
//   LOGIN: {
//     ID: string;
//     PASSWORD: string;
//     SUBMIT: string;
//   };
//   REPORT: {
//     REPORT_MENU: string;
//     ACTION_TAB: string;
//     MEDIA: string;
//     TODAY: string;
//     SEARCH_BUTTON: string;
//     DOWNLOAD: string;
//   };
//   DOWNLOAD_DIALOG: {
//     IFRAME: string;
//     CONFIRM_BUTTON: string;
//   };
// }

// const SELECTORS: SampleAffiliateSelectors = {
//   LOGIN: {
//     ID: 'input[type="text"][name="mail"]',
//     PASSWORD: 'input[type="password"][name="pass"]',
//     SUBMIT: 'div.btn-block.btn-login input[type="submit"]',
//   },
//   REPORT: {
//     REPORT_MENU: ".side-menu .s-report.dropdown-icon > span",
//     ACTION_TAB: '.side-menu .s-report ul li a[href="./view.php?type=report"]',
//     MEDIA: 'input[type="radio"][name="target"][value="media"]',
//     TODAY: 'input[type="radio"][name="date_type"][value="0d"]',
//     SEARCH_BUTTON: 'input[type="submit"][value="検索する"]',
//     DOWNLOAD: '.btn-csv a.thickbox[title="検索結果をCSVダウンロード"]',
//   },
//   DOWNLOAD_DIALOG: {
//     IFRAME: "#TB_iframeContent",
//     CONFIRM_BUTTON: '.btn-send.btn-csv[value="CSVファイルをダウンロード"]',
//   },
// } as const;

// const WAIT_TIME = {
//   SHORT: 2000,
// } as const;

// interface RawSampleAffiliateData {
//   [key: string]: string | null | undefined;
//   クリック日時?: string;
//   メディア?: string;
//   "アクセス数[件]"?: string;
// }

// @Injectable()
// export class SampleAffiliateClickLogService
//   extends BaseAspService
//   implements LogService
// {
//   constructor(private readonly repository: SampleAffiliateClickLogRepository) {
//     super(SampleAffiliateClickLogService.name);
//   }

//   async fetchAndInsertLogs(): Promise<number> {
//     const result = await this.executeWithBrowser(
//       async (browser: Browser, page: Page) => {
//         return await this.performSampleAffiliateOperation(page);
//       },
//       "SampleAffiliateクリックログ取得エラー",
//     );

//     return result || 0;
//   }

//   private async performSampleAffiliateOperation(page: Page): Promise<number> {
//     await this.navigateToPage(page, process.env.SAMPLE_AFFILIATE_URL ?? "");

//     await page.fill(SELECTORS.LOGIN.ID, process.env.SAMPLE_AFFILIATE_ID ?? "");
//     await page.fill(
//       SELECTORS.LOGIN.PASSWORD,
//       process.env.SAMPLE_AFFILIATE_PASSWORD ?? "",
//     );
//     await (await page.waitForSelector(SELECTORS.LOGIN.SUBMIT)).click();
//     await page.waitForLoadState("networkidle");
//     await page.waitForTimeout(WAIT_TIME.SHORT);

//     try {
//       await (await page.waitForSelector(SELECTORS.REPORT.REPORT_MENU)).click();
//       await page.waitForTimeout(WAIT_TIME.SHORT);

//       await (await page.waitForSelector(SELECTORS.REPORT.ACTION_TAB)).click();
//       await page.waitForTimeout(WAIT_TIME.SHORT);

//       await (await page.waitForSelector(SELECTORS.REPORT.MEDIA)).click();
//       await page.waitForTimeout(WAIT_TIME.SHORT);

//       await (await page.waitForSelector(SELECTORS.REPORT.TODAY)).click();
//       await page.waitForTimeout(WAIT_TIME.SHORT);
//       await (
//         await page.waitForSelector(SELECTORS.REPORT.SEARCH_BUTTON)
//       ).click();
//       await page.waitForTimeout(WAIT_TIME.SHORT);

//       const downloadButton = await page.$(SELECTORS.REPORT.DOWNLOAD);
//       if (!downloadButton) {
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

//     const downloadPath = await this.initiateAndHandleDownload(page);
//     if (!downloadPath) {
//       this.logger.warn("ダウンロードパスが取得できません。処理を中止します。");
//       return 0;
//     }

//     const rawData = await this.processCsv(downloadPath);
//     const formattedData = await this.transformData(rawData);
//     return await this.repository.save(formattedData);
//   }

//   private async initiateAndHandleDownload(page: Page): Promise<string | null> {
//     try {
//       await this.clickDownloadLink(page);

//       const frameElement = await page.waitForSelector(
//         SELECTORS.DOWNLOAD_DIALOG.IFRAME,
//       );
//       const frame = await frameElement.contentFrame();

//       if (!frame) {
//         this.logger.error("ダウンロードダイアログのiframeが見つかりません");
//         return null;
//       }

//       const confirmButton = await frame.waitForSelector(
//         SELECTORS.DOWNLOAD_DIALOG.CONFIRM_BUTTON,
//       );
//       if (!confirmButton) {
//         this.logger.error("ダウンロード確認ボタンが見つかりません");
//         return null;
//       }

//       const [download] = await Promise.all([
//         this.waitForDownload(page),
//         confirmButton.click(),
//       ]).catch((error: unknown) => {
//         this.logger.error("ダウンロード待機中にエラーが発生しました:", error);
//         return [null];
//       });

//       if (!download) {
//         this.logger.warn("ダウンロードイベントが取得できませんでした。");
//         return null;
//       }

//       const downloadPath = await download.path().catch((error: unknown) => {
//         this.logger.error("ダウンロードパスの取得に失敗しました:", error);
//         return null;
//       });

//       return downloadPath;
//     } catch (error: unknown) {
//       this.logger.error("ダウンロード中にエラーが発生しました:", error);
//       return null;
//     }
//   }

//   private async clickDownloadLink(page: Page): Promise<void> {
//     const downloadLink = await page.waitForSelector(SELECTORS.REPORT.DOWNLOAD);
//     if (!downloadLink) {
//       throw new Error("ダウンロードリンクが見つかりません");
//     }
//     await downloadLink.click();
//     await page.waitForTimeout(WAIT_TIME.SHORT);
//   }

//   private async processCsv(
//     filePath: string,
//   ): Promise<RawSampleAffiliateData[]> {
//     try {
//       const buffer = fs.readFileSync(filePath);
//       const utf8Data = iconv.decode(buffer, "Shift_JIS");
//       const records = parse(utf8Data, {
//         columns: true,
//         skip_empty_lines: true,
//       }) as RawSampleAffiliateData[];

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

//   private async transformData(rawData: RawSampleAffiliateData[]) {
//     const formatted = await Promise.all(
//       rawData
//         .filter((item) => {
//           if (!item.メディア) {
//             this.logger.warn(
//               `Skipping invalid record: ${JSON.stringify(item)}`,
//             );
//             return false;
//           }
//           return true;
//         })
//         .map(async (item) => {
//           try {
//             const affiliateLinkName = item.メディア?.trim();
//             if (!affiliateLinkName) {
//               this.logger.warn("メディアが空です");
//               return null;
//             }

//             const current_total_clicks = this.toInt(item["アクセス数[件]"]);
//             const affiliateLink =
//               await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

//             return {
//               affiliate_link_id: affiliateLink.id,
//               current_total_clicks,
//               referrer_link_id: null,
//               referrer_url: null,
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

//   private toInt(value: string | null | undefined): number {
//     if (!value) return 0;
//     try {
//       const cleanValue = value.replace(/[,¥]/g, "");
//       const num = parseInt(cleanValue, 10);
//       return isNaN(num) ? 0 : num;
//     } catch (error) {
//       this.logger.warn(`Invalid number format: ${value}`);
//       return 0;
//     }
//   }
// }
