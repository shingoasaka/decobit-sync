import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class NavicluActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(conversionData: any[]) {
    for (const item of conversionData) {
      await this.prisma.rentracksActionLog.create({
        data: {
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
          deviceIinfo: item["ユーザーエージェント"] || null,
          reasonRrefusal: item["拒否理由"] || null,
        },
      });
    }
  }
}
