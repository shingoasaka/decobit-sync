import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawMonkeyData {
  [key: string]: string | null | undefined;
  タグ名?: string;
  click?: string;
}

@Injectable()
export class MonkeyClickLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.MONKEY);
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

  async save(clickData: RawMonkeyData[]): Promise<number> {
    try {
      const results = await Promise.all(
        clickData.map(async (item) => {
          const affiliateLinkName = item.タグ名?.trim();
          if (!affiliateLinkName) {
            this.logger.warn("Skipping record with empty affiliateLinkName");
            return 0;
          }

          const currentTotalClicks = this.toInt(item.click);
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
      this.logger.error("Error saving Monkey click data:", error);
      throw error;
    }
  }
}
