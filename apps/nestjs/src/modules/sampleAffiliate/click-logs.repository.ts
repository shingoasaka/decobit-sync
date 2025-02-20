import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

// 入力データの型定義
interface RawSampleAffiliateClickData {
  [key: string]: string | null | undefined;
  メディア?: string;
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
interface FormattedSampleAffiliateClickData {
  mediaName: string | null;
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
