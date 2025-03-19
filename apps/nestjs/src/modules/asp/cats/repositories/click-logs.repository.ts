import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

// 入力データの型定義
interface RawCatsData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  媒体名?: string;
  "媒体カテゴリ名①"?: string;
  "媒体カテゴリ名②"?: string;
  広告主名?: string;
  広告名?: string;
  広告グループ名?: string;
  遷移広告URL名?: string;
  ローテーション利用?: string;
  キャリア?: string;
  OS?: string;
  ユーザーエージェント?: string;
  IPアドレス?: string;
  リファラ?: string;
  CL付加情報1?: string;
  FacebookCLID?: string;
  TikTokCLID?: string;
  CatsReportID?: string;
  セッションID?: string;
  ユーザーID?: string;
  トラッキングユーザーID?: string;
  ステータス?: string;
}

// 変換後のデータの型定義
interface FormattedCatsData {
  clickDate: Date | null;
  mediaName: string | null;
  mediaCategory1: string | null;
  mediaCategory2: string | null;
  advertiserName: string | null;
  adName: string | null;
  adgroupName: string | null;
  redirectAdUrlName: string | null;
  useRotation: string | null;
  carrier: string | null;
  osType: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  referrer: string | null;
  clData1: string | null;
  facebookClId: string | null;
  tiktokClId: string | null;
  catsReportId: string | null;
  sessionId: string | null;
  userId: string | null;
  trackingUserId: string | null;
  status: string | null;
}

@Injectable()
export class CatsClickLogRepository {
  processCsvAndSave(downloadPath: string): number | PromiseLike<number> {
    throw new Error("Method not implemented.");
  }
  private readonly logger = new Logger(CatsClickLogRepository.name);

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

  private getValue(item: RawCatsData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(item: RawCatsData): FormattedCatsData {
    const data: FormattedCatsData = {
      clickDate: this.toDate(this.getValue(item, "クリック日時")),
      mediaName: this.getValue(item, "媒体名"),
      mediaCategory1: this.getValue(item, "媒体カテゴリ名①"),
      mediaCategory2: this.getValue(item, "媒体カテゴリ名②"),
      advertiserName: this.getValue(item, "広告主名"),
      adName: this.getValue(item, "広告名"),
      adgroupName: this.getValue(item, "広告グループ名"),
      redirectAdUrlName: this.getValue(item, "遷移広告URL名"),
      useRotation: this.getValue(item, "ローテーション利用"),
      carrier: this.getValue(item, "キャリア"),
      osType: this.getValue(item, "OS"),
      userAgent: this.getValue(item, "ユーザーエージェント"),
      ipAddress: this.getValue(item, "IPアドレス"),
      referrer: this.getValue(item, "リファラ"),
      clData1: this.getValue(item, "CL付加情報1"),
      facebookClId: this.getValue(item, "Facebook CLID"),
      tiktokClId: this.getValue(item, "TikTok CLID"),
      catsReportId: this.getValue(item, "CatsReport ID"),
      sessionId: this.getValue(item, "セッションID"),
      userId: this.getValue(item, "ユーザーID"),
      trackingUserId: this.getValue(item, "トラッキングユーザーID"),
      status: this.getValue(item, "ステータス"),
    };

    return data;
  }

  async save(conversionData: RawCatsData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.catsClickLog.createMany({
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
