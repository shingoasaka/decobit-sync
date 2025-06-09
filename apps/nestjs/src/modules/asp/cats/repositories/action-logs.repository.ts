import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawCatsData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  遷移広告URL名?: string;
}

interface FormattedCatsData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class CatsActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.CATS);
  }

  processCsvAndSave(downloadPath: string): number | PromiseLike<number> {
    throw new Error("Method not implemented.");
  }

  private getValue(item: RawCatsData, key: keyof RawCatsData): string | null {
    return item[key] ?? null;
  }

  async save(conversionData: RawCatsData[]): Promise<number> {
    try {
      const formatted = await Promise.all(
        conversionData.map(async (item) => {
          const actionDateTime = parseToJst(item["成果日時"]);
          const affiliateLinkName = item["遷移広告URL名"];

          // 名前→ID変換
          const affiliateLink = await this.prisma.affiliateLink.upsert({
            where: {
              asp_type_affiliate_link_name: {
                asp_type: this.aspType,
                affiliate_link_name: affiliateLinkName!,
              },
            },
            update: {},
            create: {
              asp_type: this.aspType,
              affiliate_link_name: affiliateLinkName!,
            },
          });

          return {
            actionDateTime: actionDateTime!,
            affiliate_link_id: affiliateLink.id,
            referrer_link_id: null, // CATSは常にnull
            referrerUrl: null,
            uid: null, // CATSは常にnull
          };
        }),
      );
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
