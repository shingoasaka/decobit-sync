import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "../../prisma/prisma.service";
import { firstValueFrom } from "rxjs";

interface ActionLogItem {
  actionDateTime: Date;
  clickDateTime: Date;
  clientId: number;
  clientName: string;
  contentId: number;
  contentName: string;
  partnerId: number;
  partnerName: string;
  groupId: number;
  groupName: string;
  siteId: number;
  siteName: string;
  actionCareer: string;
  actionOs: string;
  actionUserAgent: string;
  actionIpAddress: string;
  actionReferrer: string;
  queryString: string;
  clickPartnerInfo: string;
  clientInfo: string;
  sessionId: string;
  actionId: string;
  contentBannerNum: string;
  clientClickCost: number;
  partnerClickCost: number;
  clientCommissionCost: number;
  partnerCommissionCost: number;
  clientActionCost: number;
  partnerActionCost: number;
  actionType: number;
  status: string;
  amount: number;
  comment: string;
}

@Injectable()
export class ActionLogsService {
  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const logs = await this.fetchLogs();
      if (!logs.length) return 0;

      // バルクインサート
      await this.prisma.actionLog.createMany({
        data: logs.map((item: ActionLogItem) => ({
          actionDateTime: item.actionDateTime,
          clickDateTime: item.clickDateTime,
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
        })),
        skipDuplicates: true, // 重複をスキップ
      });

      return logs.length;
    } catch (error) {
      console.error("Failed to fetch or insert logs:", error);
      throw error;
    }
  }

  private async fetchLogs() {
    const url = "https://api09.catsasp.net/log/action/listtime";
    const headers = { apiKey: process.env.AFAD_API_KEY };
    const { startStr, endStr } = this.getTimeRange();

    const body = new URLSearchParams({
      actionDateTime: `${startStr} - ${endStr}`,
    });

    const resp = await firstValueFrom(this.http.post(url, body, { headers }));
    return resp.data?.params?.logs || [];
  }

  private getTimeRange() {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60_000);
    return {
      startStr: formatDateTime(oneMinuteAgo),
      endStr: formatDateTime(now),
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
