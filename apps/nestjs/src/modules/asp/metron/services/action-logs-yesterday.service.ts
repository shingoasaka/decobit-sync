import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import {
  getNowJstForDisplay,
  formatDateTimeJapanese,
  parseToJst,
} from "src/libs/date-utils";
// import { MetronActionLogRepository } from "../repositories/action-logs.repository";
import { LogService } from "src/modules/logs/types";
import { writeToSpreadsheet, convertTo2DArray } from "../../../../libs/spreadsheet-utils";
import { subDays, format } from "date-fns";

// interface RawMetronData {
interface RawLadData {
//   actionDateTime?: string;
//   siteName?: string;
//   sessionId?: string;
//   clientInfo?: string;
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
export class MetronActionLogYesterdayService implements LogService {
  private readonly logger = new Logger(MetronActionLogYesterdayService.name);
  // private readonly apiUrl = "https://api09.catsasp.net/log/action/listtime";
  private readonly apiUrl = "https://api09.catsasp.net/log/action/list";

  constructor(
    private readonly http: HttpService,
    // private readonly repository: MetronActionLogRepository,
  ) {}

//   async fetchAndInsertLogs(): Promise<number> {
  async fetchAndInsertLogs(): Promise<RawLadData[]> {
    console.log("🧪 fetchAndInsertLogs 実行されました");

    const allLogs: RawLadData[] = [];

  try {
    for (let page = 1; page <= 100; page++) {
      const pageLogs = await this.fetchLogsByPage(page);
      if (pageLogs.length === 0) break;

      allLogs.push(...pageLogs);
    }
    // try {
    //   const rawData = await this.fetchLogs();
    //   const formattedData = await this.transformData(rawData);
    //   return await this.repository.save(formattedData);
    console.log("🧪 rawData 件数:", allLogs.length);
    // スプレッドシート書き込み処理
    try {
    await writeToSpreadsheet({
        spreadsheetId: process.env.SPREADSHEET_ID_METRON_ACTION || "",
        sheetName: "Metron_test",
        values: convertTo2DArray(allLogs),
    });

    this.logger.log("スプレッドシートへの書き出しに成功しました。");
    } catch (e) {
    this.logger.error(`スプレッドシートへの書き出しに失敗しました: ${e}`);
    }

    return allLogs;   

} catch (error) {
      this.logger.error("ログ取得に失敗しました", error);
      return  [];
    }
  }

//   private async fetchLogs(): Promise<RawMetronData[]> {
  private async fetchLogsByPage(page: number): Promise<RawLadData[]> {
    // const end = getNowJstForDisplay();
    // const start = new Date(end.getTime() - 3 * 60_000);
    // const startStr = formatDateTimeJapanese(start);
    // const endStr = formatDateTimeJapanese(end);
    // const headers = { apiKey: process.env.AFAD_API_KEY };
    // const body = new URLSearchParams({
    //   actionDateTime: `${startStr} - ${endStr}`,
    const today = getNowJstForDisplay();
    const yesterday = subDays(today, 1); // ← 翌日を取得
    const yesterdayStr = format(yesterday, "yyyy年MM月dd日");
    const headers = { apiKey: process.env.AFAD_API_KEY };

    const body = new URLSearchParams({
      actionDateTime: `${yesterdayStr} - ${yesterdayStr}`,
      row: "120",
      page: page.toString(),
    });

    try {
      const response = await firstValueFrom(
        this.http.post<MetronApiResponse>(this.apiUrl, body, { headers }),
      );
 
      // APIレスポンスの検証
      if (!response.data) {
        this.logger.warn("APIレスポンスが空です");
        return [];
      }

      // HTTPステータスコードの確認
      if (response.status !== 200) {
        this.logger.error(`HTTPエラー: ${response.status}`, response.data);
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // エラーレスポンスの確認
      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map((error: any) =>
          typeof error === "string" ? error : JSON.stringify(error),
        );
        this.logger.error("APIエラーが発生しました:", errorMessages);
        throw new Error(`Metron API Error: ${errorMessages.join(", ")}`);
      }

      // MetronのAPIレスポンス構造: { params: { logs: [...] } }
      if (response.data.params && Array.isArray(response.data.params.logs)) {
        return response.data.params.logs;
      }

      this.logger.warn(`APIレスポンスの構造が期待と異なります:`, response.data);
      return [];
    } catch (error) {
      this.logger.error("API呼び出しに失敗しました:", error);
      throw error;
    }
  }

//   private async transformData(rawData: RawMetronData[]) {
//     const formatted = await Promise.all(
//       rawData
//         .filter((item) => {
//           if (!item.actionDateTime || !item.siteName) {
//             this.logger.warn(
//               `Skipping invalid record: ${JSON.stringify(item)}`,
//             );
//             return false;
//           }
//           return true;
//         })
//         .map(async (item) => {
//           try {
//             const actionDateTime = parseToJst(item.actionDateTime);
//             const affiliateLinkName = item.siteName?.trim();
//             const sessionId = item.sessionId?.trim() || null;

//             if (!actionDateTime) {
//               this.logger.warn(`Invalid date format: ${item.actionDateTime}`);
//               return null;
//             }

//             if (!affiliateLinkName) {
//               this.logger.warn("サイト名が空です");
//               return null;
//             }

//             const affiliateLink =
//               await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

//             const { referrerLinkId, referrer_url } =
//               await this.repository.getReferrerFromClickLog(sessionId);

//             return {
//               actionDateTime,
//               affiliate_link_id: affiliateLink.id,
//               referrer_link_id: referrerLinkId,
//               referrer_url,
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
}
