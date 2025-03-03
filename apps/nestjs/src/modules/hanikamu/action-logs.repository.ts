import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface HanikamuRawData {
  成果ID: string;
  クリック日: string;
  成果発生日: string;
  承認確定日?: string;
  広告?: string;
  広告種別?: string;
  キャンペーン?: string;
  ランディングページ?: string;
  ランディングページURL?: string;
  デバイス?: string;
  OS情報?: string;
  承認状態?: string;
  リファラ?: string;
  トラッキングパラメータ?: string;
}

interface HanikamuFormattedData {
  actionId: number | null;
  clickDateTime: Date;
  actionDateTime: Date;
  approvalDateTime: Date | null;
  adName: string | null;
  adCategory: string | null;
  campaignName: string | null;
  landingPageName: string | null;
  lpUrl: string | null;
  deviceType: string | null;
  osType: string | null;
  status: string | null;
  referrerUrl: string | null;
  trackingParams: string | null;
}

@Injectable()
export class HanikamuActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: HanikamuRawData): HanikamuFormattedData {
    return {
      actionId: parseInt(item["成果ID"].replace("R", ""), 10) || null,
      clickDateTime: new Date(item["クリック日"]),
      actionDateTime: new Date(item["成果発生日"]),
      approvalDateTime:
        item["承認確定日"] && item["承認確定日"] !== "0000-00-00 00:00:00"
          ? new Date(item["承認確定日"])
          : null,
      adName: item["広告"] || null,
      adCategory: item["広告種別"] || null,
      campaignName: item["キャンペーン"] || null,
      landingPageName: item["ランディングページ"] || null,
      lpUrl: item["ランディングページURL"] || null,
      deviceType: item["デバイス"] || null,
      osType: item["OS情報"] || null,
      status: item["承認状態"] || null,
      referrerUrl: item["リファラ"] || null,
      trackingParams: item["トラッキングパラメータ"] || null,
    };
  }

  async save(conversionData: HanikamuRawData[]): Promise<void> {
    for (const item of conversionData) {
      const formattedData = this.formatData(item);
      await this.prisma.hanikamuActionLog.create({
        data: formattedData,
      });
    }
  }
}
