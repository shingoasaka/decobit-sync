import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

// 入力データの型定義
interface RawMonkeyData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  タグ?: string;
  リファラ?: string;
}

// 変換後のデータの型定義
interface FormattedMonkeyData {
  actionDate: Date | null;
  tagName: string | null;
  referrerUrl: string | null;
}

@Injectable()
export class MonkeyActionLogRepository {
  private readonly logger = new Logger(MonkeyActionLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private toDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      this.logger.warn(`Invalid date format: ${dateStr}`);
      return null;
    }
  }

  private normalizeKey(key: string): string {
    return key.replace(/^.*?/, "");
  }

  private getValue(item: RawMonkeyData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(item: RawMonkeyData): FormattedMonkeyData {
    return {
      actionDate: this.toDate(this.getValue(item, "成果日時")),
      tagName: this.getValue(item, "タグ"),
      referrerUrl: this.getValue(item, "リファラ"),
    };
  }

  async save(conversionData: RawMonkeyData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.monkeyActionLog.createMany({
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
