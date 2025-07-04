import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AdgroupData } from "../../interfaces/master-data.interface";

/**
 * Adgroupマスターデータの共通Repository
 * 全媒体共通のAdgroupデータアクセス処理
 */
@Injectable()
export class AdgroupRepository {
  private readonly logger = new Logger(AdgroupRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adgroupデータをupsert
   * platform_adgroup_idをキーとしたupsert処理
   * 個別レコードのエラーが全体を停止しないよう処理
   */
  async upsert(data: AdgroupData[]): Promise<number> {
    if (data.length === 0) {
      return 0;
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. 必要なCampaign IDを一括取得（重複除去）
      const campaignIds = [...new Set(data.map((d) => d.platform_campaign_id))];
      const campaigns = await tx.campaign.findMany({
        where: { platform_campaign_id: { in: campaignIds } },
        select: { id: true, platform_campaign_id: true },
      });

      // Campaign ID → DB ID のマップ作成
      const campaignMap = new Map(
        campaigns.map((c) => [c.platform_campaign_id, c.id]),
      );

      // 2. 既存のAdgroupを一括取得
      const adgroupIds = data.map((d) => d.platform_adgroup_id);
      const existingAdgroups = await tx.adgroup.findMany({
        where: { platform_adgroup_id: { in: adgroupIds } },
        select: { id: true, platform_adgroup_id: true, adgroup_name: true },
      });

      const existingAdgroupMap = new Map(
        existingAdgroups.map((a) => [a.platform_adgroup_id, a]),
      );

      // 3. 更新対象と作成対象を分離
      const toUpdate: any[] = [];
      const toCreate: any[] = [];
      const errors: string[] = [];

      for (const record of data) {
        const campaignId = campaignMap.get(record.platform_campaign_id);
        if (!campaignId) {
          const errorMessage = `Campaign not found for platform_campaign_id=${record.platform_campaign_id}`;
          errors.push(errorMessage);
          this.logger.warn(errorMessage);
          continue;
        }

        const existing = existingAdgroupMap.get(record.platform_adgroup_id);

        if (existing) {
          // 名前が変更されている場合のみ更新
          if (existing.adgroup_name !== record.adgroup_name) {
            toUpdate.push({
              where: { id: existing.id },
              data: { adgroup_name: record.adgroup_name },
            });
          }
        } else {
          // 新規作成
          toCreate.push({
            ad_account_id: record.ad_account_id,
            campaign_id: campaignId,
            platform_adgroup_id: record.platform_adgroup_id,
            adgroup_name: record.adgroup_name,
            created_at: new Date(),
          });
        }
      }

      // 4. 一括更新（PrismaのupdateManyは使えないので、Promise.allで並列実行）
      let updateCount = 0;
      if (toUpdate.length > 0) {
        const updatePromises = toUpdate.map((updateData) =>
          tx.adgroup.update(updateData).catch((error) => {
            this.logger.warn(`Update error: ${error.message}`);
            return null;
          }),
        );
        const updateResults = await Promise.all(updatePromises);
        updateCount = updateResults.filter((r) => r !== null).length;
      }

      // 5. 一括作成
      let createCount = 0;
      if (toCreate.length > 0) {
        try {
          const createResults = await tx.adgroup.createMany({
            data: toCreate,
            skipDuplicates: true, // 重複はスキップ
          });
          createCount = createResults.count;
        } catch (error) {
          this.logger.warn(
            `Batch create error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          // フォールバック: 1つずつ作成
          for (const createData of toCreate) {
            try {
              await tx.adgroup.create({ data: createData });
              createCount++;
            } catch (createError) {
              this.logger.warn(
                `Individual create error: ${createError instanceof Error ? createError.message : "Unknown error"}`,
              );
            }
          }
        }
      }

      const totalUpserted = updateCount + createCount;

      if (errors.length > 0) {
        this.logger.warn(
          `Adgroup batch upsert completed with ${errors.length} errors: ${errors.join(", ")}`,
        );
      }

      this.logger.log(
        `Adgroup batch upsert: ${totalUpserted} processed (${updateCount} updated, ${createCount} created)`,
      );

      return totalUpserted;
    });
  }

  /**
   * platform_adgroup_idからAdgroupを取得
   */
  async findByPlatformId(platformAdgroupId: bigint) {
    return await this.prisma.adgroup.findUnique({
      where: {
        platform_adgroup_id: platformAdgroupId,
      },
    });
  }
}
