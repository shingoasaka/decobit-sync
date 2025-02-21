import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

// 入力データの型定義
interface RawFinebirdData {
  [key: string]: string | null | undefined;
  承認日時?: string;
  クリック日時?: string;
  注文日時?: string;
  広告ID?: string;
  広告名?: string;
  サイト名?: string;
  URL名?: string;
  "URL No"?: string;
  OS?: string;
  リファラ?: string;
  報酬額?: string;
  ステータス?: string;
  CL付加情報1?: string;
  CL付加情報2?: string;
  CL付加情報3?: string;
  CL付加情報4?: string;
  CL付加情報5?: string;
}

// 変換後のデータの型定義
interface FormattedFinebirdData {
  approvalDate: Date | null;
  clickDate: Date | null;
  orderDate: Date | null;
  adId: number | null;
  adName: string | null;
  siteName: string | null;
  urlName: string | null;
  urlNumber: number | null;
  osType: string | null;
  referrer: string | null;
  rewardAmount: number | null;
  status: string | null;
  clData1: string | null;
  clData2: string | null;
  clData3: string | null;
  clData4: string | null;
  clData5: string | null;
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
      approvalDate: this.toDate(this.getValue(item, "承認日時")),
      clickDate: this.toDate(this.getValue(item, "クリック日時")),
      orderDate: this.toDate(this.getValue(item, "注文日時")),
      adId: this.toInt(this.getValue(item, "広告ID")),
      adName: this.getValue(item, "広告名"),
      siteName: this.getValue(item, "サイト名"),
      urlName: this.getValue(item, "URL名"),
      urlNumber: this.toInt(this.getValue(item, "URL No")),
      osType: this.getValue(item, "OS"),
      referrer: this.getValue(item, "リファラ"),
      rewardAmount: this.toInt(this.getValue(item, "報酬額")),
      status: this.getValue(item, "ステータス"),
      clData1: this.getValue(item, "CL付加情報1"),
      clData2: this.getValue(item, "CL付加情報2"),
      clData3: this.getValue(item, "CL付加情報3"),
      clData4: this.getValue(item, "CL付加情報4"),
      clData5: this.getValue(item, "CL付加情報5"),
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
