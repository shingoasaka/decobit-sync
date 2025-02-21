import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

// 入力データの型定義
interface RawCatsData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  クリック日時?: string;
  中間クリック日時?: string;
  媒体名?: string;
  "媒体カテゴリ名①"?: string;
  "媒体カテゴリ名②"?: string;
  広告主名?: string;
  広告グループ名?: string;
  成果地点名?: string;
  トラッキングユーザーID?: string;
  売上金額?: string;
  成果報酬額?: string;
  遷移広告URL名?: string;
  ローテーション利用?: string;
  キャリア?: string;
  OS?: string;
  "ユーザーエージェント(クリック)"?: string;
  "ユーザーエージェント(成果)"?: string;
  "IPアドレス(クリック)"?: string;
  "IPアドレス(成果)"?: string;
  "リファラ(クリック)"?: string;
  CL付加情報1?: string;
  CatsReportID?: string;
  中間CL付加情報1?: string;
  成果情報1?: string;
  セッションID?: string;
  ユーザーID?: string;
  中間クリック計測回数?: string;
}

// 変換後のデータの型定義
interface FormattedCatsData {
  actionDate: Date | null;
  clickDate: Date | null;
  midClickDate: Date | null;
  mediaName: string | null;
  mediaCategory1: string | null;
  mediaCategory2: string | null;
  advertiserName: string | null;
  adName: string | null;
  adgroupName: string | null;
  conversionPointName: string | null;
  trackingUserId: string | null;
  salesAmount: number | null;
  rewardAmount: number | null;
  redirectAdUrlName: string | null;
  useRotation: string | null;
  carrier: string | null;
  osType: string | null;
  userAgentClick: string | null;
  userAgentAction: string | null;
  userIpClick: string | null;
  userIpAction: string | null;
  referrerClickUrl: string | null;
  clData1: string | null;
  catsReportId: string | null;
  midClData1: string | null;
  actionInfo1: string | null;
  sessionId: string | null;
  userId: string | null;
  midClickCount: number | null;
}

@Injectable()
export class CatsActionLogRepository {
  private readonly logger = new Logger(CatsActionLogRepository.name);

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
      actionDate: this.toDate(this.getValue(item, "成果日時")),
      clickDate: this.toDate(this.getValue(item, "クリック日時")),
      midClickDate: this.toDate(this.getValue(item, "中間クリック日時")),
      mediaName: this.getValue(item, "媒体名"),
      mediaCategory1: this.getValue(item, "媒体カテゴリ名①"),
      mediaCategory2: this.getValue(item, "媒体カテゴリ名②"),
      advertiserName: this.getValue(item, "広告主名"),
      adName: this.getValue(item, "広告主名"),
      adgroupName: this.getValue(item, "広告グループ名"),
      conversionPointName: this.getValue(item, "成果地点名"),
      trackingUserId: this.getValue(item, "トラッキングユーザーID"),
      salesAmount: this.toInt(this.getValue(item, "売上金額")),
      rewardAmount: this.toInt(this.getValue(item, "成果報酬額")),
      redirectAdUrlName: this.getValue(item, "遷移広告URL名"),
      useRotation: this.getValue(item, "ローテーション利用"),
      carrier: this.getValue(item, "キャリア"),
      osType: this.getValue(item, "OS"),
      userAgentClick: this.getValue(item, "ユーザーエージェント(クリック)"),
      userAgentAction: this.getValue(item, "ユーザーエージェント(成果)"),
      userIpClick: this.getValue(item, "IPアドレス(クリック)"),
      userIpAction: this.getValue(item, "IPアドレス(成果)"),
      referrerClickUrl: this.getValue(item, "リファラ(クリック)"),
      clData1: this.getValue(item, "CL付加情報1"),
      catsReportId: this.getValue(item, "CatsReportID"),
      midClData1: this.getValue(item, "中間CL付加情報1"),
      actionInfo1: this.getValue(item, "成果情報1"),
      sessionId: this.getValue(item, "セッションID"),
      userId: this.getValue(item, "ユーザーID"),
      midClickCount: this.toInt(this.getValue(item, "中間クリック計測回数")),
    };

    return data;
  }

  async save(conversionData: RawCatsData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.catsActionLog.createMany({
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
