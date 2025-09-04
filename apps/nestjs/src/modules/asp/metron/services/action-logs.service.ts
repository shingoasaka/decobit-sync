import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { getNowJstForDisplay } from "src/libs/date-utils";
import { writeToSpreadsheet, convertTo2DArray } from "../../../../libs/spreadsheet-utils";
import { subDays, format } from "date-fns";
import { ja } from "date-fns/locale";

interface RawLadData {
  [key: string]: string | undefined;
}

interface MetronApiResponse {
  params: {
    totalNum: string;
    page: string;
    logs: RawLadData[];
  };
  errors: (string | object)[];
  code: number;
}

@Injectable()
export class MetronActionLogService {
  private readonly logger = new Logger(MetronActionLogService.name);
  private readonly apiUrl = "https://api09.catsasp.net/log/action/list";

  constructor(private readonly http: HttpService) {}

  async fetchAndInsertLogs(): Promise<RawLadData[]> {
    console.log("🧪 fetchAndInsertLogs 実行されました");
    const allLogs: RawLadData[] = [];

    try {
      // -2日, -1日, 当日分を順番に取得
      for (let i = 2; i >= 0; i--) {
        const targetDate = subDays(getNowJstForDisplay(), i);
        const dateLogs: RawLadData[] = [];

        for (let page = 1; page <= 100; page++) {
          const logs = await this.fetchLogsByPage(page, targetDate);
          if (logs.length === 0) break;
          dateLogs.push(...logs);
        }

        allLogs.push(...dateLogs);
      }

      // actionDateTime で降順ソート（新しいものが上）
      const sortedLogs = allLogs.sort((a, b) => {
        const dateA = new Date(a.actionDateTime ?? "");
        const dateB = new Date(b.actionDateTime ?? "");
        return dateB.getTime() - dateA.getTime();
      });

      await writeToSpreadsheet({
        spreadsheetId: process.env.SPREADSHEET_ID_METRON_ACTION || "",
        sheetName: "Metron_test",
        values: convertTo2DArray(sortedLogs),
      });

      this.logger.log("スプレッドシートへの書き出しに成功しました。");
      return sortedLogs;
    } catch (error) {
      this.logger.error("ログ取得に失敗しました", error);
      return [];
    }
  }

  private async fetchLogsByPage(page: number, targetDate: Date): Promise<RawLadData[]> {
    const dateStr = format(targetDate, "yyyy年MM月dd日", { locale: ja });
    const headers = { apiKey: process.env.AFAD_API_KEY };

    const body = new URLSearchParams({
      actionDateTime: `${dateStr} - ${dateStr}`,
      row: "120",
      page: page.toString(),
    });

    try {
      const response = await firstValueFrom(
        this.http.post<MetronApiResponse>(this.apiUrl, body, { headers }),
      );

      if (!response.data || response.status !== 200) {
        this.logger.warn("レスポンスが不正またはステータス異常");
        return [];
      }

      if (response.data.errors && response.data.errors.length > 0) {
        const errorMessages = response.data.errors.map((error: any) =>
          typeof error === "string" ? error : JSON.stringify(error),
        );
        this.logger.error("APIエラー:", errorMessages);
        return [];
      }

      return response.data.params?.logs ?? [];
    } catch (error) {
      this.logger.error("API呼び出し失敗:", error);
      return [];
    }
  }
}
