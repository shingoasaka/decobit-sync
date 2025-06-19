import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import {
  TikTokAdReportDto,
  TikTokAdMetrics,
} from "../../dtos/tiktok-report.dto";
import { TikTokAdReport } from "../../interfaces/report.interface";
import { TikTokAdStatusItem } from "../../interfaces/status-response.interface";
import { ApiHeaders } from "../../interfaces/api.interface";
import { StatusBaseService } from "../../base/status-base.service";
import { TikTokAccountService } from "../account.service";
import { TikTokAdRepository } from "../../repositories/report/report-ad.repository";
import {
  MediaError,
  ErrorType,
  ERROR_CODES,
} from "../../../common/errors/media.error";
import { ERROR_MESSAGES } from "../../../common/errors/media.error";
import { DataMapper } from "../../utils/data-mapper.util";

/**
 * TikTok 広告レポートサービス
 * ビジネスロジック（API呼び出し、データ変換、マージ）を担当
 */
@Injectable()
export class TikTokAdReportService extends StatusBaseService {
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
    http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
    private readonly adRepository: TikTokAdRepository,
  ) {
    super(http, TikTokAdReportService.name);
  }

  public async saveReports(reports: TikTokAdReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug("処理対象のデータがありません");
      return 0;
    }

    try {
      const savedCount = await this.adRepository.save(reports);
      this.logInfo(`✅ ${savedCount} 件の広告レポートを保存しました`);
      return savedCount;
    } catch (error) {
      this.logError("広告レポートの保存に失敗しました", error);
      throw new MediaError(
        ERROR_MESSAGES.SAVE_ERROR,
        ERROR_CODES.SAVE_ERROR,
        ErrorType.BUSINESS,
        { originalError: error },
      );
    }
  }

  public async fetchAndInsertLogs(): Promise<number> {
    try {
      const advertiserIds = await this.tikTokAccountService.getAccountIds();
      if (advertiserIds.length === 0) {
        throw new MediaError(
          ERROR_MESSAGES.NO_ACCOUNT_IDS,
          ERROR_CODES.NO_ACCOUNT_IDS,
          ErrorType.BUSINESS,
        );
      }

      const accountMapping =
        await this.adRepository.getAccountMapping(advertiserIds);

      const accountIdMap = accountMapping;

      const today = new Date();
      const todayStr = this.formatDate(today);
      this.validateDate(todayStr);

      this.logInfo(`本日(${todayStr})のデータを取得します`);

      const headers: ApiHeaders = {
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
      const allStatusData =
        await this.processReportAndStatusData<TikTokAdStatusItem>(
          allReportData,
          "ad_id",
          headers,
          "広告",
        );

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
   * レポートデータとステータスデータをバッチマージ
   */
  private mergeReportAndStatusDataBatch(
    reportData: TikTokAdReportDto[],
    allStatusData: Map<string, TikTokAdStatusItem[]>,
    accountIdMap: Map<string, number>,
  ): TikTokAdReport[] {
    const mergedRecords: TikTokAdReport[] = [];
    const statusMap = new Map<string, TikTokAdStatusItem>();

    // ステータスデータをIDでマップ化
    let totalStatusItems = 0;
    for (const [advertiserId, statusList] of allStatusData) {
      totalStatusItems += statusList.length;
      for (const status of statusList) {
        const id = status.ad_id;
        if (id) {
          statusMap.set(id, status);
        }
      }
    }

    // レポートデータとステータスデータをマージ
    let matchedCount = 0;
    let unmatchedCount = 0;
    for (const report of reportData) {
      const id = report.dimensions.ad_id;
      const status = statusMap.get(id);

      if (status) {
        matchedCount++;
      } else {
        unmatchedCount++;
      }

      const entity = this.convertDtoToEntity(report, accountIdMap, status);

      if (entity) {
        mergedRecords.push(entity);
      }
    }

    this.logInfo(
      `広告データマージ完了: 総件数=${mergedRecords.length}, マッチ件数=${matchedCount}, 未マッチ件数=${unmatchedCount}`,
    );
    return mergedRecords;
  }

  private convertDtoToEntity(
    dto: TikTokAdReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokAdStatusItem,
  ): TikTokAdReport | null {
    const accountId = this.getAccountId(
      dto.metrics.advertiser_id,
      accountIdMap,
    );
    if (accountId === null) {
      return null;
    }

    const commonMetrics = DataMapper.convertCommonMetrics(
      dto.metrics as TikTokAdMetrics,
    );
    const statusFields = DataMapper.convertStatusFields(status);

    return {
      ...commonMetrics,
      ad_account_id: accountId,
      ad_platform_account_id: dto.metrics.advertiser_id,
      stat_time_day: new Date(dto.dimensions.stat_time_day),
      ...statusFields,
      platform_campaign_id: this.safeBigInt(dto.metrics.campaign_id),
      campaign_name: dto.metrics.campaign_name,
      platform_adgroup_id: this.safeBigInt(dto.metrics.adgroup_id),
      adgroup_name: dto.metrics.adgroup_name,
      platform_ad_id: this.safeBigInt(dto.dimensions.ad_id),
      ad_name: dto.metrics.ad_name,
      ad_url: dto.metrics.ad_url,
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * レポートAPIからメトリクスデータを取得（単一広告主対応）
   */
  private async fetchReportData(
    advertiserId: string,
    dateStr: string,
    headers: ApiHeaders,
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
}
