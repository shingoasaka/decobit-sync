import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";

// 入力データの型定義
interface RawSampleAffiliateClickData {
  [key: string]: string | null | undefined;
  メディア?: string;
  "アクセス数[件]"?: string;
}

// 変換後のデータの型定義
interface FormattedSampleAffiliateClickData {
  mediaName: string | null;
  accessCount: number | null;
}

@Injectable()
export class SampleAffiliateClickLogRepository {
  private readonly logger = new Logger(SampleAffiliateClickLogRepository.name);

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

  private getValue(
    item: RawSampleAffiliateClickData,
    key: string,
  ): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(
    item: RawSampleAffiliateClickData,
  ): FormattedSampleAffiliateClickData {
    const data: FormattedSampleAffiliateClickData = {
      mediaName: this.getValue(item, "メディア"),
      accessCount: this.toInt(this.getValue(item, "アクセス数[件]")),
    };

    return data;
  }

  async save(clickData: RawSampleAffiliateClickData[]): Promise<number> {
    try {
      const formattedData = clickData.map((item) => this.formatData(item));

      const result = await this.prisma.sampleAffiliateClickLog.createMany({
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
