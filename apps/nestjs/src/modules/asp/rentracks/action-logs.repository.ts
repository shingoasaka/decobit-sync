import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface RentracksRawData {
  クリック日時?: string;
  売上日時?: string;
  売上番号?: string;
  広告主?: string;
  プロダクト?: string;
  売上額?: string;
  報酬額?: string;
  状況?: string;
  期限?: string;
  承認日?: string;
  備考?: string;
  サイトID?: string;
  サイト名?: string;
  デバイス?: string;
  リファラー?: string;
  ユーザーエージェント?: string;
  拒否理由?: string;
}

interface RentracksFormattedData {
  clickDateTime: Date | null;
  salesDateTime: Date | null;
  salesNumber: number | null;
  advertiserName: string | null;
  productName: string | null;
  salesAmount: number | null;
  rewardAmount: number | null;
  status: string | null;
  actionDeadline: Date | null;
  approvalDateTime: Date | null;
  remarks: string | null;
  adSiteId: number | null;
  adSiteName: string | null;
  deviceType: string | null;
  referrerUrl: string | null;
  deviceInfo: string | null;
  reasonRefusal: string | null;
}

@Injectable()
export class RentracksActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RentracksRawData): RentracksFormattedData {
    return {
      clickDateTime: item["クリック日時"]
        ? new Date(item["クリック日時"].replace(/（.*?）/, ""))
        : null,
      salesDateTime: item["売上日時"]
        ? new Date(item["売上日時"].replace(/（.*?）/, ""))
        : null,
      salesNumber: item["売上番号"]
        ? parseInt(item["売上番号"].replace("№", ""), 10)
        : null,
      advertiserName: item["広告主"] || null,
      productName: item["プロダクト"] || null,
      salesAmount: item["売上額"] ? parseInt(item["売上額"], 10) : null,
      rewardAmount: item["報酬額"] ? parseInt(item["報酬額"], 10) : null,
      status: item["状況"] || null,
      actionDeadline: item["期限"]
        ? new Date(
            Date.now() + parseInt(item["期限"], 10) * 24 * 60 * 60 * 1000,
          )
        : null,
      approvalDateTime: item["承認日"] ? new Date(item["承認日"]) : null,
      remarks: item["備考"] || null,
      adSiteId: item["サイトID"] ? parseInt(item["サイトID"], 10) : null,
      adSiteName: item["サイト名"] || null,
      deviceType: item["デバイス"] || null,
      referrerUrl: item["リファラー"] || null,
      deviceInfo: item["ユーザーエージェント"] || null,
      reasonRefusal: item["拒否理由"] || null,
    };
  }

  async save(conversionData: RentracksRawData[]): Promise<void> {
    for (const item of conversionData) {
      const formattedData = this.formatData(item);
      await this.prisma.rentracksActionLog.create({
        data: formattedData,
      });
    }
  }
}
