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
export class LadActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.LAD);
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
      update: {
        affiliate_link_name: affiliateLinkName,
      },
      create: {
        asp_type: this.aspType,
        affiliate_link_name: affiliateLinkName,
      },
    });
  }

  async processReferrerLink(
    referrer_url: string | null,
  ): Promise<{ referrerLinkId: number | null; referrer_url: string | null }> {
    if (!referrer_url) {
      return { referrerLinkId: null, referrer_url: null };
    }

    const { creativeValue, originalUrl } =
      this.extractUtmCreative(referrer_url);
    if (!creativeValue) {
      return { referrerLinkId: null, referrer_url };
    }

    try {
      // まず既存のレコードを検索
      const existingLink = await this.prisma.referrerLink.findFirst({
        where: {
          creative_value: creativeValue,
        },
      });

      if (existingLink) {
        return { referrerLinkId: existingLink.id, referrer_url };
      }

      // 存在しない場合のみ新規作成
      const newLink = await this.prisma.referrerLink.create({
        data: {
          creative_value: creativeValue,
          original_url: originalUrl,
        },
      });

      return { referrerLinkId: newLink.id, referrer_url };
    } catch (error: any) {
      // 作成時に競合が発生した場合（他のプロセスが同時に作成した場合）
      if (error.code === "P2002") {
        // 再度検索して既存のレコードを取得
        const existingLink = await this.prisma.referrerLink.findFirst({
          where: {
            creative_value: creativeValue,
          },
        });
        if (existingLink) {
          return { referrerLinkId: existingLink.id, referrer_url };
        }
      }
      this.logger.warn(
        `Failed to process referrer link for creative value: ${creativeValue}`,
        error,
      );
      return { referrerLinkId: null, referrer_url };
    }
  }
}
