import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst } from "src/libs/date-utils";

// Hanikamu固有のカラム名を持つインターフェース
interface RawHanikamuData {
  ランディングページ?: string;
  CLICK数?: string;
}

@Injectable()
export class HanikamuClickLogRepository extends BaseAspRepository {
  protected readonly format = "total" as const;

  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.HANIKAMU);
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

  private formatData(item: RawHanikamuData) {
    const affiliateLinkName = item["ランディングページ"]?.trim();
    if (!affiliateLinkName) {
      throw new Error("ランディングページが必須です");
    }

    const currentTotalClicks = this.toInt(item["CLICK数"]);
    if (currentTotalClicks === 0) {
      throw new Error("CLICK数が0です");
    }

    return {
      affiliateLinkName,
      currentTotalClicks,
      referrerUrl: null,
    };
  }

  async save(clickData: RawHanikamuData[]): Promise<number> {
    try {
      const formatted = clickData.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving Hanikamu click data:", error);
      throw error;
    }
  }
}
