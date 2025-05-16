import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "@prismaService";
import { firstValueFrom } from "rxjs";
import {
  getNowJstForDisplay,
  formatDateTimeJapanese,
} from "src/libs/date-utils";
import { MetronActionLogRepository } from "../repositories/action-logs.repository";

@Injectable()
export class MetronActionLogService {
  private readonly logger = new Logger(MetronActionLogService.name);
  private readonly apiUrl = "https://api09.catsasp.net/log/action/listtime";

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly repository: MetronActionLogRepository,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const end = getNowJstForDisplay();
      const start = new Date(end.getTime() - 3 * 60_000);
      const startStr = formatDateTimeJapanese(start);
      const endStr = formatDateTimeJapanese(end);
      const headers = { apiKey: process.env.AFAD_API_KEY };
      const body = new URLSearchParams({
        actionDateTime: `${startStr} - ${endStr}`,
      });

      const response = await firstValueFrom(
        this.http.post<{ params: { logs: any[] } }>(this.apiUrl, body, {
          headers,
        }),
      );

      const logs = response.data?.params?.logs ?? [];

      if (logs.length === 0) {
        this.logger.warn("データが存在しませんでした");
        return 0;
      }

      return await this.repository.save(logs);
    } catch (error) {
      this.logger.error("ログ取得に失敗しました", error);
      throw new Error("ログ取得失敗");
    }
  }
}
