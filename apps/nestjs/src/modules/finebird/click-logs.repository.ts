import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

// 入力データの型定義
interface RawFinebirdData {
  [key: string]: string | null | undefined;
  サイト名?: string;
  サイトURL?: string;
  広告名?: string;
  広告ID?: string;
  URL名?: string;
  総クリック?: string;
  獲得CVR?: string;
  承認CVR?: string;
  獲得件数?: string;
  承認件数?: string;
  否認件数?: string;
  報酬金額?: string;
  クリック単価?: string;
  クリック報酬金額?: string;
  報酬金額合計?: string;
}

// 変換後のデータの型定義
interface FormattedFinebirdData {
  siteName: string | null;
  siteUrl: string | null;
  adName: string | null;
  adId: number | null;
  clickData: number | null;
  actionCvr: number | null;
  approvalCvr: number | null;
  acquisitionCount: number | null;
  approvalCount: number | null;
  rejectedCount: number | null;
  rewardAmount: number | null;
  clickCost: number | null;
  clickRewardAmount: number | null;
  totalRewardAmount: number | null;
}

@Injectable()
export class FinebirdClickLogRepository {
  private readonly logger = new Logger(FinebirdClickLogRepository.name);

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

  private getValue(item: RawFinebirdData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(item: RawFinebirdData): FormattedFinebirdData {
    const data: FormattedFinebirdData = {
      siteName: this.getValue(item, "サイト名"),
      siteUrl: this.getValue(item, "サイトURL"),
      adName: this.getValue(item, "広告名"),
      adId: this.toInt(this.getValue(item, "広告ID")),
      clickData: this.toInt(this.getValue(item, "総クリック")),
      actionCvr: this.toFloat(this.getValue(item, "獲得CVR")),
      approvalCvr: this.toFloat(this.getValue(item, "承認CVR")),
      acquisitionCount: this.toInt(this.getValue(item, "獲得件数")),
      approvalCount: this.toInt(this.getValue(item, "承認件数")),
      rejectedCount: this.toInt(this.getValue(item, "否認件数")),
      rewardAmount: this.toInt(this.getValue(item, "報酬金額")),
      clickCost: this.toInt(this.getValue(item, "クリック単価")),
      clickRewardAmount: this.toInt(this.getValue(item, "クリック報酬金額")),
      totalRewardAmount: this.toInt(this.getValue(item, "報酬金額合計")),
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
