import { Injectable, Logger } from "@nestjs/common";
import { TikTokRawReportCampaign } from "../../interface/tiktok-report.interface";
import { FactCampaignReportRepository } from "../../repositories/fact/fact-report-campaign.repository";

@Injectable()
export class FactCampaignReportService {
  private readonly logger = new Logger(FactCampaignReportService.name);

  constructor(
    private readonly factCampaignReportRepository: FactCampaignReportRepository,
  ) {}

  async normalize(reports: TikTokRawReportCampaign[]): Promise<number> {
    if (!reports?.length) {
      this.logger.log("正規化対象のレポートがありません");
      return 0;
    }

    try {
      const count = await this.factCampaignReportRepository.upsertMany(reports);
      this.logger.log(
        `${count} 件の TikTok 広告レポートを正規化テーブルに保存しました`,
      );
      return count;
    } catch (error) {
      this.logger.error(
        "TikTokレポートの正規化保存中にエラーが発生しました",
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error("TiktokFactReportCampaign の保存に失敗しました");
    }
  }
}
