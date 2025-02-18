import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

// 入力データの型定義
interface RawMonkeyClickData {
  [key: string]: string | null | undefined;
  タグ名?: string;
  Click?: string;
  CV?: string;
  CVR?: string;
  報酬?: string;
}

// 変換後のデータの型定義
interface FormattedMonkeyClickData {
  tagName: string | null;
  clickData: string | null;
  cvData: string | null;
  cvrData: number | null;
  rewardAmount: number | null;
}

@Injectable()
export class MonkeyClickLogRepository {
  private readonly logger = new Logger(MonkeyClickLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private toFloat(value: string | null | undefined): number | null {
    if (!value) return null;
    try {
      const cleanValue = value.replace(/[%,]/g, "");
      const num = parseFloat(cleanValue);
      return isNaN(num) ? null : num;
    } catch (error) {
      this.logger.warn(`Invalid float format: ${value}`);
      return null;
    }
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

  private formatData(item: RawMonkeyClickData): FormattedMonkeyClickData {
    return {
      tagName: item["タグ名"] || null,
      clickData: item["Click"] || null,
      cvData: item["CV"] || null,
      cvrData: this.toFloat(item["CVR"]),
      rewardAmount: this.toInt(item["報酬"]),
    };
  }

  async save(conversionData: RawMonkeyClickData[]): Promise<number> {
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`Prisma error code: ${error.code}`);
      }
      throw error;
    }
  }
}
