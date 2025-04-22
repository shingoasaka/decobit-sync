import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";

// 入力データの型定義
interface RawAdebisData {
  [key: string]: string | null | undefined;
  CV名?: string;
  CV時間?: string;
  ユーザーID?: string;
  ユーザー名?: string;
  売上金額?: string;
  項目1?: string;
  項目2?: string;
  項目3?: string;
  デバイス?: string;
  潜伏期間?: string;
  "潜伏期間（秒）"?: string;
  "直接効果(発生日時)"?: string;
  "直接効果(媒体種別)"?: string;
  "直接効果(広告グループ1)"?: string;
  "直接効果(広告名)"?: string;
  "直接効果(媒体広告ID)"?: string;
  "間接効果2(発生日時)"?: string;
  "間接効果2(媒体種別)"?: string;
  "間接効果2(広告グループ1)"?: string;
  "間接効果2(広告名)"?: string;
  "間接効果2(媒体広告ID)"?: string;
  "間接効果3(発生日時)"?: string;
  "間接効果3(媒体種別)"?: string;
  "間接効果3(広告グループ1)"?: string;
  "間接効果3(広告名)"?: string;
  "間接効果3(媒体広告ID)"?: string;
  "間接効果4(発生日時)"?: string;
  "間接効果4(媒体種別)"?: string;
  "間接効果4(広告グループ1)"?: string;
  "間接効果4(広告名)"?: string;
  "間接効果4(媒体広告ID)"?: string;
  "間接効果5(発生日時)"?: string;
  "間接効果5(媒体種別)"?: string;
  "間接効果5(広告グループ1)"?: string;
  "間接効果5(広告名)"?: string;
  "間接効果5(媒体広告ID)"?: string;
  "間接効果6(発生日時)"?: string;
  "間接効果6(媒体種別)"?: string;
  "間接効果6(広告グループ1)"?: string;
  "間接効果6(広告名)"?: string;
  "間接効果6(媒体広告ID)"?: string;
  "間接効果7(発生日時)"?: string;
  "間接効果7(媒体種別)"?: string;
  "間接効果7(広告グループ1)"?: string;
  "間接効果7(広告名)"?: string;
  "間接効果7(媒体広告ID)"?: string;
  "間接効果8(発生日時)"?: string;
  "間接効果8(媒体種別)"?: string;
  "間接効果8(広告グループ1)"?: string;
  "間接効果8(広告名)"?: string;
  "間接効果8(媒体広告ID)"?: string;
  "間接効果9(発生日時)"?: string;
  "間接効果9(媒体種別)"?: string;
  "間接効果9(広告グループ1)"?: string;
  "間接効果9(広告名)"?: string;
  "間接効果9(媒体広告ID)"?: string;
  "間接効果10(発生日時)"?: string;
  "間接効果10(媒体種別)"?: string;
  "間接効果10(広告グループ1)"?: string;
  "間接効果10(広告名)"?: string;
  "間接効果10(媒体広告ID)"?: string;
  "初回接触(発生日時)"?: string;
  "初回接触(媒体種別)"?: string;
  "初回接触(広告グループ1)"?: string;
  "初回接触(広告名)"?: string;
  "初回接触(媒体広告ID)"?: string;
}

