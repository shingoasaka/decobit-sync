import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

// LAD固有のカラム名を持つインターフェース・個別形式
interface RawLadData {
  クリック日時?: string;
  広告名?: string;
  リファラ?: string;
}

function extractUtmCreative(referrerUrl: string | null): string | null {
  if (!referrerUrl) return null;
  try {
    const url = new URL(referrerUrl);
    return url.searchParams.get("utm_creative");
  } catch (error) {
    // URLのパースに失敗した場合は、リファラURL自体を返す
    return referrerUrl;
  }
}

@Injectable()
export class LadClickLogRepository extends BaseAspRepository {
  protected readonly format = "individual" as const;

  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.LAD);
  }

  async save(logs: RawLadData[]): Promise<number> {
    try {
      const formatted = await Promise.all(
        logs
          .filter((item) => {
            if (!item["クリック日時"] || !item["広告名"]) {
              this.logger.warn(
                `Skipping invalid record: ${JSON.stringify(item)}`,
              );
              return false;
            }
            return true;
          })
          .map(async (item) => {
            try {
              const clickDateTime = parseToJst(item["クリック日時"]);
              const affiliateLinkName = item["広告名"]?.trim();
              const referrerUrl = item["リファラ"]?.trim() || null;
              const creativeValue = extractUtmCreative(referrerUrl);

              if (!clickDateTime) {
                this.logger.warn(
                  `Invalid date format: ${item["クリック日時"]}`,
                );
                return null;
              }

              if (!affiliateLinkName) {
                this.logger.warn("広告名が空です");
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
              let referrerLinkId = null;
              if (creativeValue) {
                try {
                  // まず既存のレコードを検索
                  const existingLink = await this.prisma.referrerLink.findUnique({
                    where: {
                      creative_value: creativeValue,
                    },
                  });

                  if (existingLink) {
                    referrerLinkId = existingLink.id;
                  } else {
                    // 存在しない場合のみ新規作成
                    const newLink = await this.prisma.referrerLink.create({
                      data: {
                        creative_value: creativeValue,
                      },
                    });
                    referrerLinkId = newLink.id;
                  }
                } catch (error) {
                  this.logger.warn(
                    `Failed to process referrer link for creative value: ${creativeValue}`,
                    error,
                  );
                }
              }

              return {
                clickDateTime,
                affiliate_link_id: affiliateLink.id,
                referrer_link_id: referrerLinkId,
                referrerUrl,
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
      this.logger.error("Error saving LAD click logs:", error);
      throw error;
    }
  }
}
