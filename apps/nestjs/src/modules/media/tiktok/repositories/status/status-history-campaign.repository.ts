import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokCampaignStatusHistory } from "../../interfaces/status-history.interface";

/**
 * TikTok キャンペーンステータス履歴リポジトリ
 * ステータス変更履歴の保存・取得を担当
 */
@Injectable()
export class TikTokCampaignStatusHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ステータス履歴をバッチ保存
   * ステータス変更があった場合のみ記録
   */
  async saveStatusHistory(
    records: TikTokCampaignStatusHistory[],
  ): Promise<number> {
    if (records.length === 0) {
      return 0;
    }

    return await this.prisma.$transaction(async (tx) => {
      const batchSize = 1000;
      let totalSaved = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const result = await tx.tikTokCampaignStatusHistory.createMany({
          data: batch,
          skipDuplicates: true,
        });
        totalSaved += result.count;
      }

      return totalSaved;
    });
  }

  /**
   * 最新のステータス履歴を取得
   * 指定されたキャンペーンIDの最新ステータスを取得
   */
  async getLatestStatus(
    campaignId: string,
  ): Promise<TikTokCampaignStatusHistory | null> {
    return await this.prisma.tikTokCampaignStatusHistory.findFirst({
      where: { platform_campaign_id: campaignId },
      orderBy: { created_at: "desc" },
    });
  }

  /**
   * 複数のキャンペーンの最新ステータスを一括取得
   */
  async getLatestStatuses(
    campaignIds: string[],
  ): Promise<TikTokCampaignStatusHistory[]> {
    if (campaignIds.length === 0) {
      return [];
    }

    // 各キャンペーンIDの最新ステータスを取得
    const latestStatuses = await this.prisma.$queryRaw<
      TikTokCampaignStatusHistory[]
    >`
      SELECT DISTINCT ON (platform_campaign_id) *
      FROM "TikTokCampaignStatusHistory"
      WHERE platform_campaign_id = ANY(${campaignIds}::text[])
      ORDER BY platform_campaign_id, created_at DESC
    `;

    return latestStatuses;
  }
}
