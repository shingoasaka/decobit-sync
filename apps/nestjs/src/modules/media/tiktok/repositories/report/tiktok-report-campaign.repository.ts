import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokRawReportCampaign } from "../../interface/tiktok-report.interface";

@Injectable()
export class TikTokReportCampaignRepository {
  private readonly logger = new Logger(TikTokReportCampaignRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(reports: TikTokRawReportCampaign[]): Promise<number> {
    if (!reports?.length) {
      this.logger.log("保存対象のTikTok Campaignデータがありません");
      return 0;
    }

    try {
      const result = await this.prisma.tikTokRawReportCampaign.createMany({
        data: reports,
        skipDuplicates: true,
      });

      this.logger.log(
        `✅ ${result.count} 件の TikTok Campaign レポートを保存しました`,
      );

      return result.count;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      const errorStack = error instanceof Error ? error.stack : "";
      this.logger.error(
        `❌ Campaignレポート保存中にエラーが発生: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`Campaignレポート保存に失敗: ${errorMessage}`);
    }
  }
}
