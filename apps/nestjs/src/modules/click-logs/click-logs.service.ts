import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "../../prisma/prisma.service";
import { firstValueFrom } from "rxjs";
import { Prisma } from "@prisma/client";

@Injectable()
export class ClickLogsService {
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
    const logs = data?.params?.logs || [];

    if (logs.length === 0) {
      return 0;
    }

    for (const item of logs) {
      await this.prisma.clickLog.create({
        data: {
          actionDateTime: item.actionDateTime
            ? new Date(item.actionDateTime)
            : null,
          clickDateTime: item.clickDateTime
            ? new Date(item.clickDateTime)
            : null,
          admitDateTime: item.admitDateTime
            ? new Date(item.admitDateTime)
            : null,

          clientId: item.clientId ? parseInt(item.clientId, 10) : null,
          contentId: item.contentId ? parseInt(item.contentId, 10) : null,
          partnerId: item.partnerId ? parseInt(item.partnerId, 10) : null,
          groupId: item.groupId ? parseInt(item.groupId, 10) : null,
          siteId: item.siteId ? parseInt(item.siteId, 10) : null,

          clientName: item.clientName ?? null,
          contentName: item.contentName ?? null,
          partnerName: item.partnerName ?? null,
          groupName: item.groupName ?? null,
          siteName: item.siteName ?? null,
          actionCareer: item.actionCareer ?? null,
          actionOs: item.actionOs ?? null,
          actionUserAgent: item.actionUserAgent ?? null,
          actionIpAddress: item.actionIpAddress ?? null,
          actionReferrer: item.actionReferrer ?? null,
          queryString: item.queryString ?? null,
          clickPartnerInfo: item.clickPartnerInfo ?? null,
          clientInfo: item.clientInfo ?? null,
          sessionId: item.sessionId ?? null,
          actionId: item.actionId ?? null,
          contentBannerNum: item.contentBannerNum ?? null,
          comment: item.comment ?? null,

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
          amount: item.amount ? parseInt(item.amount, 10) : null,
          status: item.status ?? null,
        },
      });
    }
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