// 変換後のデータの型定義
interface FormattedAdebisData {
  cvName: string | null;
  cvDate: Date | null;
  userId: string | null;
  userName: string | null;
  salesAmount: string | null;
  item1: string | null;
  item2: number | null;
  item3: string | null;
  deviceType: string | null;
  latencyPeriod: Date | null;
  latencyPeriodSeconds: number | null;
  contactCount: number | null;
  directConversionDate: Date | null;
  directMediaCategory: string | null;
  directAdgroup: string | null;
  directAdName: string | null;
  directAdId: number | null;
  indirectConversion2Date: Date | null;
  indirectMediaCategory2: string | null;
  indirectAdgroup2: string | null;
  indirectAdName2: string | null;
  indirectAdId2: string | null;
  indirectConversion3Date: Date | null;
  indirectMediaCategory3: string | null;
  indirectAdgroup3: string | null;
  indirectAdName3: string | null;
  indirectAdId3: string | null;
  indirectConversion4Date: Date | null;
  indirectMediaCategory4: string | null;
  indirectAdgroup4: string | null;
  indirectAdName4: string | null;
  indirectAdId4: string | null;
  indirectConversion5Date: Date | null;
  indirectMediaCategory5: string | null;
  indirectAdgroup5: string | null;
  indirectAdName5: string | null;
  indirectAdId5: string | null;
  indirectConversion6Date: Date | null;
  indirectMediaCategory6: string | null;
  indirectAdgroup6: string | null;
  indirectAdName6: string | null;
  indirectAdId6: string | null;
  indirectConversion7Date: Date | null;
  indirectMediaCategory7: string | null;
  indirectAdgroup7: string | null;
  indirectAdName7: string | null;
  indirectAdId7: string | null;
  indirectConversion8Date: Date | null;
  indirectMediaCategory8: string | null;
  indirectAdgroup8: string | null;
  indirectAdName8: string | null;
  indirectAdId8: string | null;
  indirectConversion9Date: Date | null;
  indirectMediaCategory9: string | null;
  indirectAdgroup9: string | null;
  indirectAdName9: string | null;
  indirectAdId9: string | null;
  indirectConversion10Date: Date | null;
  indirectMediaCategory10: string | null;
  indirectAdgroup10: string | null;
  indirectAdName10: string | null;
  indirectAdId10: string | null;
  firstConversionDate: Date | null;
  firstMediaType: string | null;
  firstAdName: string | null;
  firstAdId: string | null;
}

