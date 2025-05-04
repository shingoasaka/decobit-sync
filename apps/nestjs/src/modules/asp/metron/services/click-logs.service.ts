import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "@prismaService";
import { firstValueFrom } from "rxjs";
import { getNowJst } from "src/libs/date-utils";
import { MetronClickLogRepository } from "../repositories/click-logs.repository";

@Injectable()
export class MetronClickLogService {
  private readonly logger = new Logger(MetronClickLogService.name);
  private readonly apiUrl = "https://api09.catsasp.net/log/click/listspan";

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly repository: MetronClickLogRepository,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 3 * 60_000);
      const startStr = formatDateTime(start);
      const endStr = formatDateTime(end);
      const headers = { apiKey: process.env.AFAD_API_KEY };

      const body = new URLSearchParams({
        clickDateTime: `${startStr} - ${endStr}`,
      });

      const response = await firstValueFrom(
        this.http.post<{ params: { logs: any[] } }>(this.apiUrl, body, {
          headers,
        }),
      );

      const list = response.data?.params?.logs ?? [];

      if (list.length === 0) {
        this.logger.warn("クリックログは存在しませんでした");
        return 0;
      }

      return await this.repository.save(list);
    } catch (error) {
      this.logger.error("クリックログの取得に失敗しました", error);
      throw new Error("クリックログの取得に失敗しました");
    }
  }
}

function formatDateTime(d: Date): string {
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
}
