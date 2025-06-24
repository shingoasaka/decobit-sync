import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";

interface ActionLogData {
  actionDateTime: Date;
  affiliate_link_id: number;
  referrer_link_id: number | null;
  referrer_url: string | null;
  uid: string | null;
}

@Injectable()
export class CatsActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.CATS);
  }

  async save(actionLogs: ActionLogData[]): Promise<number> {
    try {
      return await this.saveToCommonTable(actionLogs);
    } catch (error) {
      this.logger.error("Error saving action logs:", error);
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
