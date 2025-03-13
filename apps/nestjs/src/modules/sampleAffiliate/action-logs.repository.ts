import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";

// 入力データの型定義
interface RawSampleAffiliateData {
  [key: string]: string | null | undefined;
  成果ID?: string;
  メディア?: string;
  広告?: string;
  広告素材?: string;
  成果内容?: string;
  "成果報酬額[円]"?: string;
  承認状態?: string;
  リファラ?: string;
  広告クリック日時?: string;
  発生日時?: string;
  確定日時?: string;
}

// 変換後のデータの型定義
interface FormattedSampleAffiliateActionLog {
  id?: number;
  actionId: string | null;
  mediaName: string | null;
  adName: string | null;
  adMaterial: string | null;
  actionDetails: string;
  actionAmount: number | null;
  approvalStatus: string | null;
  referrerUrl: string | null;
  clickDate: Date | null;
  actionDate: Date | null;
  confirmedDate: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
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

  private getValue(item: RawSampleAffiliateData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(
    item: RawSampleAffiliateData,
  ): FormattedSampleAffiliateActionLog {
    const data: FormattedSampleAffiliateActionLog = {
      actionId: this.getValue(item, "成果ID"),
      mediaName: this.getValue(item, "メディア"),
      adName: this.getValue(item, "広告"),
      adMaterial: this.getValue(item, "広告素材"),
      actionDetails: this.getValue(item, "成果内容") ?? "", 
      actionAmount: this.toInt(this.getValue(item, "成果報酬額[円]")),
      approvalStatus: this.getValue(item, "承認状態"),
      referrerUrl: this.getValue(item, "リファラ"),
      clickDate: this.toDate(this.getValue(item, "広告クリック日時")),
      actionDate: this.toDate(this.getValue(item, "発生日時")),
      confirmedDate: this.toDate(this.getValue(item, "確定日時")),
      createdAt: new Date(),
      updatedAt: new Date(),
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