@Injectable()
export class AdebisActionLogRepository {
  private readonly logger = new Logger(AdebisActionLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private toDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;

    // 日付形式を正規化する処理を追加
    const normalizedDateStr = dateStr
      .replace(/日|時間|分|秒/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    try {
      const date = new Date(normalizedDateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      this.logger.warn(`Invalid date format: ${normalizedDateStr}`);
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

  private getValue(item: RawAdebisData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(item: RawAdebisData): FormattedAdebisData {
    const data: FormattedAdebisData = {
      cvName: this.getValue(item, "CV名"),
      cvDate: this.toDate(this.getValue(item, "CV時間")),
      userId: this.getValue(item, "ユーザーID"),
      userName: this.getValue(item, "ユーザー名"),
      salesAmount: this.getValue(item, "売上金額"),
      item1: this.getValue(item, "項目1"),
      item2: this.toInt(this.getValue(item, "項目2")),
      item3: this.getValue(item, "項目3"),
      deviceType: this.getValue(item, "デバイス"),
      latencyPeriod: this.toDate(this.getValue(item, "潜伏期間")),
      latencyPeriodSeconds: this.toInt(this.getValue(item, "潜伏期間（秒）")),
      contactCount: this.toInt(this.getValue(item, "初回接触(発生日時)")),
      directConversionDate: this.toDate(
        this.getValue(item, "直接効果(発生日時)"),
      ),
      directMediaCategory: this.getValue(item, "直接効果(媒体種別)"),
      directAdgroup: this.getValue(item, "直接効果(広告グループ1)"),
      directAdName: this.getValue(item, "直接効果(広告名)"),
      directAdId: this.toInt(this.getValue(item, "直接効果(媒体広告ID)")),
      indirectConversion2Date: this.toDate(
        this.getValue(item, "間接効果2(発生日時)"),
      ),
      indirectMediaCategory2: this.getValue(item, "間接効果2(媒体種別)"),
      indirectAdgroup2: this.getValue(item, "間接効果2(広告グループ1)"),
      indirectAdName2: this.getValue(item, "間接効果2(広告名)"),
      indirectAdId2: this.getValue(item, "間接効果2(媒体広告ID)"),
      indirectConversion3Date: this.toDate(
        this.getValue(item, "間接効果3(発生日時)"),
      ),
      indirectMediaCategory3: this.getValue(item, "間接効果3(媒体種別)"),
      indirectAdgroup3: this.getValue(item, "間接効果3(広告グループ1)"),
      indirectAdName3: this.getValue(item, "間接効果3(広告名)"),
      indirectAdId3: this.getValue(item, "間接効果3(媒体広告ID)"),
      indirectConversion4Date: this.toDate(
        this.getValue(item, "間接効果4(発生日時)"),
      ),
      indirectMediaCategory4: this.getValue(item, "間接効果4(媒体種別)"),
      indirectAdgroup4: this.getValue(item, "間接効果4(広告グループ1)"),
      indirectAdName4: this.getValue(item, "間接効果4(広告名)"),
      indirectAdId4: this.getValue(item, "間接効果4(媒体広告ID)"),
      indirectConversion5Date: this.toDate(
        this.getValue(item, "間接効果5(発生日時)"),
      ),
      indirectMediaCategory5: this.getValue(item, "間接効果5(媒体種別)"),
      indirectAdgroup5: this.getValue(item, "間接効果5(広告グループ1)"),
      indirectAdName5: this.getValue(item, "間接効果5(広告名)"),
      indirectAdId5: this.getValue(item, "間接効果5(媒体広告ID)"),
      indirectConversion6Date: this.toDate(
        this.getValue(item, "間接効果6(発生日時)"),
      ),
      indirectMediaCategory6: this.getValue(item, "間接効果6(媒体種別)"),
      indirectAdgroup6: this.getValue(item, "間接効果6(広告グループ1)"),
      indirectAdName6: this.getValue(item, "間接効果6(広告名)"),
      indirectAdId6: this.getValue(item, "間接効果6(媒体広告ID)"),
      indirectConversion7Date: this.toDate(
        this.getValue(item, "間接効果7(発生日時)"),
      ),
      indirectMediaCategory7: this.getValue(item, "間接効果7(媒体種別)"),
      indirectAdgroup7: this.getValue(item, "間接効果7(広告グループ1)"),
      indirectAdName7: this.getValue(item, "間接効果7(広告名)"),
      indirectAdId7: this.getValue(item, "間接効果7(媒体広告ID)"),
      indirectConversion8Date: this.toDate(
        this.getValue(item, "間接効果8(発生日時)"),
      ),
      indirectMediaCategory8: this.getValue(item, "間接効果8(媒体種別)"),
      indirectAdgroup8: this.getValue(item, "間接効果8(広告グループ1)"),
      indirectAdName8: this.getValue(item, "間接効果8(広告名)"),
      indirectAdId8: this.getValue(item, "間接効果8(媒体広告ID)"),
      indirectConversion9Date: this.toDate(
        this.getValue(item, "間接効果9(発生日時)"),
      ),
      indirectMediaCategory9: this.getValue(item, "間接効果9(媒体種別)"),
      indirectAdgroup9: this.getValue(item, "間接効果9(広告グループ1)"),
      indirectAdName9: this.getValue(item, "間接効果9(広告名)"),
      indirectAdId9: this.getValue(item, "間接効果9(媒体広告ID)"),
      indirectConversion10Date: this.toDate(
        this.getValue(item, "間接効果10(発生日時)"),
      ),
      indirectMediaCategory10: this.getValue(item, "間接効果10(媒体種別)"),
      indirectAdgroup10: this.getValue(item, "間接効果10(広告グループ1)"),
      indirectAdName10: this.getValue(item, "間接効果10(広告名)"),
      indirectAdId10: this.getValue(item, "間接効果10(媒体広告ID)"),
      firstConversionDate: this.toDate(
        this.getValue(item, "初回接触(発生日時)"),
      ),
      firstMediaType: this.getValue(item, "初回接触(媒体種別)"),
      firstAdName: this.getValue(item, "初回接触(広告名)"),
      firstAdId: this.getValue(item, "初回接触(媒体広告ID)"),
    };

    return data;
  }

  async save(conversionData: RawAdebisData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));
      let successCount = 0;

      // トランザクション内で並列処理を実行
      await this.prisma.$transaction(
        async (prisma: Prisma.TransactionClient) => {
          const upsertPromises = formattedData
            .filter((data) => data.cvDate && data.userId)
            .map((data) =>
              prisma.adebisActionLog.upsert({
                where: {
                  cvDate_userId: {
                    cvDate: data.cvDate as Date,
                    userId: data.userId as string,
                  },
                },
                create: {
                  ...data,
                },
                update: {
                  ...data,
                },
              }),
            );

          // 無効なデータのログ出力
          formattedData
            .filter((data) => !data.cvDate || !data.userId)
            .forEach((data) => {
              this.logger.warn(
                `Skipped record due to missing cvDate or userId: ${JSON.stringify(
                  {
                    cvDate: data.cvDate,
                    userId: data.userId,
                  },
                )}`,
              );
            });

          // 並列でupsert操作を実行
          const results = await Promise.all(upsertPromises);
          successCount = results.length;
        },
      );

      this.logger.log(`Successfully processed ${successCount} records`);
      return successCount;
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
