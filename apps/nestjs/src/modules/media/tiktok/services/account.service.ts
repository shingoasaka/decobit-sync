import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class TikTokAccountService {
  private readonly logger = new Logger(TikTokAccountService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAccountIds(): Promise<string[]> {
    const accounts = await this.prisma.adAccount.findMany({
      where: {
        ad_platform_id: 1, // TikTokのプラットフォームID
      },
      select: { ad_platform_account_id: true },
    });
    return accounts.map((account) => account.ad_platform_account_id);
  }
}
