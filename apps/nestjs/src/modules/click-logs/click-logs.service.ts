import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "../../prisma/prisma.service";
import { firstValueFrom } from "rxjs";

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
    const body = {
      clickDateTime: `${startStr} - ${endStr}`,
    };

    const response$ = this.http.post(url, new URLSearchParams(body), {
      headers,
    });
    const resp = await firstValueFrom(response$);
    const data = resp.data;
    const logs = data?.params?.logs || [];
    for (const item of logs) {
      await this.prisma.clickLog.create({
        data: {
          actionDateTime: item.actionDateTime,
          clickDateTime: item.clickDateTime,
          admitDateTime: item.admitDateTime,
          clientId: item.clientId,
          clientName: item.clientName,
          contentId: item.contentId,
          contentName: item.contentName,
          partnerId: item.partnerId,
          partnerName: item.partnerName,
          groupId: item.groupId,
          groupName: item.groupName,
          siteId: item.siteId,
          siteName: item.siteName,
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
          clientClickCost: item.clientClickCost,
          partnerClickCost: item.partnerClickCost,
          clientCommissionCost: item.clientCommissionCost,
          partnerCommissionCost: item.partnerCommissionCost,
          clientActionCost: item.clientActionCost,
          partnerActionCost: item.partnerActionCost,
          actionType: item.actionType,
          status: item.status,
          amount: item.amount,
          comment: item.comment,
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
