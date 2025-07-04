import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { CampaignData } from "../../interfaces/master-data.interface";

/**
 * Campaignマスターデータの共通Repository
 * 全媒体共通のCampaignデータアクセス処理
 */
@Injectable()
export class CampaignRepository {
  private readonly logger = new Logger(CampaignRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Campaignデータをupsert
   * platform_campaign_idをキーとしたupsert処理
   * 個別レコードのエラーが全体を停止しないよう処理
   */
  async upsert(data: CampaignData[]): Promise<number> {
    if (data.length === 0) {
      return 0;
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. 既存のCampaignを一括取得
      const campaignIds = data.map((d) => d.platform_campaign_id);
      const existingCampaigns = await tx.campaign.findMany({
        where: { platform_campaign_id: { in: campaignIds } },
        select: { id: true, platform_campaign_id: true, campaign_name: true },
      });

      const existingCampaignMap = new Map(
        existingCampaigns.map((c) => [c.platform_campaign_id, c]),
      );

      // 2. 更新対象と作成対象を分離
      const toUpdate: any[] = [];
      const toCreate: any[] = [];

      for (const record of data) {
        const existing = existingCampaignMap.get(record.platform_campaign_id);

        if (existing) {
          // 名前が変更されている場合のみ更新
          if (existing.campaign_name !== record.campaign_name) {
            toUpdate.push({
              where: { id: existing.id },
              data: { campaign_name: record.campaign_name },
            });
          }
        } else {
          // 新規作成
          toCreate.push({
            ad_account_id: record.ad_account_id,
            platform_campaign_id: record.platform_campaign_id,
            campaign_name: record.campaign_name,
            created_at: new Date(),
          });
        }
      }

      // 3. 一括更新（並列実行）
      let updateCount = 0;
      if (toUpdate.length > 0) {
        const updatePromises = toUpdate.map((updateData) =>
          tx.campaign.update(updateData).catch((error) => {
            this.logger.warn(`Campaign update error: ${error.message}`);
            return null;
          }),
        );
        const updateResults = await Promise.all(updatePromises);
        updateCount = updateResults.filter((r) => r !== null).length;
      }

      // 4. 一括作成
      let createCount = 0;
      if (toCreate.length > 0) {
        try {
          const createResults = await tx.campaign.createMany({
            data: toCreate,
            skipDuplicates: true, // 重複はスキップ
          });
          createCount = createResults.count;
        } catch (error) {
          this.logger.warn(
            `Campaign batch create error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          // フォールバック: 1つずつ作成
          for (const createData of toCreate) {
            try {
              await tx.campaign.create({ data: createData });
              createCount++;
            } catch (createError) {
              this.logger.warn(
                `Campaign individual create error: ${createError instanceof Error ? createError.message : "Unknown error"}`,
              );
            }
          }
        }
      }

      const totalUpserted = updateCount + createCount;

      this.logger.log(
        `Campaign batch upsert: ${totalUpserted} processed (${updateCount} updated, ${createCount} created)`,
      );

      return totalUpserted;
    });
  }

  /**
   * platform_campaign_idからCampaignを取得
   */
  async findByPlatformId(platformCampaignId: bigint) {
    return await this.prisma.campaign.findUnique({
      where: {
        platform_campaign_id: platformCampaignId,
      },
    });
  }
}
