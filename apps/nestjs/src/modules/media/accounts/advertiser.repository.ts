import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AdAccounts } from "./advertiser.interface";
import { PLATFORM_IDS } from "src/constants/platform";

@Injectable()
export class MediaAdvertiserRepository {
  private readonly logger = new Logger(MediaAdvertiserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertMany(advertisers: AdAccounts[]): Promise<number> {
    if (!advertisers?.length) return 0;

    const operations = advertisers.map((advertiser) => {
      return this.prisma.adAccount.upsert({
        where: {
          ad_platform_account_id_ad_platform_id: {
            ad_platform_account_id: advertiser.ad_platform_account_id,
            ad_platform_id: advertiser.ad_platform_id,
          },
        },
        create: {
          name: advertiser.name,
          ad_platform_account_id: advertiser.ad_platform_account_id,
          ad_platform_id: advertiser.ad_platform_id,
          department_id: null,
          project_id: null,
        },
        update: {
          name: advertiser.name,
          ad_platform_account_id: advertiser.ad_platform_account_id,
          updated_at: new Date(),
        },
      });
    });

    try {
      await this.prisma.$transaction(operations);
      this.logger.log(
        `[MediaAdvertiser] ${operations.length} 件の広告主アカウントを保存しました`,
      );
      return operations.length;
    } catch (error) {
      this.logger.error(
        "[MediaAdvertiser] 広告主アカウントの保存中にエラーが発生しました",
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async findAdvertisersByPlatform(
    platformId: (typeof PLATFORM_IDS)[keyof typeof PLATFORM_IDS],
  ): Promise<string[]> {
    try {
      const advertisers = await this.prisma.adAccount.findMany({
        where: {
          ad_platform_id: platformId,
        },
        select: {
          ad_platform_account_id: true,
        },
      });

      return advertisers.map(
        (advertiser: { ad_platform_account_id: string }) =>
          advertiser.ad_platform_account_id,
      );
    } catch (error) {
      this.logger.error(
        "[MediaAdvertiser] 広告主ID取得中にエラーが発生しました",
        {
          platformId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      throw error;
    }
  }
}
