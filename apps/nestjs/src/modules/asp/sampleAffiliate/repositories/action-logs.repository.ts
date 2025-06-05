import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

// 入力データの型定義・個別形式
interface RawSampleAffiliateData {
  [key: string]: string | null | undefined;
  メディア?: string;
  発生日時?: string;
}

@Injectable()
export class SampleAffiliateActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.SAMPLE_AFFILIATE);
  }

  private toDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      this.logger.warn(`Invalid date format: ${dateStr}`);
      return null;
    }
  }

  private getValue(item: RawSampleAffiliateData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(item: RawSampleAffiliateData) {
    const affiliateLinkName = this.getValue(item, "メディア");
    if (!affiliateLinkName) {
      throw new Error("メディアが必須です");
    }

    const actionDateTime = parseToJst(this.getValue(item, "発生日時"));
    if (!actionDateTime) {
      throw new Error("発生日時が必須です");
    }

    return {
      actionDateTime,
      affiliateLinkName,
      referrerUrl: null,
    };
  }

  async save(logs: RawSampleAffiliateData[]): Promise<number> {
    try {
      const formatted = await Promise.all(
        logs
          .filter((item) => {
            if (!item.メディア || !item.発生日時) {
              this.logger.warn(
                `Skipping invalid record: ${JSON.stringify(item)}`,
              );
              return false;
            }
            return true;
          })
          .map(async (item) => {
            try {
              const actionDateTime = parseToJst(item.発生日時);
              const affiliateLinkName = item.メディア?.trim();

              if (!actionDateTime) {
                this.logger.warn(`Invalid date format: ${item.発生日時}`);
                return null;
              }

              if (!affiliateLinkName) {
                this.logger.warn("メディアが空です");
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
                referrerUrl: null,
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
      this.logger.error("Error saving SampleAffiliate action logs:", error);
      throw error;
    }
  }
}
