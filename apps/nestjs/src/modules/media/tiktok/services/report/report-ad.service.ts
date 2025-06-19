import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { TikTokAdReportDto } from "../../dtos/tiktok-report.dto";
import { TikTokAdReport } from "../../interfaces/report.interface";
import { getNowJstForDB } from "src/libs/date-utils";
import { TikTokAdRepository } from "../../repositories/report/report-ad.repository";
import { TikTokAccountService } from "../account.service";
import { PrismaService } from "@prismaService";
import {
  MediaError,
  ErrorType,
  ERROR_CODES,
} from "../../../common/errors/media.error";
import { ERROR_MESSAGES } from "../../../common/errors/media.error";
import { TikTokAdStatusItem } from "../../interfaces/tiktok-status-response.interface";
import { TikTokStatusBaseService } from "../../base/tiktok-status-base.service";
import { TikTokApiHeaders } from "../../interfaces/tiktok-api.interface";

/**
 * TikTok 広告レポートサービス
 *
 * このサービスは、TikTokの広告レポートデータを効率的に取得・処理します。
 *
 * 主な機能:
 * - レポートAPIから広告のメトリクスデータを取得
 * - ステータスAPIから広告のステータス情報を取得
 * - レポートデータとステータスデータの統合
 * - データベースへの保存（RAWテーブル）
 *
 * 最適化戦略:
 * - レポートAPIで今日のアクティブな広告IDを取得
 * - 取得したIDのみでステータスAPIを呼び出し（データ量削減）
 * - バッチ処理によるメモリ効率の改善
 * - レート制限対策の実装
 *
 * データフロー:
 * 1. レポートAPI → 今日の広告ID抽出
 * 2. ステータスAPI → 抽出したIDのステータス取得
 * 3. データ統合 → レポート + ステータス
 * 4. データベース保存 → RAWテーブル
 */
@Injectable()
export class TikTokAdReportService extends TikTokStatusBaseService {
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  protected readonly statusApiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/ad/get/";
  protected readonly statusFields = [
    "ad_id",
    "secondary_status",
    "operation_status",
    "modify_time",
  ];

  constructor(
    private readonly adRepository: TikTokAdRepository,
    http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
    private readonly prisma: PrismaService,
  ) {
    super(http, TikTokAdReportService.name);
  }

