import { PrismaService } from "@prismaService";

/**
 * レポートリポジトリの共通インターフェース
 * 純粋なデータアクセス操作のみを定義
 */
export interface IReportRepository<T> {
  save(records: T[]): Promise<number>;
  getAccountMapping(advertiserIds: string[]): Promise<Map<string, number>>;
}

/**
 * レポートリポジトリの共通抽象クラス
 * 共通のデータアクセス操作を提供
 */
export abstract class BaseReportRepository<T> implements IReportRepository<T> {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * レコードをバッチ保存
   * 純粋なデータベース操作のみ
   */
  abstract save(records: T[]): Promise<number>;

  /**
   * 広告主IDとアカウントIDのマッピングを取得
   * 共通のデータアクセス操作
   */
  async getAccountMapping(advertiserIds: string[]): Promise<Map<string, number>> {
    const accountMapping = await this.prisma.adAccount.findMany({
      where: {
        ad_platform_account_id: { in: advertiserIds },
      },
      select: {
        id: true,
        ad_platform_account_id: true,
      },
    });
    
    return new Map<string, number>(
      accountMapping.map((acc) => [
        acc.ad_platform_account_id,
        acc.id,
      ]),
    );
  }
}
