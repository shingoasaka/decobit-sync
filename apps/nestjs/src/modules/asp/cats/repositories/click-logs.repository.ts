import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";

interface ClickLogData {
  clickDateTime: Date;
  affiliate_link_id: number;
  referrer_link_id: number | null;
  referrer_url: string | null;
}

@Injectable()
export class CatsClickLogRepository extends BaseAspRepository {
  protected readonly format = "individual" as const;

  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.CATS);
  }

  async save(clickLogs: ClickLogData[]): Promise<number> {
    try {
      return await this.saveToCommonTable(clickLogs);
    } catch (error) {
      this.logger.error("Error saving click logs:", error);
      throw error;
    }
  }

  async getOrCreateAffiliateLink(affiliateLinkName: string) {
    return await this.prisma.affiliateLink.upsert({
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
  }
}
