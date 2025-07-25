// import { Injectable, Logger } from "@nestjs/common";
// import { firstValueFrom } from "rxjs";
// import { formatDateTime, getNowJstForDisplay } from "src/libs/date-utils";
// import { MetronClickLogRepository } from "../repositories/click-logs.repository";
// import { LogService } from "src/modules/logs/types";
// import { parseToJst } from "src/libs/date-utils";
// import { HttpService } from "@nestjs/axios";

// interface RawMetronData {
//   clickDateTime?: string;
//   siteName?: string;
//   referrer?: string;
//   sessionId?: string;
// }

// interface MetronApiResponse {
//   params: {
//     totalNum: string;
//     page: string;
//     logs: RawMetronData[];
//   };
//   errors: (string | object)[];
//   code: number;
// }

// @Injectable()
// export class MetronClickLogService implements LogService {
//   private readonly logger = new Logger(MetronClickLogService.name);
//   private readonly apiUrl = "https://api09.catsasp.net/log/click/listspan";

//   constructor(
//     private readonly http: HttpService,
//     private readonly repository: MetronClickLogRepository,
//   ) {}

//   async fetchAndInsertLogs(): Promise<number> {
//     try {
//       const rawData = await this.fetchLogs();
//       const formattedData = await this.transformData(rawData);
//       return await this.repository.save(formattedData);
//     } catch (error) {
//       this.logger.error("クリックログの取得に失敗しました", error);
//       return 0;
//     }
//   }

//   private async fetchLogs(): Promise<RawMetronData[]> {
//     const end = getNowJstForDisplay();
//     const start = new Date(end.getTime() - 3 * 60_000);
//     const startStr = formatDateTime(start);
//     const endStr = formatDateTime(end);
//     const headers = { apiKey: process.env.AFAD_API_KEY };
//     const body = new URLSearchParams({
//       clickDateTime: `${startStr} - ${endStr}`,
//     });

//     try {
//       const response = await firstValueFrom(
//         this.http.post<MetronApiResponse>(this.apiUrl, body, { headers }),
//       );

//       // APIレスポンスの検証
//       if (!response.data) {
//         this.logger.warn("APIレスポンスが空です");
//         return [];
//       }

//       // HTTPステータスコードの確認
//       if (response.status !== 200) {
//         this.logger.error(`HTTPエラー: ${response.status}`, response.data);
//         throw new Error(`HTTP Error: ${response.status}`);
//       }

//       // エラーレスポンスの確認
//       if (response.data.errors && response.data.errors.length > 0) {
//         const errorMessages = response.data.errors.map((error: any) =>
//           typeof error === "string" ? error : JSON.stringify(error),
//         );
//         this.logger.error("APIエラーが発生しました:", errorMessages);
//         throw new Error(`Metron API Error: ${errorMessages.join(", ")}`);
//       }

//       // MetronのAPIレスポンス構造: { params: { logs: [...] } }
//       if (response.data.params && Array.isArray(response.data.params.logs)) {
//         return response.data.params.logs;
//       }

//       this.logger.warn(`APIレスポンスの構造が期待と異なります:`, response.data);
//       return [];
//     } catch (error) {
//       this.logger.error("API呼び出しに失敗しました:", error);
//       throw error;
//     }
//   }

//   private async transformData(rawData: RawMetronData[]) {
//     const formatted = await Promise.all(
//       rawData
//         .filter((item) => {
//           if (!item.clickDateTime || !item.siteName) {
//             this.logger.warn(
//               `Skipping invalid record: ${JSON.stringify(item)}`,
//             );
//             return false;
//           }
//           return true;
//         })
//         .map(async (item) => {
//           try {
//             const clickDateTime = parseToJst(item.clickDateTime);
//             const affiliateLinkName = item.siteName?.trim();
//             const referrer_url = item.referrer?.trim() || null;

//             if (!clickDateTime) {
//               this.logger.warn(`Invalid date format: ${item.clickDateTime}`);
//               return null;
//             }

//             if (!affiliateLinkName) {
//               this.logger.warn("サイト名が空です");
//               return null;
//             }

//             const affiliateLink =
//               await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

//             const { referrerLinkId, referrer_url: processedReferrerUrl } =
//               await this.repository.processReferrerLink(referrer_url);

//             return {
//               clickDateTime,
//               affiliate_link_id: affiliateLink.id,
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
