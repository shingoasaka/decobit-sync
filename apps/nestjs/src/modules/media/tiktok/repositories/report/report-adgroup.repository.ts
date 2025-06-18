import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokAdgroupReport } from "../../interfaces/report.interface";

@Injectable()
export class TikTokAdGroupRepository {
  private readonly logger = new Logger(TikTokAdGroupRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(records: TikTokAdgroupReport[]): Promise<number> {
    if (records.length === 0) {
      this.logger.debug("処理対象のデータがありません");
      return 0;
    }

    try {
      const result = await this.prisma.tikTokRawReportAdGroup.createMany({
        data: records,
        skipDuplicates: true,
      });
      return result.count;
    } catch (error) {
      this.logger.error(
        "データの保存に失敗しました",
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
