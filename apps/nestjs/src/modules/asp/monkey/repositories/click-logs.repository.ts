import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst } from "src/libs/date-utils";

// Monkey固有のカラム名を持つインターフェース
interface RawMonkeyData {
  タグ名?: string;
  click?: string;
}

@Injectable()
export class MonkeyClickLogRepository extends BaseAspRepository {
  protected readonly format = "total" as const;

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

  private formatData(item: RawMonkeyData) {
    const affiliateLinkName = item["タグ名"]?.trim();
    if (!affiliateLinkName) {
      throw new Error("タグ名が必須です");
    }

    const currentTotalClicks = this.toInt(item["click"]);
    if (currentTotalClicks === 0) {
      throw new Error("click数が0です");
    }

    return {
      affiliateLinkName,
      currentTotalClicks,
      referrerUrl: null,
    };
  }

  async save(clickData: RawMonkeyData[]): Promise<number> {
    try {
      const formatted = clickData.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving Monkey click data:", error);
      throw error;
    }
  }
}
