import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { TikTokRawReportAd } from "../../interface/tiktok-report.interface";
import { TiktokFactReportAd } from "../../interface/tiktok-report.interface";

@Injectable()
export class TikTokReportRepository {
  private readonly logger = new Logger(TikTokReportRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * TikTok APIから取得したレポートデータをデータベースに保存する
   * @param reports 保存するレポートデータの配列
   * @returns 保存に成功したレコード数
   */
  async save(reports: TikTokRawReportAd[]): Promise<number> {
    if (!reports?.length) {
      this.logger.log("保存対象のTikTokデータがありません");
      return 0;
    }

    try {
      // データベースへの保存処理
      const result = await this.prisma.TikTokRawReportAd.createMany({
        data: reports,
        skipDuplicates: true, // 重複データはスキップ
      });

      this.logger.log(
        `Successfully inserted ${result.count} TikTok report records`,
      );

      return result.count;
    } catch (error: unknown) {
      // エラー処理の修正
      const isPrismaError =
        error instanceof Error &&
        "code" in error &&
        typeof error.code === "string";

      if (isPrismaError) {
        // Prismaエラーの型安全な処理
        const prismaError = error as Error & { code: string };
        if (prismaError.code === "P2002") {
          this.logger.warn(
            `一意性制約違反が発生しました: ${prismaError.message}`,
          );
        } else {
          this.logger.error(
            `Prismaエラー発生: ${prismaError.message}`,
            prismaError.stack,
          );
        }
      } else {
        // 一般的なエラー処理
        const errorMessage =
          error instanceof Error ? error.message : "不明なエラー";
        const errorStack = error instanceof Error ? error.stack : "";
        this.logger.error(
          `TikTokレポート保存中にエラーが発生: ${errorMessage}`,
          errorStack,
        );
      }

      // エラーを上位層に伝播
      throw new Error(
        `TikTokレポートの保存に失敗: ${error instanceof Error ? error.message : "不明なエラー"}`,
      );
    }
  }

  /**
   * 特定の期間のTikTokレポートを取得する
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 期間内のTikTokレポートデータ
   */
  async findByDateRange(startDate: string, endDate: string): Promise<any[]> {
    try {
      const reports = await this.prisma.tikTokReport.findMany({
        where: {
          statTimeDay: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          statTimeDay: "desc",
        },
      });

      this.logger.log(
        `Retrieved ${reports.length} TikTok reports between ${startDate} and ${endDate}`,
      );
      return reports;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      const errorStack = error instanceof Error ? error.stack : "";
      this.logger.error(
        `TikTokレポート取得中にエラーが発生: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`TikTokレポート取得に失敗: ${errorMessage}`);
    }
  }
}
