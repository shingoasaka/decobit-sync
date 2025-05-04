import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawMonkeyData {
  [key: string]: string | null | undefined;
  タグ名?: string;
  Click?: string;
}
// 変換後のデータの型定義
interface FormattedMonkeyData {
  affiliateLinkName: string | null;
  clickCount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class MonkeyClickLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.MONKEY);
  }

  private toInt(value: string | null | undefined): number | null {
    if (!value) return null;
    try {
      const cleanValue = value.replace(/[,¥]/g, "");
      const num = parseInt(cleanValue, 10);
      return isNaN(num) ? null : num;
    } catch (error) {
      this.logger.warn(`Invalid number format: ${value}`);
      return null;
    }
  }

  private formatData(item: RawMonkeyData): FormattedMonkeyData {
    const now = getNowJst();
    return {
      affiliateLinkName: item["タグ名"] || null,
      clickCount: this.toInt(item["Click"]),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawMonkeyData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspClickLog", {
        clickCount: formatted[0]?.clickCount ?? undefined,
      });
    } catch (error) {
      this.logger.error("Error saving click data:", error);
      throw error;
    }
  }
}
