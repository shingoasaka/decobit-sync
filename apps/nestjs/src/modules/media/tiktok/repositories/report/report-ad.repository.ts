import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokAdReport } from "../../interfaces/report.interface";
import { BaseReportRepository } from "../../base/base-report.repository";

/**
 * TikTok 広告レポートリポジトリ
 * 純粋なデータアクセス操作のみを担当
 */
@Injectable()
export class TikTokAdRepository extends BaseReportRepository<TikTokAdReport> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * 広告レポートをバッチ保存
   * 純粋なデータベース操作のみ
   */
  async save(records: TikTokAdReport[]): Promise<number> {
    if (records.length === 0) {
      return 0;
    }

    return await this.prisma.$transaction(async (tx) => {
      const batchSize = 1000;
      let totalSaved = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const result = await tx.tikTokRawReportAd.createMany({
          data: batch,
          skipDuplicates: true,
        });
        totalSaved += result.count;
      }

      return totalSaved;
    });
  }
}
