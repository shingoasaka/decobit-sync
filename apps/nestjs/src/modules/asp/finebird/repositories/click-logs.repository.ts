import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst } from "src/libs/date-utils";

// スクレイピングで取得する生データの型
interface RawFinebirdData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  サイト名?: string;
  総クリック?: string;
}

@Injectable()
export class FinebirdClickLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.FINEBIRD);
  }

  private toInt(value: string | null | undefined): number {
    if (!value) return 0;
    try {
      const cleanValue = value.replace(/[,¥]/g, "");
      const num = parseInt(cleanValue, 10);
      return isNaN(num) ? 0 : num;
    } catch (error) {
      this.logger.warn(`Invalid number format: ${value}`);
      return 0;
    }
  }

  async save(clickData: RawFinebirdData[]): Promise<number> {
    try {
      const results = await Promise.all(
        clickData.map(async (item) => {
          const affiliateLinkName = item.サイト名?.trim();
          if (!affiliateLinkName) {
            this.logger.warn("Skipping record with empty affiliateLinkName");
            return 0;
          }

          const currentTotalClicks = this.toInt(item.総クリック);
          if (currentTotalClicks === 0) {
            this.logger.debug(
              `Skipping record with zero clicks: ${affiliateLinkName}`,
            );
            return 0;
          }

          return await this.saveToCommonTable(
            [{ affiliateLinkName }],
            "aspClickLog",
            {
              currentTotalClicks,
            },
          );
        }),
      );

      return results.reduce((sum, count) => sum + count, 0);
    } catch (error) {
      this.logger.error("Error saving Finebird click data:", error);
      throw error;
    }
  }

  protected async saveSnapshot(data: {
    affiliateLinkName: string;
    currentClicks: number;
  }): Promise<void> {
    const now = getNowJst();

    // 単純にスナップショットを作成
    await this.prisma.clickLogSnapshot.create({
      data: {
        aspType: this.aspType,
        ...data,
        snapshotDate: now,
        createdAt: now,
        updatedAt: now,
      },
    });

    this.logger.debug(
      `Saved new snapshot for ${this.aspType}/${data.affiliateLinkName}: ${data.currentClicks} at ${now.toISOString()}`,
    );
  }
}
