import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokCampaignReport } from "../../interfaces/report-campaign.interface";

@Injectable()
export class TikTokCampaignRepository {
  private readonly logger = new Logger(TikTokCampaignRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(records: TikTokCampaignReport[]): Promise<number> {
    if (records.length === 0) {
      this.logger.debug("処理対象のデータがありません");
      return 0;
    }

    try {
      const result = await this.prisma.tikTokRawReportCampaign.createMany({
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
