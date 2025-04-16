import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";

// 入力データの型定義
interface RawFinebirdData {
  [key: string]: string | null | undefined;
  注文日時?: string;
  サイト名?: string;
  リファラ?: string;
}

// 変換後のデータの型定義
interface FormattedFinebirdData {
  orderDate: Date | null;
  siteName: string | null;
  referrer: string | null;
}

@Injectable()
export class FinebirdActionLogRepository {
  private readonly logger = new Logger(FinebirdActionLogRepository.name);

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

  private getValue(item: RawFinebirdData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(item: RawFinebirdData): FormattedFinebirdData {
    const data: FormattedFinebirdData = {
      orderDate: this.toDate(this.getValue(item, "注文日時")),
      siteName: this.getValue(item, "サイト名"),
      referrer: this.getValue(item, "リファラ"),
    };

    return data;
  }

  async save(conversionData: RawFinebirdData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.finebirdActionLog.createMany({
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
