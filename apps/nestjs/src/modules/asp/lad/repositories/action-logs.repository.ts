import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface LadRawData {
  成果日時?: string;
  クリック日時?: string;
  中間クリック日時?: string;
  媒体名?: string;
  "媒体カテゴリ名①"?: string;
  "媒体カテゴリ名②"?: string;
  広告主名?: string;
  広告名?: string;
  広告グループ名?: string;
  成果地点名?: string;
  トラッキングユーザーID?: string;
  売上金額?: string;
  成果報酬?: string;
  遷移広告URL名?: string;
  ローテーション利用?: string;
  キャリア?: string;
  OS?: string;
  "ユーザーエージェント(クリック)"?: string;
  "ユーザーエージェント(成果)"?: string;
  "IPアドレス(クリック)"?: string;
  "IPアドレス(成果)"?: string;
  "リファラ(クリック)"?: string;
  "LINE 公式アカウント名"?: string;
  "LINE ユーザーID"?: string;
  "LINE ユーザー名"?: string;
  CL付加情報1?: string;
  "CatsReport ID"?: string;
  中間CL付加情報1?: string;
  成果情報1?: string;
  セッションID?: string;
  ユーザーID?: string;
  中間クリック計測回数?: string;
}

interface LadFormattedData {
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
  lineName: string | null;
  lineUserId: string | null;
  lineUserName: string | null;
  clData1: string | null;
  catsReportId: string | null;
  midClData1: string | null;
  actionInfo1: string | null;
  sessionId: string | null;
  userId: string | null;
  midClickCount: number | null;
  createdDate?: Date;
  updatedDate?: Date;
}

@Injectable()
export class LadActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: LadRawData): LadFormattedData {
    return {
      actionDate: toValidDate(item["成果日時"]),
      clickDate: toValidDate(item["クリック日時"]),
      midClickDate: toValidDate(item["中間クリック日時"]),
      mediaName: item["媒体名"] || null,
      mediaCategory1: item["媒体カテゴリ名①"] || null,
      mediaCategory2: item["媒体カテゴリ名②"] || null,
      advertiserName: item["広告主名"] || null,
      adName: item["広告名"] || null,
      adgroupName: item["広告グループ名"] || null,
      conversionPointName: item["成果地点名"] || null,
      trackingUserId: item["トラッキングユーザーID"] || null,
      salesAmount: toValidNumber(item["売上金額"]),
      rewardAmount: toValidNumber(item["成果報酬"]),
      redirectAdUrlName: item["遷移広告URL名"] || null,
      useRotation: item["ローテーション利用"] || null,
      carrier: item["キャリア"] || null,
      osType: item["OS"] || null,
      userAgentClick: item["ユーザーエージェント(クリック)"] || null,
      userAgentAction: item["ユーザーエージェント(成果)"] || null,
      userIpClick: item["IPアドレス(クリック)"] || null,
      userIpAction: item["IPアドレス(成果)"] || null,
      referrerClickUrl: item["リファラ(クリック)"] || null,
      lineName: item["LINE 公式アカウント名"] || null,
      lineUserId: item["LINE ユーザーID"] || null,
      lineUserName: item["LINE ユーザー名"] || null,
      clData1: item["CL付加情報1"] || null,
      catsReportId: item["CatsReport ID"] || null,
      midClData1: item["中間CL付加情報1"] || null,
      actionInfo1: item["成果情報1"] || null,
      sessionId: item["セッションID"] || null,
      userId: item["ユーザーID"] || null,
      midClickCount: toValidNumber(item["中間クリック計測回数"]),
      createdDate: new Date(),
      updatedDate: new Date(),
    };
  }

  async save(logs: LadRawData[]): Promise<void> {
    for (const item of logs) {
      const formatted = this.formatData(item);
      await this.prisma.ladActionLog.create({
        data: formatted,
      });
    }
  }
}

function toValidDate(value?: string): Date | null {
  if (!value || value === "0000-00-00 00:00:00") return null;
  const isoLike = value.replace(" ", "T");
  const date = new Date(isoLike);
  return isNaN(date.getTime()) ? null : date;
}

function toValidNumber(value?: string): number | null {
  if (!value) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}
