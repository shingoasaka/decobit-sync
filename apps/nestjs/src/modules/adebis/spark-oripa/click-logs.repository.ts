import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

// 入力データの型定義
interface RawSparkOripaData {
  [key: string]: string | null | undefined;
  媒体種別?: string;
  広告グループ1?: string;
  広告グループ2?: string;
  広告ID?: string;
  広告名?: string;
  表示回数?: string;
  クリック数?: string;
  CTR?: string;
  "入金完了（CV）"?: string;
  "入金完了（CVR）"?: string;
  "CV（合計）"?: string;
  "CVR（合計）"?: string;
  間接効果2?: string;
  間接効果3?: string;
  間接効果4?: string;
  間接効果5?: string;
  "間接効果6 - 10"?: string;
  "間接効果（合計）"?: string;
  初回接触?: string;
  再配分CV?: string;
  売上総額?: string;
  広告コスト?: string;
  CPA?: string;
  TCPA?: string;
  ROAS?: string;
}

// 変換後のデータの型定義
interface FormattedSparkOripaData {
  mediaType: string | null;
  adgroup1: string | null;
  adgroup2: string | null;
  adId: string | null;
  adName: string | null;
  impressionCount: number | null;
  clickData: number | null;
  cvPaymentCount: number | null;
  cvrPaymentCount: number | null;
  cvTotal: number | null;
  cvrTotal: number | null;
  indirectConversion2: number | null;
  indirectConversion3: number | null;
  indirectConversion4: number | null;
  indirectConversion5: number | null;
  indirectConversion6: number | null;
  indirectConversionTotal: number | null;
  firstContact: number | null;
  reallocatedCv: number | null;
  salesAmount: string | null;
  adCost: string | null;
  cpa: string | null;
  tcpa: string | null;
  roas: number | null;
}

@Injectable()
export class SparkOripaClickLogRepository {
  private readonly logger = new Logger(SparkOripaClickLogRepository.name);

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

  private getValue(item: RawSparkOripaData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(item: RawSparkOripaData): FormattedSparkOripaData {
    const data: FormattedSparkOripaData = {
      mediaType: this.getValue(item, "媒体種別"),
      adgroup1: this.getValue(item, "広告グループ1"),
      adgroup2: this.getValue(item, "広告グループ2"),
      adId: this.getValue(item, "広告ID"),
      adName: this.getValue(item, "広告名"),
      impressionCount: this.toInt(this.getValue(item, "表示回数")),
      clickData: this.toInt(this.getValue(item, "クリック数")),
      cvPaymentCount: this.toInt(this.getValue(item, "入金完了（CV）")),
      cvrPaymentCount: this.toInt(this.getValue(item, "入金完了（CVR）")),
      cvTotal: this.toInt(this.getValue(item, "CV（合計）")),
      cvrTotal: this.toInt(this.getValue(item, "CVR（合計）")),
      indirectConversion2: this.toInt(this.getValue(item, "間接効果2")),
      indirectConversion3: this.toInt(this.getValue(item, "間接効果3")),
      indirectConversion4: this.toInt(this.getValue(item, "間接効果4")),
      indirectConversion5: this.toInt(this.getValue(item, "間接効果5")),
      indirectConversion6: this.toInt(this.getValue(item, "間接効果6 - 10")),
      indirectConversionTotal: this.toInt(
        this.getValue(item, "間接効果（合計）"),
      ),
      firstContact: this.toInt(this.getValue(item, "初回接触")),
      reallocatedCv: this.toInt(this.getValue(item, "再配分CV")),
      salesAmount: this.getValue(item, "売上総額"),
      adCost: this.getValue(item, "広告コスト"),
      cpa: this.getValue(item, "CPA"),
      tcpa: this.getValue(item, "TCPA"),
      roas: this.toInt(this.getValue(item, "ROAS")),
    };

    return data;
  }

  async save(conversionData: RawSparkOripaData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));
      let successCount = 0;

      // トランザクション内で一括処理を実行
      await this.prisma.$transaction(async (prisma) => {
        for (const data of formattedData) {
          // 必要なユニーク制約のフィールドが存在する場合のみupsertを実行
          if (data.adId && data.mediaType && data.adgroup1) {
            await prisma.adebisClickLog.upsert({
              where: {
                adId_mediaType_adgroup1: {
                  adId: data.adId,
                  mediaType: data.mediaType,
                  adgroup1: data.adgroup1,
                },
              },
              create: {
                ...data,
              },
              update: {
                ...data,
              },
            });
            successCount++;
          } else {
            // ユニーク制約に必要なデータが不足している場合はスキップ
            this.logger.warn(
              `Skipped record due to missing required fields: ${JSON.stringify({
                adId: data.adId,
                mediaType: data.mediaType,
                adgroup1: data.adgroup1,
              })}`,
            );
          }
        }
      });

      this.logger.log(`Successfully processed ${successCount} records`);
      return successCount;
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
