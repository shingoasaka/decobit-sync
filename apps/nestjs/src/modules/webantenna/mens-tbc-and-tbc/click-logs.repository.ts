import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class WebantennaClickLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(clickData: any[]) {
    for (const item of clickData) {
      // 日付変換用のヘルパー関数
      const toDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      // 数値変換用のヘルパー関数
      const toNumber = (value: string | null | undefined) => {
        if (!value) return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      // Float変換用のヘルパー関数
      const toFloat = (value: string | null | undefined) => {
        if (!value) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      };

      await this.prisma.webantennaClickLog.create({
        data: {
          ad_authority: item["権限"] || null,
          channel: item["媒体"] || null,
          ad_identifier: item["広告枠"] || null,
          campaign_name: item["キャンペーン名"] || null,
          ad_durations: toDate(item["掲載期間"]) || null,
          click: toNumber(item["クリック数"]) || null,
          ec_registration_cv: toNumber(item["02.EC会員登録(CV)"]) || null,
          ec_direct_registration: toNumber(item["02.EC会員登録(直接)"]) || null,
          ec_revisit_registration:
            toNumber(item["02.EC会員登録(再来訪)"]) || null,
          ec_registration_cvr: toNumber(item["02.EC会員登録(CVR[%])"]) || null,
          ec_purchase_cv: toNumber(item["03.EC購入(CV)"]) || null,
          ec_direct_purchase_cv: toNumber(item["03.EC購入(直接)"]) || null,
          ec_revisit_purchase_cv: toNumber(item["03.EC購入(再来訪)"]) || null,
          ec_purchase_cvr: toNumber(item["03.EC購入(CVR[%])"]) || null,
          web_reservation_cv: toNumber(item["WEB予約完了(CV)"]) || null,
          web_direct_reservation_cv:
            toNumber(item["WEB予約完了(直接)"]) || null,
          web_revisit_reservation_cv:
            toNumber(item["WEB予約完了(再来訪)"]) || null,
          web_reservation_cvr: toFloat(item["WEB予約完了(CVR[%])"]) || null,
          epiler_web_reservation_cv:
            toNumber(item["エピレWEB予約完了(CV)"]) || null,
          epiler_direct_reservation_cv:
            toNumber(item["エピレWEB予約完了(直接)"]) || null,
          epiler_revisit_reservation_cv:
            toNumber(item["エピレWEB予約完了(再来訪)"]) || null,
          epiler_web_reservation_cvr:
            toFloat(item["エピレWEB予約完了(CVR[%])"]) || null,
          test1_cv: toNumber(item["テスト1(CV)"]) || null,
          test1_direct_cv: toNumber(item["テスト1(直接)"]) || null,
          test1_revisit_cv: toNumber(item["テスト1(再来訪)"]) || null,
          test1_cvr: toFloat(item["テスト1(CVR[%])"]) || null,
          test2_cv: toNumber(item["テスト2(CV)"]) || null,
          test2_direct_cv: toNumber(item["テスト2(直接)"]) || null,
          test2_revisit_cv: toNumber(item["テスト2(再来訪)"]) || null,
          test2_cvr: toFloat(item["テスト2(CVR[%])"]) || null,
          test3_cv: toNumber(item["テスト3(CV)"]) || null,
          test3_direct_cv: toNumber(item["テスト3(直接)"]) || null,
          test3_revisit_cv: toNumber(item["テスト3(再来訪)"]) || null,
          test3_cvr: toFloat(item["テスト3(CVR[%])"]) || null,
          recruitment_cv: toNumber(item["採用申込完了(CV)"]) || null,
          recruitment_direct_cv: toNumber(item["採用申込完了(直接)"]) || null,
          recruitment_revisit_cv:
            toNumber(item["採用申込完了(再来訪)"]) || null,
          recruitment_cvr: toFloat(item["採用申込完了(CVR[%])"]) || null,
        },
      });
    }
  }
}
