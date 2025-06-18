import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "@prismaService";
import { firstValueFrom } from "rxjs";
import {
  getNowJstForDisplay,
  formatDateTimeJapanese,
  parseToJst,
} from "src/libs/date-utils";
import { MetronActionLogRepository } from "../repositories/action-logs.repository";
import { LogService } from "src/modules/logs/types";
import { processReferrerLink } from "../../base/repository.base";

interface RawMetronData {
  actionDateTime?: string;
  siteName?: string;
  sessionId?: string;
  clientInfo?: string;
}

@Injectable()
export class MetronActionLogService implements LogService {
  private readonly logger = new Logger(MetronActionLogService.name);
  private readonly apiUrl = "https://api09.catsasp.net/log/action/listtime";

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly repository: MetronActionLogRepository,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const rawData = await this.fetchLogs();
      const formattedData = await this.transformData(rawData);
      return await this.repository.save(formattedData);
    } catch (error) {
      this.logger.error("ログ取得に失敗しました", error);
      return 0;
    }
  }

  private async fetchLogs(): Promise<RawMetronData[]> {
    const end = getNowJstForDisplay();
    const start = new Date(end.getTime() - 3 * 60_000);
    const startStr = formatDateTimeJapanese(start);
    const endStr = formatDateTimeJapanese(end);
    const headers = { apiKey: process.env.AFAD_API_KEY };
    const body = new URLSearchParams({
      actionDateTime: `${startStr} - ${endStr}`,
    });

    const response = await firstValueFrom(
      this.http.post<{ params: { logs: RawMetronData[] } }>(this.apiUrl, body, {
        headers,
      }),
    );

    const logs = response.data?.params?.logs ?? [];

    if (logs.length === 0) {
      this.logger.warn("データが存在しませんでした");
      return [];
    }

    return logs;
  }

  private async transformData(rawData: RawMetronData[]) {
    const formatted = await Promise.all(
      rawData
        .filter((item) => {
          if (!item.actionDateTime || !item.siteName) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const actionDateTime = parseToJst(item.actionDateTime);
            const affiliateLinkName = item.siteName?.trim();
            const sessionId = item.sessionId || null;

            if (!actionDateTime) {
              this.logger.warn(`Invalid date format: ${item.actionDateTime}`);
              return null;
            }

            if (!affiliateLinkName) {
              this.logger.warn("siteName is empty");
              return null;
            }

            const affiliateLink =
              await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

            // クリックログからリファラ情報を取得
            const { referrerLinkId, referrerUrl } =
              await this.getReferrerFromClickLog(sessionId);

            // uidの取得
            let uid: string | null = null;
            try {
              const parsed = JSON.parse(item.clientInfo || "{}");
              uid = parsed.userId1 || null;
            } catch {
              uid = null;
            }

            return {
              actionDateTime,
              affiliate_link_id: affiliateLink.id,
              referrer_link_id: referrerLinkId,
              referrerUrl,
              uid,
            };
          } catch (error) {
            this.logger.error(
              `Error processing record: ${JSON.stringify(item)}`,
              error,
            );
            return null;
          }
        }),
    );

    return formatted.filter(
      (record): record is NonNullable<typeof record> => record !== null,
    );
  }

  private async getReferrerFromClickLog(
    sessionId: string | null,
  ): Promise<{ referrerLinkId: number | null; referrerUrl: string | null }> {
    if (!sessionId) {
      return { referrerLinkId: null, referrerUrl: null };
    }

    // クリックログからsessionIdに一致するレコードを検索
    const clickLog = await this.prisma.aspClickLog.findFirst({
      where: {
        asp_type: "METRON",
        referrer_url: {
          not: null,
          contains: `sessionId=${sessionId}`,
        },
      },
      select: { referrer_url: true },
      orderBy: {
        click_date_time: "desc", // 最新のクリックログを取得
      },
    });

    if (!clickLog?.referrer_url) {
      return { referrerLinkId: null, referrerUrl: null };
    }

    // クリックログのリファラURLを使ってReferrerLinkを処理
    return processReferrerLink(this.prisma, this.logger, clickLog.referrer_url);
  }
}
