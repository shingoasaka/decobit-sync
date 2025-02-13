import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class TryActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(conversionData: any[]) {
    for (const item of conversionData) {
      await this.prisma.hanikamuActionLog.create({
        data: {
          actionId: parseInt(item["成果ID"].replace("R", ""), 10) || null,
          clickDateTime: new Date(item["クリック日"]),
          actionDateTime: new Date(item["成果発生日"]),
          approvalDateTime:
            item["承認確定日"] !== "0000-00-00 00:00:00"
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
        },
      });
    }
  }
}
