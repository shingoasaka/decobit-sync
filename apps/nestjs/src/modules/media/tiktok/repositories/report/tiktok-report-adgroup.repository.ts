import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokRawReportAdgroup } from "../../interface/tiktok-report.interface";

@Injectable()
export class TikTokReportAdgroupRepository {
  private readonly logger = new Logger(TikTokReportAdgroupRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(reports: TikTokRawReportAdgroup[]): Promise<number> {
    if (!reports?.length) {
      this.logger.log("保存対象のTikTok AdGroupデータがありません");
      return 0;
    }

    try {
      const result = await this.prisma.tikTokRawReportAdgroup.createMany({
        data: reports,
        skipDuplicates: true,
      });

      this.logger.log(
        `✅ ${result.count} 件の TikTok AdGroup レポートを保存しました`,
      );

      return result.count;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      const errorStack = error instanceof Error ? error.stack : "";
      this.logger.error(
        `❌ AdGroupレポート保存中にエラーが発生: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`AdGroupレポートの保存に失敗: ${errorMessage}`);
    }
  }
}
