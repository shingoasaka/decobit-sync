import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst } from "src/libs/date-utils";

// 入力データの型定義・合計値形式
interface RawSampleAffiliateData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  メディア?: string;
  "アクセス数[件]"?: string;
}

@Injectable()
export class SampleAffiliateClickLogRepository extends BaseAspRepository {
  protected readonly format = "total" as const;

  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.SAMPLE_AFFILIATE);
  }

  private toInt(value: string | null | undefined): number {
    if (!value) return 0;
    try {
      const cleanValue = value.replace(/[,¥]/g, "");
      const num = parseInt(cleanValue, 10);
      return isNaN(num) ? 0 : num;
    } catch (error) {
      this.logger.warn(`Invalid number format: ${value}`);
      return 0;
    }
  }

  async save(clickData: RawSampleAffiliateData[]): Promise<number> {
    try {
      const formatted = await Promise.all(
        clickData
          .filter((item) => {
            if (!item.メディア) {
              this.logger.warn(
                `Skipping invalid record: ${JSON.stringify(item)}`,
              );
              return false;
            }
            return true;
          })
          .map(async (item) => {
            try {
              const affiliateLinkName = item.メディア?.trim();
              if (!affiliateLinkName) {
                this.logger.warn("メディアが空です");
                return null;
              }

              const currentTotalClicks = this.toInt(item["アクセス数[件]"]);

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
                affiliate_link_id: affiliateLink.id,
                currentTotalClicks,
                referrer_link_id: null,
                referrerUrl: null,
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
      this.logger.error("Error saving SampleAffiliate click data:", error);
      throw error;
    }
  }
}
