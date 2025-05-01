import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";
import { getNowJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawSampleAffiliateData {
  [key: string]: string | null | undefined;
  メディア?: string;
  発生日時?: string;
}
// 変換後のデータの型定義
interface FormattedSampleAffiliateActionLog {
  affiliateLinkName: string | null;
  actionDateTime: Date | null;
  createdAt:Date | null;
  updatedAt:Date | null;
}

@Injectable()
export class SampleAffiliateActionLogRepository {
  private readonly logger = new Logger(SampleAffiliateActionLogRepository.name);

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

  private getValue(item: RawSampleAffiliateData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(
    item: RawSampleAffiliateData,
  ): FormattedSampleAffiliateActionLog {
    const now = getNowJst();
    return {
      affiliateLinkName: this.getValue(item, "メディア"),
      actionDateTime: this.toDate(this.getValue(item, "発生日時")),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawSampleAffiliateData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.sampleAffiliateActionLog.createMany({
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
