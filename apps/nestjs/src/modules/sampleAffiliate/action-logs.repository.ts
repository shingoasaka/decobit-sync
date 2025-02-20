import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

// 入力データの型定義
interface RawSampleAffiliateData {
  [key: string]: string | null | undefined;
  広告?: string;
  "imp数[imp]"?: string;
  "アクセス数[件]"?: string;
  "CTR[％]"?: string;
  "発生成果数[件]"?: string;
  "発生成果額[円]"?: string;
  "確定成果数[件]"?: string;
  "確定成果額[円]"?: string;
  "CVR[％]"?: string;
  "報酬合計[円]"?: string;
}

// 変換後のデータの型定義
interface FormattedSampleAffiliateData {
  adName: string | null;
  impCount: number | null;
  accessCount: number | null;
  ctr: number | null;
  actionCount: number | null;
  actionAmount: number | null;
  confirmedActionCount: number | null;
  confirmedActionAmount: number | null;
  cvr: number | null;
  rewardAmount: number | null;
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

  private toFloat(value: string | null | undefined): number | null {
    if (!value) return null;
    try {
      const cleanValue = value.replace(/[%,¥]/g, "");
      const num = parseFloat(cleanValue);
      return isNaN(num) ? null : num;
    } catch (error) {
      this.logger.warn(`Invalid float format: ${value}`);
      return null;
    }
  }

  private normalizeKey(key: string): string {
    return key.replace(/^.*?/, "");
  }

  private getValue(item: RawSampleAffiliateData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(
    item: RawSampleAffiliateData,
  ): FormattedSampleAffiliateData {
    const data: FormattedSampleAffiliateData = {
      adName: this.getValue(item, "広告"),
      impCount: this.toInt(this.getValue(item, "imp数[imp]")),
      accessCount: this.toInt(this.getValue(item, "アクセス数[件]")),
      ctr: this.toFloat(this.getValue(item, "CTR[％]")),
      actionCount: this.toInt(this.getValue(item, "発生成果数[件]")),
      actionAmount: this.toInt(this.getValue(item, "発生成果額[円]")),
      confirmedActionCount: this.toInt(this.getValue(item, "確定成果数[件]")),
      confirmedActionAmount: this.toInt(this.getValue(item, "確定成果額[円]")),
      cvr: this.toFloat(this.getValue(item, "CVR[％]")),
      rewardAmount: this.toInt(this.getValue(item, "報酬合計[円]")),
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
