import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import {
  BaseActionLogRepository,
  extractUtmCreative,
} from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawMetronData {
  actionDateTime?: string;
  siteName?: string;
  actionReferrer?: string;
  sessionId?: string;
  clientInfo?: string;
}

@Injectable()
export class MetronActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.METRON);
  }

  async save(logs: RawMetronData[]): Promise<number> {
    try {
      const formatted = await Promise.all(
        logs
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
              const referrerUrl = item.actionReferrer || null;
              const creativeValue = extractUtmCreative(referrerUrl);

              if (!actionDateTime) {
                this.logger.warn(`Invalid date format: ${item.actionDateTime}`);
                return null;
              }

              if (!affiliateLinkName) {
                this.logger.warn("siteName is empty");
                return null;
              }

              // 名前→ID変換
              const affiliateLink = await this.prisma.affiliateLink.upsert({
                where: {
                  asp_type_affiliate_link_name: {
                    asp_type: this.aspType,
                    affiliate_link_name: affiliateLinkName,
                  },
                },
                update: {},
                create: {
                  asp_type: this.aspType,
                  affiliate_link_name: affiliateLinkName,
                },
              });

              // リファラリンクの処理
              let referrerLinkId = null;
              if (creativeValue) {
                const referrerLink = await this.prisma.referrerLink.upsert({
                  where: {
                    creative_value: creativeValue,
                  },
                  update: {},
                  create: {
                    creative_value: creativeValue,
                  },
                });
                referrerLinkId = referrerLink.id;
              }

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

      const validRecords = formatted.filter(
        (record): record is NonNullable<typeof record> => record !== null,
      );

      if (validRecords.length === 0) {
        this.logger.warn("No valid records to save");
        return 0;
      }

      return await this.saveToCommonTable(validRecords);
    } catch (error) {
      this.logger.error("Error saving Metron action logs:", error);
      throw error;
    }
  }
}
