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
          adAuthority: item["権限"] || null,
          channel: item["媒体"] || null,
          adIdentifier: item["広告枠"] || null,
          campaignName: item["キャンペーン名"] || null,
          adDurations: toDate(item["掲載期間"]) || null,
          click: toNumber(item["クリック数"]) || null,
          ecRegistrationCv: toNumber(item["02.EC会員登録(CV)"]) || null,
          ecDirectRegistration: toNumber(item["02.EC会員登録(直接)"]) || null,
          ecRevisitRegistration:
            toNumber(item["02.EC会員登録(再来訪)"]) || null,
          ecRegistrationCvr: toNumber(item["02.EC会員登録(CVR[%])"]) || null,
          ecPurchaseCv: toNumber(item["03.EC購入(CV)"]) || null,
          ecDirectPurchaseCv: toNumber(item["03.EC購入(直接)"]) || null,
          ecRevisitPurchaseCv: toNumber(item["03.EC購入(再来訪)"]) || null,
          ecPurchaseCvr: toNumber(item["03.EC購入(CVR[%])"]) || null,
          webReservationCv: toNumber(item["WEB予約完了(CV)"]) || null,
          webDirectReservationCv: toNumber(item["WEB予約完了(直接)"]) || null,
          webRevisitReservationCv:
            toNumber(item["WEB予約完了(再来訪)"]) || null,
          webReservationCvr: toFloat(item["WEB予約完了(CVR[%])"]) || null,
          epilerWebReservationCv:
            toNumber(item["エピレWEB予約完了(CV)"]) || null,
          epilerDirectReservationCv:
            toNumber(item["エピレWEB予約完了(直接)"]) || null,
          epilerRevisitReservationCv:
            toNumber(item["エピレWEB予約完了(再来訪)"]) || null,
          epilerWebReservationCvr:
            toFloat(item["エピレWEB予約完了(CVR[%])"]) || null,
          test1Cv: toNumber(item["テスト1(CV)"]) || null,
          test1DirectCv: toNumber(item["テスト1(直接)"]) || null,
          test1RevisitCv: toNumber(item["テスト1(再来訪)"]) || null,
          test1Cvr: toFloat(item["テスト1(CVR[%])"]) || null,
          test2Cv: toNumber(item["テスト2(CV)"]) || null,
          test2DirectCv: toNumber(item["テスト2(直接)"]) || null,
          test2RevisitCv: toNumber(item["テスト2(再来訪)"]) || null,
          test2Cvr: toFloat(item["テスト2(CVR[%])"]) || null,
          test3Cv: toNumber(item["テスト3(CV)"]) || null,
          test3DirectCv: toNumber(item["テスト3(直接)"]) || null,
          test3RevisitCv: toNumber(item["テスト3(再来訪)"]) || null,
          test3Cvr: toFloat(item["テスト3(CVR[%])"]) || null,
          recruitmentCv: toNumber(item["採用申込完了(CV)"]) || null,
          recruitmentDirectCv: toNumber(item["採用申込完了(直接)"]) || null,
          recruitmentRevisitCv: toNumber(item["採用申込完了(再来訪)"]) || null,
          recruitmentCvr: toFloat(item["採用申込完了(CVR[%])"]) || null,
        },
      });
    }
  }
}
