import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokAdgroupReport } from "../../interfaces/report.interface";
import { BaseReportRepository } from "../../base/base-report.repository";

/**
 * TikTok アドグループレポートリポジトリ
 * 純粋なデータアクセス操作のみを担当
 */
@Injectable()
export class TikTokAdgroupRepository extends BaseReportRepository<TikTokAdgroupReport> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  /**
   * アドグループレポートをバッチ保存
   * 純粋なデータベース操作のみ
   */
  async save(records: TikTokAdgroupReport[]): Promise<number> {
    if (records.length === 0) {
      return 0;
    }

    return await this.prisma.$transaction(async (tx) => {
      const batchSize = 1000;
      let totalSaved = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const result = await tx.tikTokRawReportAdgroup.createMany({
          data: batch,
          skipDuplicates: true,
        });
        totalSaved += result.count;
      }

      return totalSaved;
    });
  }
}
