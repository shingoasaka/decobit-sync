import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import {
  getNowJstForDisplay,
  formatDateTimeJapanese,
  parseToJst,
} from "src/libs/date-utils";
import { MetronActionLogRepository } from "../repositories/action-logs.repository";
import { LogService } from "src/modules/logs/types";

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

    try {
      const response = await firstValueFrom(
        this.http.post<RawMetronData[]>(this.apiUrl, body, { headers }),
      );
      return response.data;
    } catch (error) {
      this.logger.error("API呼び出しに失敗しました:", error);
      throw error;
    }
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
            const sessionId = item.sessionId?.trim() || null;

            if (!actionDateTime) {
              this.logger.warn(`Invalid date format: ${item.actionDateTime}`);
              return null;
            }

            if (!affiliateLinkName) {
              this.logger.warn("サイト名が空です");
              return null;
            }

            const affiliateLink =
              await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

            const { referrerLinkId, referrer_url } =
              await this.repository.getReferrerFromClickLog(sessionId);

            return {
              actionDateTime,
              affiliate_link_id: affiliateLink.id,
              referrer_link_id: referrerLinkId,
              referrer_url,
              uid: null,
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
}
