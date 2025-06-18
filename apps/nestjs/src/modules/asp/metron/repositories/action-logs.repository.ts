import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import {
  BaseActionLogRepository,
  processReferrerLink,
} from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

/**
 * Metronのアクションログデータ形式
 *
 * Metronの特徴：
 * - アクションログでは直接リファラ情報を取得できない
 * - 代わりにsessionIdを使って、対応するクリックログからリファラ情報を取得する必要がある
 * - クリックログとアクションログはsessionIdで紐付けられる
 */
interface RawMetronData {
  actionDateTime?: string;
  siteName?: string;
  referrerUrl?: string; // sessionIDが同じクリックログのリファラを入れる
  sessionId?: string; // クリックログとの紐付けに使用
  clientInfo?: string;
}

interface ActionLogData {
  actionDateTime: Date;
  affiliate_link_id: number;
  referrer_link_id: number | null;
  referrerUrl: string | null;
  uid: string | null;
}

@Injectable()
export class MetronActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.METRON);
  }

  /**
   * sessionIdを使ってクリックログからリファラ情報を取得
   *
   * Metronの特殊な仕様に対応するため：
   * 1. sessionIdを使って対応するクリックログを検索
   * 2. クリックログからリファラURLを取得
   * 3. リファラURLからReferrerLinkを生成または取得
   *
   * @param sessionId クリックログとアクションログを紐付けるID
   * @returns リファラリンクIDとリファラURL
   */
  private async getReferrerFromClickLog(
    sessionId: string | null,
  ): Promise<{ referrerLinkId: number | null; referrerUrl: string | null }> {
    if (!sessionId) {
      return { referrerLinkId: null, referrerUrl: null };
    }

    // クリックログからsessionIdに一致するレコードを検索
    const clickLog = await this.prisma.aspClickLog.findFirst({
      where: {
        asp_type: this.aspType,
        referrer_url: {
          not: null,
          contains: `sessionId=${sessionId}`,
        },
      },
      select: { referrer_url: true },
      orderBy: {
        click_date_time: "desc", // 最新のクリックログを取得
      },
    });

    if (!clickLog?.referrer_url) {
      return { referrerLinkId: null, referrerUrl: null };
    }

    // クリックログのリファラURLを使ってReferrerLinkを処理
    return processReferrerLink(this.prisma, this.logger, clickLog.referrer_url);
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
}
