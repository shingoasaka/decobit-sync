import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";

// 入力データの型定義
interface RawMonkeyData {
  [key: string]: string | null | undefined;
  タグ名?: string;
  Click?: string;
}
// 変換後のデータの型定義
interface FormattedMonkeyData {
  tagName: string | null;
  clickData: number | null;
}

@Injectable()
export class MonkeyClickLogRepository {
  private readonly logger = new Logger(MonkeyClickLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

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
    return {
      tagName: item["タグ名"] || null,
      clickData: this.toInt(item["Click"]),
    };
  }

  async save(conversionData: RawMonkeyData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.monkeyClickLog.createMany({
        data: formattedData,
        skipDuplicates: true,
      });

      this.logger.log(`Successfully inserted ${result.count} records`);
      return result.count;
    } catch (error) {
      this.logger.error("Error saving click data:", error);
      throw error;
    }
  }
}
