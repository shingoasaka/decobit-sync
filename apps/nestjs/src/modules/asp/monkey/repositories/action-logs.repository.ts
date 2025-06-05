import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawMonkeyData {
  成果日時?: string;
  タグ?: string;
  リファラ?: string;
}

@Injectable()
export class MonkeyActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.MONKEY);
  }

  async save(logs: RawMonkeyData[]): Promise<number> {
    try {
      const formatted = await Promise.all(
        logs
          .filter((item) => {
            if (!item["成果日時"] || !item["タグ"]) {
              this.logger.warn(
                `Skipping invalid record: ${JSON.stringify(item)}`,
              );
              return false;
            }
            return true;
          })
          .map(async (item) => {
            try {
              const actionDateTime = parseToJst(item["成果日時"]);
              const affiliateLinkName = item["タグ"]?.trim();
              const referrerUrl = item["リファラ"] || null;

              if (!actionDateTime) {
                this.logger.warn(`Invalid date format: ${item["成果日時"]}`);
                return null;
              }

              if (!affiliateLinkName) {
                this.logger.warn("タグ名が空です");
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

              return {
                actionDateTime,
                affiliate_link_id: affiliateLink.id,
                referrer_link_id: null,
                referrerUrl,
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

      const validRecords = formatted.filter(
        (record): record is NonNullable<typeof record> => record !== null,
      );

      if (validRecords.length === 0) {
        this.logger.warn("No valid records to save");
        return 0;
      }

      return await this.saveToCommonTable(validRecords);
    } catch (error) {
      this.logger.error("Error saving Monkey action logs:", error);
      throw error;
    }
  }
}
