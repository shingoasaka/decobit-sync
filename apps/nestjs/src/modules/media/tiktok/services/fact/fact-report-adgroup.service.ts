import { Injectable, Logger } from "@nestjs/common";
import { TikTokRawReportAdgroup } from "../../interface/tiktok-report.interface";
import { FactAdgroupReportRepository } from "../../repositories/fact/fact-report-adgroup.repository";

@Injectable()
export class FactAdgroupReportService {
  private readonly logger = new Logger(FactAdgroupReportService.name);

  constructor(
    private readonly factAdgroupReportRepository: FactAdgroupReportRepository,
  ) {}

  async normalize(reports: TikTokRawReportAdgroup[]): Promise<number> {
    if (!reports?.length) {
      this.logger.log("正規化対象のレポートがありません");
      return 0;
    }

    try {
      const count = await this.factAdgroupReportRepository.upsertMany(reports);
      this.logger.log(
        `${count} 件の TikTok 広告レポートを正規化テーブルに保存しました`,
      );
      return count;
    } catch (error) {
      this.logger.error(
        "TikTokレポートの正規化保存中にエラーが発生しました",
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error("TiktokFactReportAdgroup の保存に失敗しました");
    }
  }
}
