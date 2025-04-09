import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface LadRawClickData {
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
  "Facebook CLID"?: string;
  "Googleオフライン CLID"?: string;
  "Yahoo検索広告 CLID"?: string;
  "TikTok CLID"?: string;
  "LINE CLID"?: string;
  "Yahooディスプレイ広告 CLID"?: string;
  "Google CLID"?: string;
  "Google GBRAID"?: string;
  "Google WBRAID"?: string;
  "X CLID"?: string;
  "CatsReport ID"?: string;
  セッションID?: string;
  ユーザーID?: string;
  トラッキングユーザーID?: string;
  ステータス?: string;
}

interface LadClickFormattedData {
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
  ipAdress: string | null;
  referrer: string | null;
  clData1: string | null;
  facebookClId: string | null;
  yafooSearchAdClId: string | null;
  tiktokClId: string | null;
  googleClId: string | null;
  googleGbrald: string | null;
  googleWbrald: string | null;
  xClId: string | null;
  catsReportId: string | null;
  sessionId: string | null;
  userId: string | null;
  trackingUserId: string | null;
  status: string | null;
  createdDate?: Date;
  updatedDate?: Date;
}

@Injectable()
export class LadClickLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: LadRawClickData): LadClickFormattedData {
    return {
      clickDate: toValidDate(item["クリック日時"]),
      mediaName: item["媒体名"] || null,
      mediaCategory1: item["媒体カテゴリ名①"] || null,
      mediaCategory2: item["媒体カテゴリ名②"] || null,
      advertiserName: item["広告主名"] || null,
      adName: item["広告名"] || null,
      adgroupName: item["広告グループ名"] || null,
      redirectAdUrlName: item["遷移広告URL名"] || null,
      useRotation: item["ローテーション利用"] || null,
      carrier: item["キャリア"] || null,
      osType: item["OS"] || null,
      userAgent: item["ユーザーエージェント"] || null,
      ipAdress: item["IPアドレス"] || null,
      referrer: item["リファラ"] || null,
      clData1: item["CL付加情報1"] || null,
      facebookClId: item["Facebook CLID"] || null,
      yafooSearchAdClId: item["Yahoo検索広告 CLID"] || null,
      tiktokClId: item["TikTok CLID"] || null,
      googleClId: item["Google CLID"] || null,
      googleGbrald: item["Google GBRAID"] || null,
      googleWbrald: item["Google WBRAID"] || null,
      xClId: item["X CLID"] || null,
      catsReportId: item["CatsReport ID"] || null,
      sessionId: item["セッションID"] || null,
      userId: item["ユーザーID"] || null,
      trackingUserId: item["トラッキングユーザーID"] || null,
      status: item["ステータス"] || null,
      createdDate: new Date(),
      updatedDate: new Date(),
    };
  }

  async save(logs: LadRawClickData[]): Promise<void> {
    for (const item of logs) {
      const formatted = this.formatData(item);
      await this.prisma.ladClickLog.create({
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
