import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokAdReport } from "../interfaces/report-ad.interface";

@Injectable()
export class TikTokAdRepository {
  private readonly logger = new Logger(TikTokAdRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(records: TikTokAdReport[]): Promise<number> {
    if (records.length === 0) {
      this.logger.debug("処理対象のデータがありません");
      return 0;
    }

    try {
      const result = await this.prisma.tikTokRawReportAd.createMany({
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
