import { PrismaService } from "@prismaService";

/**
 * レポートリポジトリの共通インターフェース
 */
export interface IReportRepository<T> {
  save(records: T[]): Promise<number>;
  getAccountMapping(advertiserIds: string[]): Promise<Map<string, number>>;
}

/**
 * レポートリポジトリの共通抽象クラス
 * getAccountMappingの共通実装を提供
 */
export abstract class BaseReportRepository<T> implements IReportRepository<T> {
  constructor(protected readonly prisma: PrismaService) {}

  abstract save(records: T[]): Promise<number>;

  async getAccountMapping(
    advertiserIds: string[],
  ): Promise<Map<string, number>> {
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
      accountMapping.map(
        (acc: { ad_platform_account_id: string; id: number }) => [
          acc.ad_platform_account_id,
          acc.id,
        ],
      ),
    );
  }
}
