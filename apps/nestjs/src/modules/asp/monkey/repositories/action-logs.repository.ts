import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";

// 入力データの型定義
interface RawMonkeyActionData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  成果日時?: string;
  案件名?: string;
  注文番号?: string;
  タグ?: string;
  "成果報酬額(税抜)"?: string;
  リファラ?: string;
  UserAgent?: string;
}

// 変換後のデータの型定義
interface FormattedMonkeyActionData {
  clickDate: Date | null;
  actionDate: Date | null;
  projectName: string | null;
  orderId: number | null;
  tagName: string | null;
  actionRewardAmount: number | null;
  referrerUrl: string | null;
  deviceInfo: string | null;
}

@Injectable()
export class MonkeyActionLogRepository {
  private readonly logger = new Logger(MonkeyActionLogRepository.name);

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

  private normalizeKey(key: string): string {
    return key.replace(/^.*?/, "");
  }

  private getValue(item: RawMonkeyActionData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(item: RawMonkeyActionData): FormattedMonkeyActionData {
    const data: FormattedMonkeyActionData = {
      clickDate: this.toDate(this.getValue(item, "クリック日時")),
      actionDate: this.toDate(this.getValue(item, "成果日時")),
      projectName: this.getValue(item, "案件名"),
      orderId: this.toInt(this.getValue(item, "注文番号")),
      tagName: this.getValue(item, "タグ"),
      actionRewardAmount: this.toInt(this.getValue(item, "成果報酬額(税抜)")),
      referrerUrl: this.getValue(item, "リファラ"),
      deviceInfo: this.getValue(item, "UserAgent"),
    };

    return data;
  }

  async save(conversionData: RawMonkeyActionData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.monkeyActionLog.createMany({
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