  public async saveReports(reports: TikTokAdReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug("処理対象のデータがありません");
      return 0;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const batchSize = 1000;
        let totalSaved = 0;

        for (let i = 0; i < reports.length; i += batchSize) {
          const batch = reports.slice(i, i + batchSize);
          const result = await tx.tikTokRawReportAd.createMany({
            data: batch,
            skipDuplicates: true,
          });
          totalSaved += result.count;
        }

        this.logInfo(`✅ ${totalSaved} 件の広告レポートを保存しました`);
        return totalSaved;
      });
    } catch (error) {
      throw new MediaError(
        ERROR_MESSAGES.SAVE_ERROR,
        ERROR_CODES.SAVE_ERROR,
        ErrorType.BUSINESS,
        { originalError: error },
      );
    }
  }

  async fetchAndInsertLogs(): Promise<number> {
    try {
      const advertiserIds = await this.tikTokAccountService.getAccountIds();
      if (advertiserIds.length === 0) {
        throw new MediaError(
          ERROR_MESSAGES.NO_ACCOUNT_IDS,
          ERROR_CODES.NO_ACCOUNT_IDS,
          ErrorType.BUSINESS,
        );
      }

      const accountMapping = await this.prisma.adAccount.findMany({
        where: {
          ad_platform_account_id: { in: advertiserIds },
        },
        select: {
          id: true,
          ad_platform_account_id: true,
        },
      });

      const accountIdMap = new Map<string, number>(
        accountMapping.map(
          (acc: { ad_platform_account_id: string; id: number }) => [
            acc.ad_platform_account_id,
            acc.id,
          ],
        ),
      );

      const today = new Date();
      const todayStr = this.formatDate(today);
      this.validateDate(todayStr);

      this.logInfo(`本日(${todayStr})のデータを取得します`);

      const headers: TikTokApiHeaders = {
        "Access-Token": process.env.TIKTOK_ACCESS_TOKEN!,
        "Content-Type": "application/json",
      };

      let totalSaved = 0;

      // レポートAPI: 各広告主を個別に処理
      const allReportData: TikTokAdReportDto[] = [];
      for (const advertiserId of advertiserIds) {
        try {
          const reportData = await this.fetchReportData(
            advertiserId,
            todayStr,
            headers,
          );
          allReportData.push(...reportData);

          // レート制限対策: 広告主間で少し待機
          await this.delay(100);
        } catch (error) {
          this.logError(`レポート取得失敗 (advertiser=${advertiserId})`, error);
          // 他の広告主の処理は継続
          continue;
        }
      }

      // 今日のReportデータからIDリストを抽出
      const todayAdIds = new Set<string>();
      for (const report of allReportData) {
        todayAdIds.add(report.dimensions.ad_id);
      }

      this.logInfo(
        `今日のReportデータから ${todayAdIds.size} 件の広告IDを抽出`,
      );

      // ステータスAPI: 今日のIDのみを指定して取得
      const allStatusData = await this.processReportAndStatusData<
        TikTokAdStatusItem,
        TikTokAdReportDto
      >(allReportData, "ad_id", headers, "広告");

      // データをマージしてRAWテーブルに保存
      let mergedRecords: TikTokAdReport[] = [];
      try {
        mergedRecords = this.mergeReportAndStatusDataBatch(
          allReportData,
          allStatusData,
          accountIdMap,
        );
      } catch (error) {
        this.logError("マージ処理でエラーが発生しました", error);
        throw error;
      }

      if (mergedRecords.length > 0) {
        const savedCount = await this.saveReports(mergedRecords);
        this.logInfo(`処理完了: ${savedCount} 件保存`);
        totalSaved = savedCount;
      } else {
        this.logWarn("マージされたレコードが0件のため、保存をスキップ");
      }

      return totalSaved;
    } catch (error) {
      if (error instanceof MediaError) {
        throw error;
      }
      throw new MediaError(
        ERROR_MESSAGES.FETCH_ERROR,
        ERROR_CODES.API_ERROR,
        ErrorType.API,
        { originalError: error },
      );
    }
  }

  /**
   * レポートAPIからメトリクスデータを取得（単一広告主対応）
   */
  private async fetchReportData(
    advertiserId: string,
    dateStr: string,
    headers: TikTokApiHeaders,
  ): Promise<TikTokAdReportDto[]> {
    const metrics = [
      "budget",
      "spend",
      "impressions",
      "clicks",
      "video_play_actions",
      "video_watched_2s",
      "video_watched_6s",
      "video_views_p100",
      "reach",
      "conversion",
      "advertiser_id",
      "campaign_id",
      "campaign_name",
      "adgroup_id",
      "adgroup_name",
      "ad_name",
      "ad_url",
    ];

    const dimensions = ["ad_id", "stat_time_day"];
    const requiredMetrics = ["campaign_id", "adgroup_id", "ad_name"];

    return this.fetchReportDataGeneric<TikTokAdReportDto>(
      advertiserId,
      dateStr,
      headers,
      metrics,
      dimensions,
      "AUCTION_AD",
      requiredMetrics,
      "広告",
    );
  }

  /**
   * レポートデータとステータスデータをバッチマージ
   */
  private mergeReportAndStatusDataBatch(
    reportData: TikTokAdReportDto[],
    allStatusData: Map<string, TikTokAdStatusItem[]>,
    accountIdMap: Map<string, number>,
  ): TikTokAdReport[] {
    // 全ステータスデータを統合
    const statusMap = new Map<string, TikTokAdStatusItem>();
    for (const [advertiserId, statusList] of allStatusData) {
      // 配列チェックを追加
      if (Array.isArray(statusList)) {
        for (const status of statusList) {
          statusMap.set(status.ad_id, status);
        }
      } else {
        this.logWarn(
          `ステータスデータが配列ではありません: advertiser=${advertiserId}, type=${typeof statusList}`,
        );
      }
    }

    // データ整合性チェック
    this.validateDataConsistency(reportData, statusMap, "ad_id", "Ad");

    // バッチ処理でメモリ使用量を削減
    const batchSize = 100;
    const mergedRecords: TikTokAdReport[] = [];

    for (let i = 0; i < reportData.length; i += batchSize) {
      const batch = reportData.slice(i, i + batchSize);

      try {
        const batchRecords = batch.map((dto) => {
          const status = statusMap.get(dto.dimensions.ad_id);
          return this.convertDtoToEntity(dto, accountIdMap, status);
        });

        mergedRecords.push(...batchRecords);
      } catch (error) {
        this.logError(`バッチ処理エラー (${i}-${i + batch.length}件目)`, error);
        throw error;
      }
    }

    return mergedRecords;
  }

  private convertDtoToEntity(
    dto: TikTokAdReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokAdStatusItem,
  ): TikTokAdReport {
    try {
      const now = getNowJstForDB();
      const advertiserId = dto.metrics.advertiser_id;
      const adAccountId = accountIdMap.get(advertiserId);

      if (!adAccountId) {
        this.logWarn(`AdAccount not found for advertiser_id: ${advertiserId}`);
      }

      if (!status) {
        this.logWarn(
          `Status not found for ad_id: ${dto.dimensions.ad_id}, using default values`,
        );
        // デフォルト値を設定して処理を継続
        return {
          ad_account_id: adAccountId ?? 0,
          ad_platform_account_id: advertiserId,
          platform_campaign_id: this.safeBigInt(dto.metrics.campaign_id),
          campaign_name: dto.metrics.campaign_name,
          platform_adgroup_id: this.safeBigInt(dto.metrics.adgroup_id),
          adgroup_name: dto.metrics.adgroup_name,
          platform_ad_id: this.safeBigInt(dto.dimensions.ad_id),
          ad_name: dto.metrics.ad_name,
          ad_url: dto.metrics.ad_url,
          stat_time_day: new Date(dto.dimensions.stat_time_day),
          budget: this.parseNumber(dto.metrics.budget),
          spend: this.parseNumber(dto.metrics.spend),
          impressions: this.parseNumber(dto.metrics.impressions),
          clicks: this.parseNumber(dto.metrics.clicks),
          video_play_actions: this.parseNumber(dto.metrics.video_play_actions),
          video_watched_2s: this.parseNumber(dto.metrics.video_watched_2s),
          video_watched_6s: this.parseNumber(dto.metrics.video_watched_6s),
          video_views_p100: this.parseNumber(dto.metrics.video_views_p100),
          reach: this.parseNumber(dto.metrics.reach),
          conversion: this.parseNumber(dto.metrics.conversion),
          status: "UNKNOWN",
          opt_status: "UNKNOWN",
          status_updated_time: now,
          created_at: now,
        };
      }

      return {
        ad_account_id: adAccountId ?? 0,
        ad_platform_account_id: advertiserId,
        platform_campaign_id: this.safeBigInt(dto.metrics.campaign_id),
        campaign_name: dto.metrics.campaign_name,
        platform_adgroup_id: this.safeBigInt(dto.metrics.adgroup_id),
        adgroup_name: dto.metrics.adgroup_name,
        platform_ad_id: this.safeBigInt(dto.dimensions.ad_id),
        ad_name: dto.metrics.ad_name,
        ad_url: dto.metrics.ad_url,
        stat_time_day: new Date(dto.dimensions.stat_time_day),
        budget: this.parseNumber(dto.metrics.budget),
        spend: this.parseNumber(dto.metrics.spend),
        impressions: this.parseNumber(dto.metrics.impressions),
        clicks: this.parseNumber(dto.metrics.clicks),
        video_play_actions: this.parseNumber(dto.metrics.video_play_actions),
        video_watched_2s: this.parseNumber(dto.metrics.video_watched_2s),
        video_watched_6s: this.parseNumber(dto.metrics.video_watched_6s),
        video_views_p100: this.parseNumber(dto.metrics.video_views_p100),
        reach: this.parseNumber(dto.metrics.reach),
        conversion: this.parseNumber(dto.metrics.conversion),
        status: status.secondary_status,
        opt_status: status.operation_status,
        status_updated_time: new Date(status.modify_time),
        created_at: now,
      };
    } catch (error) {
      this.logError(`convertDtoToEntity エラー`, error);
      throw error;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
