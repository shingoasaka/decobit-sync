import { Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { formatDateTime, getNowJstForDisplay } from "src/libs/date-utils";
// import { MetronClickLogRepository } from "../repositories/click-logs.repository";
import { LogService } from "src/modules/logs/types";
import { parseToJst } from "src/libs/date-utils";
import { HttpService } from "@nestjs/axios";
import { writeToSpreadsheet, convertTo2DArray } from "../../../../libs/spreadsheet-utils";
import { addHours, format, isBefore } from "date-fns";

// interface RawMetronData {
interface RawLadData {
//   clickDateTime?: string;
//   siteName?: string;
//   referrer?: string;
//   sessionId?: string;
  [key: string]: string | undefined;
}

interface MetronApiResponse {
  params: {
    totalNum: string;
    page: string;
    // logs: RawMetronData[];
    logs: RawLadData[];
  };
  errors: (string | object)[];
  code: number;
}

@Injectable()
export class MetronClickLogYesterdayService implements LogService {
  private readonly logger = new Logger(MetronClickLogYesterdayService.name);
  private readonly apiUrl = "https://api09.catsasp.net/log/click/listspan";

  constructor(
    private readonly http: HttpService,
    // private readonly repository: MetronClickLogRepository,
  ) {}

//   async fetchAndInsertLogs(): Promise<number> {
  async fetchAndInsertLogs(): Promise<RawLadData[]> {
    console.log("🧪 fetchAndInsertLogs 実行されました");

    try {
      const rawData = await this.fetchLogsByHourlyRange();
    //   const formattedData = await this.transformData(rawData);
    //   return await this.repository.save(formattedData);
    console.log("🧪 rawData 件数:", rawData.length);
    rawData.sort((a, b) => {
      const dateA = a.clickDateTime ? new Date(a.clickDateTime).getTime() : 0;
      const dateB = b.clickDateTime ? new Date(b.clickDateTime).getTime() : 0;
      return dateB - dateA;
    });
    // スプレッドシート書き込み処理
    try {
    await writeToSpreadsheet({
        spreadsheetId: process.env.SPREADSHEET_ID_METRON_CLICK || "",
        sheetName: "Metron_Click_Referrer_Today_test",
        values: convertTo2DArray(rawData),
    });

    this.logger.log("スプレッドシートへの書き出しに成功しました。");
    } catch (e) {
    this.logger.error(`スプレッドシートへの書き出しに失敗しました: ${e}`);
    }

    return rawData;
} catch (error) {
      this.logger.error("クリックログの取得に失敗しました", error);
      return [];
    }
  }

//   private async fetchLogs(): Promise<RawMetronData[]> {
  private async fetchLogsByHourlyRange(): Promise<RawLadData[]> {
    // const end = getNowJstForDisplay();
    // const start = new Date(end.getTime() - 3 * 60_000);
    // const startStr = formatDateTime(start);
    // const endStr = formatDateTime(end);
    const allLogs: RawLadData[] = [];
    const now = getNowJstForDisplay();
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    
    let currentStart = new Date(start);

    while (isBefore(currentStart, end)) {
      const oneHourMinus1Sec = new Date(currentStart.getTime() + 59 * 60_000 + 59_000);
      const currentEnd = new Date(Math.min(oneHourMinus1Sec.getTime(), end.getTime()));      
      const startStr = formatDateTime(currentStart);
      const endStr = formatDateTime(currentEnd);

      const headers = { apiKey: process.env.AFAD_API_KEY };
      const body = new URLSearchParams({
        clickDateTime: `${startStr} - ${endStr}`,
      });

    try {
      const response = await firstValueFrom(
        this.http.post<MetronApiResponse>(this.apiUrl, body, { headers }),
      );

      // APIレスポンスの検証
      if (!response.data) {
        this.logger.warn("APIレスポンスが空です");
        // return [];
        continue;
      }

      // HTTPステータスコードの確認
      if (response.status !== 200) {
        this.logger.error(`HTTPエラー: ${response.status}`, response.data);
        // throw new Error(`HTTP Error: ${response.status}`);
        continue;
      }

      // エラーレスポンスの確認
      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map((error: any) =>
          typeof error === "string" ? error : JSON.stringify(error),
        );
        this.logger.error("APIエラーが発生しました:", errorMessages);
        // throw new Error(`Metron API Error: ${errorMessages.join(", ")}`);
        continue;
      }

      // MetronのAPIレスポンス構造: { params: { logs: [...] } }
      if (response.data.params && Array.isArray(response.data.params.logs)) {
        // return response.data.params.logs;
        allLogs.push(...response.data.params.logs);
        this.logger.log(`[${startStr} - ${endStr}] 取得件数: ${response.data.params.logs.length}`);
      } else {
        this.logger.warn(`APIレスポンスの構造が期待と異なります:`, response.data);
      // return [];
      }
    } catch (error) {
      this.logger.error("API呼び出しに失敗しました:", error);
      // throw error;
      continue;
    }
    currentStart = addHours(currentStart, 1);
  }
  return allLogs;
  }
    
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
}
