import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "@prismaService";
import { firstValueFrom } from "rxjs";

interface MetronClickLogApiItem {
  clickDateTime?: string;
  siteName?: string;
  referrer?: string;
  sessionId?: string;
}

@Injectable()
export class MetronClickLogService {
  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    const url = "https://api09.catsasp.net/log/click/listspan";
    const headers = { apiKey: process.env.AFAD_API_KEY };

    const start = new Date(Date.now() - 60_000);
    const end = new Date();
    const startStr = formatDateTime(start);
    const endStr = formatDateTime(end);

    const body = new URLSearchParams({
      clickDateTime: `${startStr} - ${endStr}`,
    });

    const resp = await firstValueFrom(this.http.post(url, body, { headers }));
    const data = resp.data;
    const logs: MetronClickLogApiItem[] = data?.params?.logs || [];

    if (logs.length === 0) {
      return 0;
    }

    const createData = logs.map((item) => ({
      clickDateTime: item.clickDateTime
        ? new Date(item.clickDateTime)
        : null,
      siteName: item.siteName ?? null,
      actionReferrer: item.referrer ?? null,
      sessionId: item.sessionId ?? null,
    }));

    await this.prisma.metronClickLog.createMany({
      data: createData,
      skipDuplicates: true,
    });

    return logs.length;
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
