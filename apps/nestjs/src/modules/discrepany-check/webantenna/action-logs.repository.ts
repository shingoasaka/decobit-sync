import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class WebantennaActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(conversionData: any[]) {
    for (const item of conversionData) {
      // 日付変換用のヘルパー関数
      const toDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };
      // BigInt変換用のヘルパー関数を追加
      const toBigInt = (value: string | null | undefined) => {
        if (!value) return null;
        try {
          return BigInt(value);
        } catch {
          return null;
        }
      };
      await this.prisma.webantennaActionLog.create({
        data: {
          deviceType: item["端末"] || null,
          userId: toBigInt(item["ユーザーID"]) || null,
          sessionId: toBigInt(item["セッションID"]) || null,
          clicked: toDate(item["流入時刻"]) || null,
          adAuthority: item["権限"] || null,
          utmSourceIdentifier: item["流入種別"] || null,
          utmSource: item["媒体/検索エンジン/流入元サイト"] || null,
          adIdentifier: item["広告枠"] || null,
          campaignName: item["キャンペーン名"] || null,
          adGroupName: item["広告グループ名"] || null,
          creativeName: item["クリエイティブ名"] || null,
          creativeUtmName:
            item["クリエイティブ/キーワード/流入元ページ"] || null,
          adTitle: item["リンク先名/入口ページタイトル"] || null,
          adUrl: item["リンク先URL/入口ページ"] || null,
          cvDate: toDate(item["CV時刻"]) || null,
          cvName: item["CV名"] || null,
          cvIdentifierId: item["受付No."] || null,
          courseName: item["コース名"] || null,
          courseNameDetail: item["コース名詳細"] || null,
          firstClicked: toDate(item["[1回目]流入時刻"]) || null,
          firstClickedIdentifier: item["[1回目]流入種別"] || null,
          firstUtmSource: item["[1回目]媒体/検索エンジン/流入元サイト"] || null,
          firstAdIdentifier: item["[1回目]広告枠"] || null,
          firstCampaignName: item["[1回目]キャンペーン名"] || null,
          firstAdGroupName: item["[1回目]広告グループ名"] || null,
          firstCreativeName: item["[1回目]クリエイティブ名"] || null,
          firstCreativeUtmName:
            item["[1回目]クリエイティブ/キーワード/流入元ページ"] || null,
          firstAdTitle: item["[1回目]リンク先名/入口ページタイトル"] || null,
          firstAdUrl: item["[1回目]リンク先URL/入口ページ"] || null,
          secondClicked: toDate(item["[2回目]流入時刻"]) || null,
          secondClickedIdentifier: item["[2回目]流入種別"] || null,
          secondUtmSource:
            item["[2回目]媒体/検索エンジン/流入元サイト"] || null,
          secondAdIdentifier: item["[2回目]広告枠"] || null,
          secondCampaignName: item["[2回目]キャンペーン名"] || null,
          secondAdGroupName: item["[2回目]広告グループ名"] || null,
          secondCreativeName: item["[2回目]クリエイティブ名"] || null,
          secondCreativeUtmName:
            item["[2回目]クリエイティブ/キーワード/流入元ページ"] || null,
          secondAdTitle: item["[2回目]リンク先名/入口ページタイトル"] || null,
          secondAdUrl: item["[2回目]リンク先URL/入口ページ"] || null,
          thirdClicked: toDate(item["[3回目]流入時刻"]) || null,
          thirdClickedIdentifier: item["[3回目]流入種別"] || null,
          thirdUtmSource: item["[3回目]媒体/検索エンジン/流入元サイト"] || null,
          thirdAdIdentifier: item["[3回目]広告枠"] || null,
          thirdCampaignName: item["[3回目]キャンペーン名"] || null,
          thirdAdGroupName: item["[3回目]広告グループ名"] || null,
          thirdCreativeName: item["[3回目]クリエイティブ名"] || null,
          thirdCreativeUtmName:
            item["[3回目]クリエイティブ/キーワード/流入元ページ"] || null,
          thirdAdTitle: item["[3回目]リンク先名/入口ページタイトル"] || null,
          thirdAdUrl: item["[3回目]リンク先URL/入口ページ"] || null,
          fourthClicked: toDate(item["[4回目]流入時刻"]) || null,
          fourthClickedIdentifier: item["[4回目]流入種別"] || null,
          fourthUtmSource:
            item["[4回目]媒体/検索エンジン/流入元サイト"] || null,
          fourthAdIdentifier: item["[4回目]広告枠"] || null,
          fourthCampaignName: item["[4回目]キャンペーン名"] || null,
          fourthAdGroupName: item["[4回目]広告グループ名"] || null,
          fourthCreativeName: item["[4回目]クリエイティブ名"] || null,
          fourthCreativeUtmName:
            item["[4回目]クリエイティブ/キーワード/流入元ページ"] || null,
          fourthAdTitle: item["[4回目]リンク先名/入口ページタイトル"] || null,
          fourthAdUrl: item["[4回目]リンク先URL/入口ページ"] || null,
          fifthClicked: toDate(item["[5回目]流入時刻"]) || null,
          fifthClickedIdentifier: item["[5回目]流入種別"] || null,
          fifthUtmSource: item["[5回目]媒体/検索エンジン/流入元サイト"] || null,
          fifthAdIdentifier: item["[5回目]広告枠"] || null,
          fifthCampaignName: item["[5回目]キャンペーン名"] || null,
          fifthAdGroupName: item["[5回目]広告グループ名"] || null,
          fifthCreativeName: item["[5回目]クリエイティブ名"] || null,
          fifthCreativeUtmName:
            item["[5回目]クリエイティブ/キーワード/流入元ページ"] || null,
          fifthAdTitle: item["[5回目]リンク先名/入口ページタイトル"] || null,
          fifthAdUrl: item["[5回目]リンク先URL/入口ページ"] || null,
          sixthClicked: toDate(item["[6回目]流入時刻"]) || null,
          sixthClickedIdentifier: item["[6回目]流入種別"] || null,
          sixthUtmSource: item["[6回目]媒体/検索エンジン/流入元サイト"] || null,
          sixthAdIdentifier: item["[6回目]広告枠"] || null,
          sixthCampaignName: item["[6回目]キャンペーン名"] || null,
          sixthAdGroupName: item["[6回目]広告グループ名"] || null,
          sixthCreativeName: item["[6回目]クリエイティブ名"] || null,
          sixthCreativeUtmName:
            item["[6回目]クリエイティブ/キーワード/流入元ページ"] || null,
          sixthAdTitle: item["[6回目]リンク先名/入口ページタイトル"] || null,
          sixthAdUrl: item["[6回目]リンク先URL/入口ページ"] || null,
          seventhClicked: toDate(item["[7回目]流入時刻"]) || null,
          seventhClickedIdentifier: item["[7回目]流入種別"] || null,
          seventhUtmSource:
            item["[7回目]媒体/検索エンジン/流入元サイト"] || null,
          seventhAdIdentifier: item["[7回目]広告枠"] || null,
          seventhCampaignName: item["[7回目]キャンペーン名"] || null,
          seventhAdGroupName: item["[7回目]広告グループ名"] || null,
          seventhCreativeName: item["[7回目]クリエイティブ名"] || null,
          seventhCreativeUtmName:
            item["[7回目]クリエイティブ/キーワード/流入元ページ"] || null,
          seventhAdTitle: item["[7回目]リンク先名/入口ページタイトル"] || null,
          seventhAdUrl: item["[7回目]リンク先URL/入口ページ"] || null,
          eighthClicked: toDate(item["[8回目]流入時刻"]) || null,
          eighthClickedIdentifier: item["[8回目]流入種別"] || null,
          eighthUtmSource:
            item["[8回目]媒体/検索エンジン/流入元サイト"] || null,
          eighthAdIdentifier: item["[8回目]広告枠"] || null,
          eighthCampaignName: item["[8回目]キャンペーン名"] || null,
          eighthAdGroupName: item["[8回目]広告グループ名"] || null,
          eighthCreativeName: item["[8回目]クリエイティブ名"] || null,
          eighthCreativeUtmName:
            item["[8回目]クリエイティブ/キーワード/流入元ページ"] || null,
          eighthAdTitle: item["[8回目]リンク先名/入口ページタイトル"] || null,
          eighthAdUrl: item["[8回目]リンク先URL/入口ページ"] || null,
          ninthClicked: toDate(item["[9回目]流入時刻"]) || null,
          ninthClickedIdentifier: item["[9回目]流入種別"] || null,
          ninthUtmSource: item["[9回目]媒体/検索エンジン/流入元サイト"] || null,
          ninthAdIdentifier: item["[9回目]広告枠"] || null,
          ninthCampaignName: item["[9回目]キャンペーン名"] || null,
          ninthAdGroupName: item["[9回目]広告グループ名"] || null,
          ninthCreativeName: item["[9回目]クリエイティブ名"] || null,
          ninthCreativeUtmName:
            item["[9回目]クリエイティブ/キーワード/流入元ページ"] || null,
          ninthAdTitle: item["[9回目]リンク先名/入口ページタイトル"] || null,
          ninthAdUrl: item["[9回目]リンク先URL/入口ページ"] || null,
          tenthClicked: toDate(item["[10回目]流入時刻"]) || null,
          tenthClickedIdentifier: item["[10回目]流入種別"] || null,
          tenthUtmSource:
            item["[10回目]媒体/検索エンジン/流入元サイト"] || null,
          tenthAdIdentifier: item["[10回目]広告枠"] || null,
          tenthCampaignName: item["[10回目]キャンペーン名"] || null,
          tenthAdGroupName: item["[10回目]広告グループ名"] || null,
          tenthCreativeName: item["[10回目]クリエイティブ名"] || null,
          tenthCreativeUtmName:
            item["[10回目]クリエイティブ/キーワード/流入元ページ"] || null,
          tenthAdTitle: item["[10回目]リンク先名/入口ページタイトル"] || null,
          tenthAdUrl: item["[10回目]リンク先URL/入口ページ"] || null,
        },
      });
    }
  }
}
