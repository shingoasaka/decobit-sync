import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokCampaignReport } from "../../interfaces/report.interface";
import { BaseReportRepository } from "../../base/base-report.repository";

/**
 * TikTok キャンペーンレポートリポジトリ
 * データベース操作とバッチ処理を担当
 */
@Injectable()
export class TikTokCampaignRepository extends BaseReportRepository<TikTokCampaignReport> {
  private readonly logger = new Logger(TikTokCampaignRepository.name);

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async save(records: TikTokCampaignReport[]): Promise<number> {
    if (records.length === 0) {
      this.logger.debug("処理対象のデータがありません");
      return 0;
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const batchSize = 1000;
        let totalSaved = 0;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          const result = await tx.tikTokRawReportCampaign.createMany({
            data: batch,
            skipDuplicates: true,
          });
          totalSaved += result.count;
        }
        this.logger.log(
          `✅ ${totalSaved} 件のキャンペーンレポートを保存しました`,
        );
        return totalSaved;
      });
    } catch (error) {
      this.logger.error(
        "データの保存に失敗しました",
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
