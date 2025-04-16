import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";

// 入力データの型定義
interface RawFinebirdData {
  [key: string]: string | null | undefined;
  サイト名?: string;
  総クリック?: string;
}

// 変換後のデータの型定義
interface FormattedFinebirdData {
  siteName: string | null;
  clickData: number | null;
}

@Injectable()
export class FinebirdClickLogRepository {
  private readonly logger = new Logger(FinebirdClickLogRepository.name);

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

  private normalizeKey(key: string): string {
    return key.replace(/^.*?/, "");
  }

  private getValue(item: RawFinebirdData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(item: RawFinebirdData): FormattedFinebirdData {
    const data: FormattedFinebirdData = {
      siteName: this.getValue(item, "サイト名"),
      clickData: this.toInt(this.getValue(item, "総クリック")),
    };
    return data;
  }

  async save(conversionData: RawFinebirdData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.finebirdClickLog.createMany({
        data: formattedData,
        skipDuplicates: true,
      });

      this.logger.log(`Successfully inserted ${result.count} records`);
      return result.count;
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
