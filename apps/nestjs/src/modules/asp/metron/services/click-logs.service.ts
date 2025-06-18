import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { PrismaService } from "@prismaService";
import { firstValueFrom } from "rxjs";
import { formatDateTime, getNowJstForDisplay } from "src/libs/date-utils";
import { MetronClickLogRepository } from "../repositories/click-logs.repository";
import { LogService } from "src/modules/logs/types";
import { processReferrerLink } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawMetronData {
  clickDateTime?: string;
  siteName?: string;
  referrer?: string;
  sessionId?: string;
}

@Injectable()
export class MetronClickLogService implements LogService {
  private readonly logger = new Logger(MetronClickLogService.name);
  private readonly apiUrl = "https://api09.catsasp.net/log/click/listspan";

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly repository: MetronClickLogRepository,
  ) {}

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const rawData = await this.fetchLogs();
      const formattedData = await this.transformData(rawData);
      return await this.repository.save(formattedData);
    } catch (error) {
      this.logger.error("クリックログの取得に失敗しました", error);
      return 0;
    }
  }

  private async fetchLogs(): Promise<RawMetronData[]> {
    const end = getNowJstForDisplay();
    const start = new Date(end.getTime() - 3 * 60_000);
    const startStr = formatDateTime(start);
    const endStr = formatDateTime(end);
    const headers = { apiKey: process.env.AFAD_API_KEY };
    const body = new URLSearchParams({
      clickDateTime: `${startStr} - ${endStr}`,
    });

    const response = await firstValueFrom(
      this.http.post<{ params: { logs: RawMetronData[] } }>(this.apiUrl, body, {
        headers,
      }),
    );

    const list = response.data?.params?.logs ?? [];

    if (list.length === 0) {
      this.logger.warn("クリックログは存在しませんでした");
      return [];
    }

    return list;
  }

  private async transformData(rawData: RawMetronData[]) {
    const formatted = await Promise.all(
      rawData
        .filter((item) => {
          if (!item.clickDateTime || !item.siteName) {
            this.logger.warn(
              `Skipping invalid record: ${JSON.stringify(item)}`,
            );
            return false;
          }
          return true;
        })
        .map(async (item) => {
          try {
            const clickDateTime = parseToJst(item.clickDateTime);
            const affiliateLinkName = item.siteName?.trim();
            const referrerUrl = item.referrer || null;
            const sessionId = item.sessionId || null;

            if (!clickDateTime) {
              this.logger.warn(`Invalid date format: ${item.clickDateTime}`);
              return null;
            }

            if (!affiliateLinkName) {
              this.logger.warn("siteName is empty");
              return null;
            }

            const affiliateLink =
              await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

            // リファラリンクの処理
            const { referrerLinkId, referrerUrl: processedReferrerUrl } =
              await processReferrerLink(this.prisma, this.logger, referrerUrl);

            // sessionIdを含めたリファラURLを保存
            const finalReferrerUrl = sessionId
              ? `${processedReferrerUrl || ""}${processedReferrerUrl ? "&" : "?"}sessionId=${sessionId}`
              : processedReferrerUrl;

            return {
              clickDateTime,
              affiliate_link_id: affiliateLink.id,
              referrer_link_id: referrerLinkId,
              referrerUrl: finalReferrerUrl,
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
