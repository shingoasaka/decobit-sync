import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";

// 入力データの型定義
interface RawSampleAffiliateData {
  [key: string]: string | null | undefined;
  メディア?: string;
  発生日時?: string;
}
// 変換後のデータの型定義
interface FormattedSampleAffiliateActionLog {
  mediaName: string | null;
  actionDate: Date | null;
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
    const data: FormattedSampleAffiliateActionLog = {
      mediaName: this.getValue(item, "メディア"),
      actionDate: this.toDate(this.getValue(item, "発生日時")),
    };
    return data;
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
