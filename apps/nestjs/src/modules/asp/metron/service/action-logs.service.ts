import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "@prismaService";
import { firstValueFrom } from "rxjs";

interface MetronActionLogApiItem {
  actionDateTime?: string;
  siteName?: string;
  actionReferrer?: string;
  sessionId?: string;
  clientInfo?: string;
}

@Injectable()
export class MetronActionLogService {
  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    const start = new Date(Date.now() - 60_000);
    const end = new Date();
    const startStr = formatDateTimeJapanese(start);
    const endStr = formatDateTimeJapanese(end);
    const url = "https://api09.catsasp.net/log/action/listtime";
    const headers = { apiKey: process.env.AFAD_API_KEY };
    const body = new URLSearchParams({
      actionDateTime: `${startStr} - ${endStr}`,
    });

    const resp = await firstValueFrom(this.http.post(url, body, { headers }));
    const data = resp.data;
    const logs: MetronActionLogApiItem[] = data?.params?.logs || [];

    if (logs.length === 0) {
      return 0;
    }

    const createData = logs.map((item) => {
      let uid: string | null = null;
      try {
        const parsed = JSON.parse(item.clientInfo || "{}");
        uid = parsed.userId1 || null;
      } catch (e) {
        uid = null;
      }

      return {
        actionDateTime: item.actionDateTime
          ? new Date(item.actionDateTime)
          : null,
        siteName: item.siteName ?? null,
        actionReferrer: item.actionReferrer ?? null,
        sessionId: item.sessionId ?? null,
        uid,
      };
    });

    await this.prisma.metronActionLog.createMany({
      data: createData,
      skipDuplicates: true,
    });

    const updated = await this.updateReferrerFromClick();
    console.log(`referrer補完:${updated}件`);

    return logs.length;
  }

  private async updateReferrerFromClick(): Promise<null> {
    const clicks = await this.prisma.metronClickLog.findMany({
      where: {
        sessionId: { not: null },
        actionReferrer: { not: null },
      },
      select: { sessionId: true, actionReferrer: true },
    });

    const clickMap = new Map<string, string>();
    for (const click of clicks) {
      if (click.sessionId && click.actionReferrer) {
        clickMap.set(click.sessionId, click.actionReferrer);
      }
    }

    for (const [sessionId, referrer] of clickMap.entries()) {
      const targets = await this.prisma.metronActionLog.findMany({
        where: {
          sessionId,
          actionReferrer: { not: referrer },
        },
        select: { id: true },
      });

      for (const target of targets) {
        await this.prisma.metronActionLog.update({
          where: { id: target.id },
          data: { actionReferrer: referrer },
        });
      }
    }

    return null;
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
