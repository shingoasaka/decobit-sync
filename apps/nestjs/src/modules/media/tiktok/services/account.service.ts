import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class TikTokAccountService {
  private readonly logger = new Logger(TikTokAccountService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPlatformId(): Promise<number> {
    try {
      const platform = await this.prisma.adPlatform.findUnique({
        where: {
          name: "TikTok",
        },
        select: {
          id: true,
        },
      });

      if (!platform) {
        throw new Error("TikTok platform not found");
      }

      return platform.id;
    } catch (error) {
      this.logger.error("Failed to get TikTok platform ID:", error);
      throw error;
    }
  }

  async getAccountIds(): Promise<string[]> {
    try {
      const platformId = await this.getPlatformId();

      const accounts = await this.prisma.adAccount.findMany({
        where: {
          ad_platform_id: platformId,
        },
        select: {
          ad_platform_account_id: true,
        },
      });

      return accounts.map(
        (account: { ad_platform_account_id: string }) =>
          account.ad_platform_account_id,
      );
    } catch (error) {
      this.logger.error("Failed to get TikTok account IDs:", error);
      throw error;
    }
  }
}
