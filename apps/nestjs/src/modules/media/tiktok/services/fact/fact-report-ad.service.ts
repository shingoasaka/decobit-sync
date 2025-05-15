import { Injectable, Logger } from "@nestjs/common";
import { TikTokRawReportAd } from "../../interface/tiktok-report.interface"; 
import { FactAdReportRepository } from "../../repositories/fact/fact-report-ad.repository";

@Injectable()
export class FactAdReportService {
  private readonly logger = new Logger(FactAdReportService.name);

  constructor(
    private readonly factAdReportRepository: FactAdReportRepository
  ) {}

  async normalize(reports: TikTokRawReportAd[]): Promise<number> {
    if (!reports?.length) {
      this.logger.log("正規化対象のレポートがありません");
      return 0;
    }

    try {
      const count = await this.factAdReportRepository.upsertMany(reports);
      this.logger.log(
        `${count} 件の TikTok 広告レポートを正規化テーブルに保存しました`
      );
      return count;
    } catch (error) {
      this.logger.error(
        "TikTokレポートの正規化保存中にエラーが発生しました",
        error instanceof Error ? error.stack : String(error)
      );
      throw new Error("TiktokFactReportAd の保存に失敗しました");
    }
  }
}
