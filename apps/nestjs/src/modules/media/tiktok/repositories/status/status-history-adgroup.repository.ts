import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokAdgroupStatusHistory } from "../../interfaces/status-history.interface";

/**
 * TikTok 広告グループステータス履歴リポジトリ
 * ステータス変更履歴の保存・取得を担当
 */
@Injectable()
export class TikTokAdgroupStatusHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ステータス履歴をバッチ保存
   * ステータス変更があった場合のみ記録
   */
  async saveStatusHistory(
    records: TikTokAdgroupStatusHistory[],
  ): Promise<number> {
    if (records.length === 0) {
      return 0;
    }

    return await this.prisma.$transaction(async (tx) => {
      const batchSize = 1000;
      let totalSaved = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const result = await tx.tikTokStatusHistoryAdgroup.createMany({
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
   * 指定された広告グループIDの最新ステータスを取得
   */
  async getLatestStatus(
    adgroupId: bigint,
  ): Promise<TikTokAdgroupStatusHistory | null> {
    return await this.prisma.tikTokStatusHistoryAdgroup.findFirst({
      where: { platform_adgroup_id: adgroupId },
      orderBy: { status_updated_time: "desc" },
    });
  }

  /**
   * 複数の広告グループの最新ステータスを一括取得
   */
  async getLatestStatuses(
    adgroupIds: bigint[],
  ): Promise<TikTokAdgroupStatusHistory[]> {
    if (adgroupIds.length === 0) {
      return [];
    }

    // 各広告グループIDの最新ステータスを取得
    const latestStatuses = await this.prisma.$queryRaw<
      TikTokAdgroupStatusHistory[]
    >`
      SELECT DISTINCT ON (platform_adgroup_id) *
      FROM "TikTokStatusHistoryAdgroup"
      WHERE platform_adgroup_id = ANY(${adgroupIds}::bigint[])
      ORDER BY platform_adgroup_id, status_updated_time DESC
    `;

    return latestStatuses;
  }
}
