import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import {
  BaseActionLogRepository,
  processReferrerLink,
} from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

// LAD固有のカラム名を持つインターフェース・個別形式
interface RawLadData {
  成果日時?: string;
  遷移広告URL名?: string;
  "リファラ(クリック)"?: string;
}

@Injectable()
export class LadActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.LAD);
  }

  async save(logs: RawLadData[]): Promise<number> {
    try {
      const formatted = await Promise.all(
        logs
          .filter((item) => {
            if (!item["成果日時"] || !item["遷移広告URL名"]) {
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
              const affiliateLinkName = item["遷移広告URL名"]?.trim();
              const referrerUrl = item["リファラ(クリック)"]?.trim() || null;

              if (!actionDateTime) {
                this.logger.warn(`Invalid date format: ${item["成果日時"]}`);
                return null;
              }

              if (!affiliateLinkName) {
                this.logger.warn("遷移広告URL名が空です");
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
                update: {
                  affiliate_link_name: affiliateLinkName,
                },
                create: {
                  asp_type: this.aspType,
                  affiliate_link_name: affiliateLinkName,
                },
              });

              // リファラリンクの処理
              const { referrerLinkId, referrerUrl: processedReferrerUrl } =
                await processReferrerLink(
                  this.prisma,
                  this.logger,
                  referrerUrl,
                );

              return {
                actionDateTime,
                affiliate_link_id: affiliateLink.id,
                referrer_link_id: referrerLinkId,
                referrerUrl: processedReferrerUrl,
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
      this.logger.error("Error saving LAD action logs:", error);
      throw error;
    }
  }
}
