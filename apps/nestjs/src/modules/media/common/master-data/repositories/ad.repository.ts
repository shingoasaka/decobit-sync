import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AdData } from "../../interfaces/master-data.interface";

/**
 * Adマスターデータの共通Repository
 * 全媒体共通のAdデータアクセス処理
 */
@Injectable()
export class AdRepository {
  private readonly logger = new Logger(AdRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adデータをupsert
   * platform_ad_idをキーとしたupsert処理
   * 個別レコードのエラーが全体を停止しないよう処理
   */
  async upsert(data: AdData[]): Promise<number> {
    if (data.length === 0) {
      return 0;
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. 必要なAdgroup IDを一括取得（重複除去）
      const adgroupIds = [...new Set(data.map((d) => d.platform_adgroup_id))];
      const adgroups = await tx.adgroup.findMany({
        where: { platform_adgroup_id: { in: adgroupIds } },
        select: { id: true, platform_adgroup_id: true },
      });

      // Adgroup ID → DB ID のマップ作成
      const adgroupMap = new Map(
        adgroups.map((a) => [a.platform_adgroup_id, a.id]),
      );

      // 2. 既存のAdを一括取得
      const adIds = data.map((d) => d.platform_ad_id);
      const existingAds = await tx.ad.findMany({
        where: { platform_ad_id: { in: adIds } },
        select: { id: true, platform_ad_id: true, ad_name: true },
      });

      const existingAdMap = new Map(
        existingAds.map((a) => [a.platform_ad_id, a]),
      );

      // 3. 更新対象と作成対象を分離
      const toUpdate: any[] = [];
      const toCreate: any[] = [];
      const errors: string[] = [];

      for (const record of data) {
        const adgroupId = adgroupMap.get(record.platform_adgroup_id);
        if (!adgroupId) {
          const errorMessage = `Adgroup not found for platform_adgroup_id=${record.platform_adgroup_id}`;
          errors.push(errorMessage);
          this.logger.warn(errorMessage);
          continue;
        }

        const existing = existingAdMap.get(record.platform_ad_id);

        if (existing) {
          // 名前が変更されている場合のみ更新
          if (existing.ad_name !== record.ad_name) {
            toUpdate.push({
              where: { id: existing.id },
              data: { ad_name: record.ad_name },
            });
          }
        } else {
          // 新規作成
          toCreate.push({
            ad_account_id: record.ad_account_id,
            adgroup_id: adgroupId,
            platform_ad_id: record.platform_ad_id,
            ad_name: record.ad_name,
            created_at: new Date(),
          });
        }
      }

      // 4. 一括更新（並列実行）
      let updateCount = 0;
      if (toUpdate.length > 0) {
        const updatePromises = toUpdate.map((updateData) =>
          tx.ad.update(updateData).catch((error) => {
            this.logger.warn(`Ad update error: ${error.message}`);
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
          const createResults = await tx.ad.createMany({
            data: toCreate,
            skipDuplicates: true, // 重複はスキップ
          });
          createCount = createResults.count;
        } catch (error) {
          this.logger.warn(
            `Ad batch create error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          // フォールバック: 1つずつ作成
          for (const createData of toCreate) {
            try {
              await tx.ad.create({ data: createData });
              createCount++;
            } catch (createError) {
              this.logger.warn(
                `Ad individual create error: ${createError instanceof Error ? createError.message : "Unknown error"}`,
              );
            }
          }
        }
      }

      const totalUpserted = updateCount + createCount;

      if (errors.length > 0) {
        this.logger.warn(
          `Ad batch upsert completed with ${errors.length} errors: ${errors.join(", ")}`,
        );
      }

      this.logger.log(
        `Ad batch upsert: ${totalUpserted} processed (${updateCount} updated, ${createCount} created)`,
      );

      return totalUpserted;
    });
  }

  /**
   * platform_ad_idからAdを取得
   */
  async findByPlatformId(platformAdId: bigint) {
    return await this.prisma.ad.findUnique({
      where: {
        platform_ad_id: platformAdId,
      },
    });
  }
}
