import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "@prismaService";
import { firstValueFrom } from "rxjs";
import { MetronClickLogDto } from "../dto/metron-click.dto";
import { MetronClickLogEntity } from "../interface/metron-click-log.interface";

@Injectable()
export class MetronClickLogService {
  private readonly logger = new Logger(MetronClickLogService.name);
  private readonly apiUrl = "https://api09.catsasp.net/log/click/listspan";

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const start = new Date(Date.now() - 60_000);
      const end = new Date();
      const startStr = formatDateTime(start);
      const endStr = formatDateTime(end);
      const headers = { apiKey: process.env.AFAD_API_KEY };

      const body = new URLSearchParams({
        clickDateTime: `${startStr} - ${endStr}`,
      });

      const response = await firstValueFrom(
        this.http.post<{ params: { logs: MetronClickLogDto[] } }>(
          this.apiUrl,
          body,
          { headers },
        ),
      );

      const list = response.data?.params?.logs ?? [];

      if (list.length === 0) {
        this.logger.warn("クリックログは存在しませんでした");
        return 0;
      }

      // DTO を内部で扱いやすい Entity 形式に変換
      const records: MetronClickLogEntity[] = list.map((dto) =>
        this.convertDtoToEntity(dto),
      );

      await this.prisma.metronClickLog.createMany({
        data: records,
        skipDuplicates: true,
      });
      return records.length;
    } catch (error) {
      this.logger.error("クリックログの取得に失敗しました", error);
      throw new Error("クリックログの取得に失敗しました");
    }
  }

  private convertDtoToEntity(dto: MetronClickLogDto): MetronClickLogEntity {
    return {
      clickDateTime: dto.clickDateTime ? new Date(dto.clickDateTime) : null,
      affiliateLinkName: dto.siteName ?? null,
      referrerUrl: dto.referrer ?? null,
      sessionId: dto.sessionId ?? null,
    };
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
