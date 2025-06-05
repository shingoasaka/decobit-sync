import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawFinebirdData {
  注文日時?: string;
  サイト名?: string;
  リファラ?: string;
}

@Injectable()
export class FinebirdActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.FINEBIRD);
  }

  async save(logs: RawFinebirdData[]): Promise<number> {
    try {
      const formatted = await Promise.all(
        logs
          .filter((item) => {
            if (!item["注文日時"] || !item["サイト名"]) {
              this.logger.warn(
                `Skipping invalid record: ${JSON.stringify(item)}`,
              );
              return false;
            }
            return true;
          })
          .map(async (item) => {
            try {
              const actionDateTime = parseToJst(item["注文日時"]);
              const affiliateLinkName = item["サイト名"]?.trim();
              const referrerUrl = item["リファラ"] || null;

              if (!actionDateTime) {
                this.logger.warn(`Invalid date format: ${item["注文日時"]}`);
                return null;
              }

              if (!affiliateLinkName) {
                this.logger.warn("サイト名が空です");
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
      this.logger.error("Error saving Finebird action logs:", error);
      throw error;
    }
  }
}
