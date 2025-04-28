import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";

// 入力データの型定義
interface RawFinebirdData {
  [key: string]: string | null | undefined;
  注文日時?: string;
  サイト名?: string;
  リファラ?: string;
}

// 変換後のデータの型定義
interface FormattedFinebirdData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  referrerUrl: string | null;
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
    return {
      actionDateTime: this.toDate(this.getValue(item, "注文日時")),
      affiliateLinkName: this.getValue(item, "サイト名"),
      referrerUrl: this.getValue(item, "リファラ"),
    };
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
