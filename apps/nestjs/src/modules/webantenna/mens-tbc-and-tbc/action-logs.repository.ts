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
          device_type: item["端末"] || null,
          user_id: toBigInt(item["ユーザーID"]) || null,
          session_id: toBigInt(item["セッションID"]) || null,
          clicked: toDate(item["流入時刻"]) || null,
          ad_authority: item["権限"] || null,
          utm_sourc_identifier: item["流入種別"] || null,
          utm_source: item["媒体/検索エンジン/流入元サイト"] || null,
          ad_identifier: item["広告枠"] || null,
          campaign_name: item["キャンペーン名"] || null,
          ad_group_name: item["広告グループ名"] || null,
          creative_name: item["クリエイティブ名"] || null,
          creative_utm_name:
            item["クリエイティブ/キーワード/流入元ページ"] || null,
          ad_title: item["リンク先名/入口ページタイトル"] || null,
          ad_url: item["リンク先URL/入口ページ"] || null,
          cv_date: toDate(item["CV時刻"]) || null,
          cv_name: item["CV名"] || null,
          cv_identifier_id: parseInt(item["受付No."], 10) || null,
          course_name: item["コース名"] || null,
          course_name_detail: item["コース名詳細"] || null,
          first_clicked: toDate(item["[1回目]流入時刻"]) || null,
          first_clicked_identifier: item["[1回目]流入種別"] || null,
          first_utm_source:
            item["[1回目]媒体/検索エンジン/流入元サイト"] || null,
          first_ad_identifier: item["[1回目]広告枠"] || null,
          first_campaign_name: item["[1回目]キャンペーン名"] || null,
          first_ad_group_name: item["[1回目]広告グループ名"] || null,
          first_creative_name: item["[1回目]クリエイティブ名"] || null,
          first_creative_utm_name:
            item["[1回目]クリエイティブ/キーワード/流入元ページ"] || null,
          first_ad_title: item["[1回目]リンク先名/入口ページタイトル"] || null,
          first_ad_url: item["[1回目]リンク先URL/入口ページ"] || null,
          second_clicked: toDate(item["[2回目]流入時刻"]) || null,
          second_clicked_identifier: item["[2回目]流入種別"] || null,
          second_utm_source:
            item["[2回目]媒体/検索エンジン/流入元サイト"] || null,
          second_ad_identifier: item["[2回目]広告枠"] || null,
          second_campaign_name: item["[2回目]キャンペーン名"] || null,
          second_ad_group_name: item["[2回目]広告グループ名"] || null,
          second_creative_name: item["[2回目]クリエイティブ名"] || null,
          second_creative_utm_name:
            item["[2回目]クリエイティブ/キーワード/流入元ページ"] || null,
          second_ad_title: item["[2回目]リンク先名/入口ページタイトル"] || null,
          second_ad_url: item["[2回目]リンク先URL/入口ページ"] || null,
          third_clicked: toDate(item["[3回目]流入時刻"]) || null,
          third_clicked_identifier: item["[3回目]流入種別"] || null,
          third_utm_source:
            item["[3回目]媒体/検索エンジン/流入元サイト"] || null,
          third_ad_identifier: item["[3回目]広告枠"] || null,
          third_campaign_name: item["[3回目]キャンペーン名"] || null,
          third_ad_group_name: item["[3回目]広告グループ名"] || null,
          third_creative_name: item["[3回目]クリエイティブ名"] || null,
          third_creative_utm_name:
            item["[3回目]クリエイティブ/キーワード/流入元ページ"] || null,
          third_ad_title: item["[3回目]リンク先名/入口ページタイトル"] || null,
          third_ad_url: item["[3回目]リンク先URL/入口ページ"] || null,
          fourth_clicked: toDate(item["[4回目]流入時刻"]) || null,
          fourth_clicked_identifier: item["[4回目]流入種別"] || null,
          fourth_utm_source:
            item["[4回目]媒体/検索エンジン/流入元サイト"] || null,
          fourth_ad_identifier: item["[4回目]広告枠"] || null,
          fourth_campaign_name: item["[4回目]キャンペーン名"] || null,
          fourth_ad_group_name: item["[4回目]広告グループ名"] || null,
          fourth_creative_name: item["[4回目]クリエイティブ名"] || null,
          fourth_creative_utm_name:
            item["[4回目]クリエイティブ/キーワード/流入元ページ"] || null,
          fourth_ad_title: item["[4回目]リンク先名/入口ページタイトル"] || null,
          fourth_ad_url: item["[4回目]リンク先URL/入口ページ"] || null,
          fifth_clicked: toDate(item["[5回目]流入時刻"]) || null,
          fifth_clicked_identifier: item["[5回目]流入種別"] || null,
          fifth_utm_source:
            item["[5回目]媒体/検索エンジン/流入元サイト"] || null,
          fifth_ad_identifier: item["[5回目]広告枠"] || null,
          fifth_campaign_name: item["[5回目]キャンペーン名"] || null,
          fifth_ad_group_name: item["[5回目]広告グループ名"] || null,
          fifth_creative_name: item["[5回目]クリエイティブ名"] || null,
          fifth_creative_utm_name:
            item["[5回目]クリエイティブ/キーワード/流入元ページ"] || null,
          fifth_ad_title: item["[5回目]リンク先名/入口ページタイトル"] || null,
          fifth_ad_url: item["[5回目]リンク先URL/入口ページ"] || null,
          sixth_clicked: toDate(item["[6回目]流入時刻"]) || null,
          sixth_clicked_identifier: item["[6回目]流入種別"] || null,
          sixth_utm_source:
            item["[6回目]媒体/検索エンジン/流入元サイト"] || null,
          sixth_ad_identifier: item["[6回目]広告枠"] || null,
          sixth_campaign_name: item["[6回目]キャンペーン名"] || null,
          sixth_ad_group_name: item["[6回目]広告グループ名"] || null,
          sixth_creative_name: item["[6回目]クリエイティブ名"] || null,
          sixth_creative_utm_name:
            item["[6回目]クリエイティブ/キーワード/流入元ページ"] || null,
          sixth_ad_title: item["[6回目]リンク先名/入口ページタイトル"] || null,
          sixth_ad_url: item["[6回目]リンク先URL/入口ページ"] || null,
          seventh_clicked: toDate(item["[7回目]流入時刻"]) || null,
          seventh_clicked_identifier: item["[7回目]流入種別"] || null,
          seventh_utm_source:
            item["[7回目]媒体/検索エンジン/流入元サイト"] || null,
          seventh_ad_identifier: item["[7回目]広告枠"] || null,
          seventh_campaign_name: item["[7回目]キャンペーン名"] || null,
          seventh_ad_group_name: item["[7回目]広告グループ名"] || null,
          seventh_creative_name: item["[7回目]クリエイティブ名"] || null,
          seventh_creative_utm_name:
            item["[7回目]クリエイティブ/キーワード/流入元ページ"] || null,
          seventh_ad_title:
            item["[7回目]リンク先名/入口ページタイトル"] || null,
          seventh_ad_url: item["[7回目]リンク先URL/入口ページ"] || null,
          eighth_clicked: toDate(item["[8回目]流入時刻"]) || null,
          eighth_clicked_identifier: item["[8回目]流入種別"] || null,
          eighth_utm_source:
            item["[8回目]媒体/検索エンジン/流入元サイト"] || null,
          eighth_ad_identifier: item["[8回目]広告枠"] || null,
          eighth_campaign_name: item["[8回目]キャンペーン名"] || null,
          eighth_ad_group_name: item["[8回目]広告グループ名"] || null,
          eighth_creative_name: item["[8回目]クリエイティブ名"] || null,
          eighth_creative_utm_name:
            item["[8回目]クリエイティブ/キーワード/流入元ページ"] || null,
          eighth_ad_title: item["[8回目]リンク先名/入口ページタイトル"] || null,
          eighth_ad_url: item["[8回目]リンク先URL/入口ページ"] || null,
          ninth_clicked: toDate(item["[9回目]流入時刻"]) || null,
          ninth_clicked_identifier: item["[9回目]流入種別"] || null,
          ninth_utm_source:
            item["[9回目]媒体/検索エンジン/流入元サイト"] || null,
          ninth_ad_identifier: item["[9回目]広告枠"] || null,
          ninth_campaign_name: item["[9回目]キャンペーン名"] || null,
          ninth_ad_group_name: item["[9回目]広告グループ名"] || null,
          ninth_creative_name: item["[9回目]クリエイティブ名"] || null,
          ninth_creative_utm_name:
            item["[9回目]クリエイティブ/キーワード/流入元ページ"] || null,
          ninth_ad_title: item["[9回目]リンク先名/入口ページタイトル"] || null,
          ninth_ad_url: item["[9回目]リンク先URL/入口ページ"] || null,
          tenth_clicked: toDate(item["[10回目]流入時刻"]) || null,
          tenth_clicked_identifier: item["[10回目]流入種別"] || null,
          tenth_utm_source:
            item["[10回目]媒体/検索エンジン/流入元サイト"] || null,
          tenth_ad_identifier: item["[10回目]広告枠"] || null,
          tenth_campaign_name: item["[10回目]キャンペーン名"] || null,
          tenth_ad_group_name: item["[10回目]広告グループ名"] || null,
          tenth_creative_name: item["[10回目]クリエイティブ名"] || null,
          tenth_creative_utm_name:
            item["[10回目]クリエイティブ/キーワード/流入元ページ"] || null,
          tenth_ad_title: item["[10回目]リンク先名/入口ページタイトル"] || null,
          tenth_ad_url: item["[10回目]リンク先URL/入口ページ"] || null,
        },
      });
    }
  }
}
