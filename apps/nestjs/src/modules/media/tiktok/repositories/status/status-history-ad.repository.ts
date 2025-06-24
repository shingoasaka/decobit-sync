import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokAdStatusHistory } from "../../interfaces/status-history.interface";

/**
 * TikTok 広告ステータス履歴リポジトリ
 * ステータス変更履歴の保存・取得を担当
 */
@Injectable()
export class TikTokAdStatusHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ステータス履歴をバッチ保存
   * ステータス変更があった場合のみ記録
   */
  async saveStatusHistory(records: TikTokAdStatusHistory[]): Promise<number> {
    if (records.length === 0) {
      return 0;
    }

    return await this.prisma.$transaction(async (tx) => {
      const batchSize = 1000;
      let totalSaved = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const result = await tx.tikTokStatusHistoryAd.createMany({
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
   * 指定された広告IDの最新ステータスを取得
   */
  async getLatestStatus(adId: bigint): Promise<TikTokAdStatusHistory | null> {
    return await this.prisma.tikTokStatusHistoryAd.findFirst({
      where: { platform_ad_id: adId },
      orderBy: { status_updated_time: "desc" },
    });
  }

  /**
   * 複数の広告の最新ステータスを一括取得
   */
  async getLatestStatuses(adIds: bigint[]): Promise<TikTokAdStatusHistory[]> {
    if (adIds.length === 0) {
      return [];
    }

    // 各広告IDの最新ステータスを取得
    const latestStatuses = await this.prisma.$queryRaw<TikTokAdStatusHistory[]>`
      SELECT DISTINCT ON (platform_ad_id) *
      FROM "TikTokStatusHistoryAd"
      WHERE platform_ad_id = ANY(${adIds}::bigint[])
      ORDER BY platform_ad_id, status_updated_time DESC
    `;

    return latestStatuses;
  }
}
