import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prismaService';

@Injectable()
export class TikTokAccountService {
  private readonly logger = new Logger(TikTokAccountService.name);
  private readonly TIKTOK_PLATFORM_ID = 1;

  constructor(private readonly prisma: PrismaService) {}

  async getAccountIds(): Promise<string[]> {
    try {
      // プラットフォームの存在確認
      const platform = await this.prisma.adPlatform.findUnique({
        where: { id: this.TIKTOK_PLATFORM_ID },
      });

      if (!platform) {
        this.logger.error(
          `TikTokプラットフォーム(ID: ${this.TIKTOK_PLATFORM_ID})が見つかりません`,
        );
        return [];
      }

      // アカウントの取得
      const accounts = await this.prisma.adAccount.findMany({
        where: {
          ad_platform_id: this.TIKTOK_PLATFORM_ID,
        },
        select: {
          id: true,
          ad_platform_account_id: true,
          name: true,
          ad_platform_id: true,
        },
      });

      if (accounts.length === 0) {
        this.logger.warn('TikTokの広告アカウントが登録されていません');
        return [];
      }

      this.logger.log(
        `${accounts.length}件のTikTok広告アカウントを取得しました`,
      );

      return accounts.map((account) => account.ad_platform_account_id);
    } catch (error) {
      this.logger.error(
        'TikTok広告アカウントの取得に失敗しました',
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error('TikTok広告アカウントの取得に失敗しました');
    }
  }
}
