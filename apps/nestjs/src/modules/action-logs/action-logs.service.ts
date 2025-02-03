import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "../../prisma/prisma.service";
import { firstValueFrom } from "rxjs";
import { Prisma } from "@prisma/client";

@Injectable()
export class ActionLogsService {
  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    // 1分前～現在の日時を日本語形式に変換し、APIへ送信
    const start = new Date(Date.now() - 60_000);
    const end = new Date();
    const startStr = formatDateTimeJapanese(start);
    const endStr = formatDateTimeJapanese(end);

    const url = "https://api09.catsasp.net/log/action/listtime";
    const headers = { apiKey: process.env.AFAD_API_KEY };
    const body = new URLSearchParams({
      actionDateTime: `${startStr} - ${endStr}`,
    });

    // API呼び出し
    const resp = await firstValueFrom(this.http.post(url, body, { headers }));
    const data = resp.data;
    const logs = data?.params?.logs || [];

    if (logs.length === 0) {
      return 0;
    }

    for (const item of logs) {
      await this.prisma.actionLog.create({
        data: {
          actionDateTime: item.actionDateTime
            ? new Date(item.actionDateTime)
            : null,
          clickDateTime: item.clickDateTime
            ? new Date(item.clickDateTime)
            : null,

          clientId: item.clientId ?? null,
          clientName: item.clientName ?? null,

          contentId: item.contentId ? parseInt(item.contentId, 10) : null,
          contentName: item.contentName ?? null,

          partnerId: item.partnerId ? parseInt(item.partnerId, 10) : null,
          partnerName: item.partnerName ?? null,
          groupId: item.groupId ? parseInt(item.groupId, 10) : null,
          groupName: item.groupName ?? null,
          siteId: item.siteId ? parseInt(item.siteId, 10) : null,
          siteName: item.siteName ?? null,

          actionCareer: item.actionCareer,
          actionOs: item.actionOs,
          actionUserAgent: item.actionUserAgent,
          actionIpAddress: item.actionIpAddress,
          actionReferrer: item.actionReferrer,
          queryString: item.queryString,
          clickPartnerInfo: item.clickPartnerInfo,
          clientInfo: item.clientInfo,
          sessionId: item.sessionId,
          actionId: item.actionId,
          contentBannerNum: item.contentBannerNum,

          clientClickCost: item.clientClickCost
            ? new Prisma.Decimal(parseFloat(item.clientClickCost))
            : null,
          partnerClickCost: item.partnerClickCost
            ? new Prisma.Decimal(parseFloat(item.partnerClickCost))
            : null,
          clientCommissionCost: item.clientCommissionCost
            ? new Prisma.Decimal(parseFloat(item.clientCommissionCost))
            : null,
          partnerCommissionCost: item.partnerCommissionCost
            ? new Prisma.Decimal(parseFloat(item.partnerCommissionCost))
            : null,
          clientActionCost: item.clientActionCost
            ? new Prisma.Decimal(parseFloat(item.clientActionCost))
            : null,
          partnerActionCost: item.partnerActionCost
            ? new Prisma.Decimal(parseFloat(item.partnerActionCost))
            : null,

          actionType: item.actionType ? parseInt(item.actionType, 10) : null,
          status: item.status,
          amount: item.amount ? parseInt(item.amount, 10) : null,
          comment: item.comment,
        },
      });
    }

    return logs.length;
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
