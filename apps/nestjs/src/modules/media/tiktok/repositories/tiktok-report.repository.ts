import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";
import { TikTokReport } from "../interface/tiktok-report.interface";
import { NormalizeTiktokReport } from "../interface/tiktok-report.interface";

@Injectable()
export class TikTokReportRepository {
  private readonly logger = new Logger(TikTokReportRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * TikTok APIから取得したレポートデータをデータベースに保存する
   * @param reports 保存するレポートデータの配列
   * @returns 保存に成功したレコード数
   */
  async save(reports: TikTokReport[]): Promise<number> {
    if (!reports?.length) {
      this.logger.log("保存対象のTikTokデータがありません");
      return 0;
    }

    try {
      // データベースへの保存処理
      const result = await this.prisma.tikTokReport.createMany({
        data: reports,
        // skipDuplicates: true, // 重複データはスキップ
      });

      this.logger.log(
        `Successfully inserted ${result.count} TikTok report records`,
      );

      //保存後に正規化テーブルへの保存も実施
      await this.normalizeReports(reports);
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


   /**
   * 正規化テーブル (NormalizeTiktokReport) に保存する
   * 
   * - 広告ごとに最新の情報だけを保存
   * - 同じ広告IDがあれば上書き、なければ新規作成
   * 
   * @param reports 正規化対象のレポート配列
   * @returns 保存できた件数
   */
   async normalizeReports(reports: TikTokReport[]): Promise<number> {
    if (!reports?.length) {
      this.logger.log("正規化するTikTokデータがありません");
      return 0;
    }
  
    const operations = reports.map((report) => {
      const data = {
        advertiserId: report.advertiserId,
        campaignId: report.campaignId,
        adgroupId: report.adgroupId,
        adId: report.adId,
        statTimeDay: report.statTimeDay,
        budget: report.budget,
        spend: report.spend,
        impressions: report.impressions,
        clicks: report.clicks,
        videoPlayActions: report.videoPlayActions,
        videoWatched2s: report.videoWatched2s,
        videoWatched6s: report.videoWatched6s,
        videoViewsP100: report.videoViewsP100,
        reach: report.reach,
        campaignName: report.campaignName,
        adgroupName: report.adgroupName,
        adName: report.adName,
        adUrl: report.adUrl,
      };
      return this.prisma.normalizeTiktokReport.upsert({
        where: {
          campaignId_adgroupId_adId: {
            campaignId: report.campaignId,
            adgroupId: report.adgroupId,
            adId: report.adId,
          },
        },
        create: data,
        update: { ...data, updatedAt: new Date() },
      });
    });
  
    try {
      await this.prisma.$transaction(operations);
      this.logger.log(`${reports.length}件のTikTok正規化データを保存しました`);
    } catch (error) {
      this.logger.error(
        `NormalizeTiktokReport保存中にエラーが発生しました`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error("正規化テーブル(NormalizeTiktokReport)保存に失敗しました");
    }
  
    // 正規化後、さらにマスターテーブルに同期
    try {
      // await this.normalizeToMasterTables(reports);
    } catch (error) {
      this.logger.error(
        `マスターテーブル同期中にエラーが発生しました`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error("マスターテーブル(Normalize→Ad/AdGroup/Campaign)保存に失敗しました");
    }
  
    return reports.length;
  }
  
  
  /**
 * 正規化されたレポートデータをもとに、
 * マスターテーブル（TikTokAd, TikTokAdGroup, TikTokCampaign）を更新・登録する。
 * 
 * - 同じIDが存在すれば更新（upsert）
 * - 存在しなければ新規作成
 * - 全てまとめてトランザクション処理
 * 
 * @param reports 正規化されたTikTokレポートデータの配列
 * @returns 保存できた件数
 */

  // async normalizeToMasterTables(reports: NormalizeTiktokReport[]) {
  //   const adOps = [];
  //   const adGroupOps = [];
  //   const campaignOps = [];
  
  //   for (const report of reports) {
  //     adOps.push(
  //       this.prisma.tikTokAd.upsert({
  //         where: { adId: report.adId },
  //         create: {
  //           advertiserId: report.advertiserId,
  //           adId: report.adId,
  //           adgroup_id: report.adgroupId,
  //           campaign_id: report.campaignId,
  //           adName: report.adName ?? "",
  //         },
  //         update: {
  //           adName: report.adName ?? "",
  //           updatedAt: new Date(),
  //         },
  //       }),
  //     );
  
  //     adGroupOps.push(
  //       this.prisma.tikTokAdGroup.upsert({
  //         where: {
  //           adId_adgroup_id: {
  //             adId: report.adId,
  //             adgroup_id: report.adgroupId,
  //           },
  //         },
  //         create: {
  //           advertiserId: report.advertiserId,
  //           adId: report.adId,
  //           adgroup_id: report.adgroupId,
  //           campaign_id: report.campaignId,
  //           adgroupName: report.adgroupName ?? "",
  //         },
  //         update: {
  //           adgroupName: report.adgroupName ?? "",
  //           updatedAt: new Date(),
  //         },
  //       }),
  //     );
  
  //     campaignOps.push(
  //       this.prisma.tikTokCampaign.upsert({
  //         where: { campaignId: report.campaignId },
  //         create: {
  //           advertiserId: report.advertiserId,
  //           campaignId: report.campaignId,
  //           campaignName: report.campaignName ?? "",
  //         },
  //         update: {
  //           campaignName: report.campaignName ?? "",
  //           updatedAt: new Date(),
  //         },
  //       }),
  //     );
  //   }
  
  //   try {
  //     await this.prisma.$transaction([...adOps, ...adGroupOps, ...campaignOps]);
  //     this.logger.log(`マスターテーブル（Ad/AdGroup/Campaign）に正規化データを保存しました`);
  //     return reports.length;
  //   } catch (error) {
  //     this.logger.error(
  //       `マスターテーブル（Ad/AdGroup/Campaign）保存中にエラーが発生しました`,
  //       error instanceof Error ? error.stack : String(error),
  //     );
  //     throw new Error("マスターテーブル保存に失敗しました");
  //   }
  // }
  
  


}
