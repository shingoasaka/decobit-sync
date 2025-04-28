import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "@prismaService";
import { firstValueFrom } from "rxjs";
import { MetronActionLogDto } from "../dto/metron-action.dto";
import { MetronActionLogEntity } from "../interface/metron-action-log.interface";

@Injectable()
export class MetronActionLogService {
  private readonly logger = new Logger(MetronActionLogService.name);
  private readonly apiUrl = "https://api09.catsasp.net/log/action/listtime";

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 3 * 60_000);
      const startStr = formatDateTimeJapanese(start);
      const endStr = formatDateTimeJapanese(end);

      const headers = { apiKey: process.env.AFAD_API_KEY };
      const body = new URLSearchParams({
        actionDateTime: `${startStr} - ${endStr}`,
      });

      const response = await firstValueFrom(
        this.http.post<{ params: { logs: MetronActionLogDto[] } }>(
          this.apiUrl,
          body,
          { headers },
        ),
      );

      const logs: MetronActionLogDto[] = response.data?.params?.logs ?? [];

      if (logs.length === 0) {
        this.logger.warn("データが存在しませんでした");
        return 0;
      }

      const createData: MetronActionLogEntity[] = logs.map((item) =>
        this.convertDtoToEntity(item),
      );

      await this.prisma.metronActionLog.createMany({
        data: createData,
        skipDuplicates: true,
      });

      const updated = await this.updateReferrerFromClick();
      this.logger.log(`referrer補完: ${updated}件`);

      return logs.length;
    } catch (error) {
      this.logger.error("ログ取得に失敗しました", error);
      throw new Error("ログ取得失敗");
    }
  }

  private convertDtoToEntity(dto: MetronActionLogDto): MetronActionLogEntity {
    let uid: string | null = null;
    try {
      const parsed = JSON.parse(dto.clientInfo || "{}");
      uid = parsed.userId1 || null;
    } catch {
      uid = null;
    }

    return {
      actionDateTime: dto.actionDateTime ? new Date(dto.actionDateTime) : null,
      affiliateLinkName: dto.siteName ?? null,
      referrerUrl: dto.actionReferrer ?? null,
      sessionId: dto.sessionId ?? null,
      uid,
    };
  }

  private async updateReferrerFromClick(): Promise<number> {
    const clicks = await this.prisma.metronClickLog.findMany({
      where: {
        sessionId: { not: null },
        referrerUrl: { not: null },
      },
      select: { sessionId: true, referrerUrl: true },
    });

    const clickMap = new Map<string, string>();
    for (const click of clicks) {
      if (click.sessionId && click.referrerUrl) {
        clickMap.set(click.sessionId, click.referrerUrl);
      }
    }

    let updateCount = 0;

    for (const [sessionId, referrer] of clickMap.entries()) {
      const targets = await this.prisma.metronActionLog.findMany({
        where: {
          sessionId,
          referrerUrl: { not: referrer },
        },
        select: { id: true },
      });

      for (const target of targets) {
        await this.prisma.metronActionLog.update({
          where: { id: target.id },
          data: { referrerUrl: referrer },
        });
        updateCount++;
      }
    }
    return updateCount;
  }
}

function formatDateTimeJapanese(d: Date): string {
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}年${MM}月${dd}日 ${hh}時${mm}分`;
}
