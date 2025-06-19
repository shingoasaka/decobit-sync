import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { TikTokAdgroupReportDto } from "../../dtos/tiktok-report.dto";
import { TikTokAdgroupReport } from "../../interfaces/report.interface";
import { TikTokAdgroupStatusItem } from "../../interfaces/status-response.interface";
import { ApiHeaders } from "../../interfaces/api.interface";
import { StatusBaseService } from "../../base/status-base.service";
import { TikTokAccountService } from "../account.service";
import { TikTokAdgroupRepository } from "../../repositories/report/report-adgroup.repository";
import {
  MediaError,
  ErrorType,
  ERROR_CODES,
} from "../../../common/errors/media.error";
import { ERROR_MESSAGES } from "../../../common/errors/media.error";

/**
 * TikTok アドグループレポートサービス
 * ビジネスロジック（API呼び出し、データ変換、マージ）を担当
 */
@Injectable()
export class TikTokAdgroupReportService extends StatusBaseService {
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  protected readonly statusApiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/adgroup/get/";
  protected readonly statusFields = [
    "adgroup_id",
    "secondary_status",
    "operation_status",
    "modify_time",
    "budget",
  ];

  constructor(
    http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
    private readonly adGroupRepository: TikTokAdgroupRepository,
  ) {
    super(http, TikTokAdgroupReportService.name);
  }

  public async saveReports(reports: TikTokAdgroupReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug("処理対象のデータがありません");
      return 0;
    }

    try {
      return await this.adGroupRepository.save(reports);
    } catch (error) {
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

      if (!advertiserIds || advertiserIds.length === 0) {
        throw new MediaError(
          ERROR_MESSAGES.NO_ACCOUNT_IDS,
          ERROR_CODES.NO_ACCOUNT_IDS,
          ErrorType.BUSINESS,
        );
      }

      const accountMapping =
        await this.adGroupRepository.getAccountMapping(advertiserIds);

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
      const allReportData: TikTokAdgroupReportDto[] = [];
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
      const todayAdgroupIds = new Set<string>();
      for (const report of allReportData) {
        todayAdgroupIds.add(report.dimensions.adgroup_id);
      }

      this.logInfo(
        `今日のReportデータから ${todayAdgroupIds.size} 件のアドグループIDを抽出`,
      );

      // ステータスAPI: 今日のIDのみを指定して取得
      const allStatusData = await this.processReportAndStatusData<TikTokAdgroupStatusItem>(
        allReportData,
        "adgroup_id",
        headers,
        "アドグループ",
      );

      // データをマージしてRAWテーブルに保存
      let mergedRecords: TikTokAdgroupReport[] = [];
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
    reportData: TikTokAdgroupReportDto[],
    allStatusData: Map<string, TikTokAdgroupStatusItem[]>,
    accountIdMap: Map<string, number>,
  ): TikTokAdgroupReport[] {
    const mergedRecords: TikTokAdgroupReport[] = [];
    const statusMap = new Map<string, TikTokAdgroupStatusItem>();

    // ステータスデータをIDでマップ化
    for (const [, statusList] of allStatusData) {
      for (const status of statusList) {
        const id = status.adgroup_id;
        if (id) {
          statusMap.set(id, status);
        }
      }
    }

    // レポートデータとステータスデータをマージ
    for (const report of reportData) {
      const id = report.dimensions.adgroup_id;
      const status = statusMap.get(id);
      const entity = this.convertDtoToEntity(report, accountIdMap, status);

      if (entity) {
        mergedRecords.push(entity);
      }
    }

    this.logInfo(`アドグループデータマージ完了: 総件数=${mergedRecords.length}`);
    return mergedRecords;
  }

  private convertDtoToEntity(
    dto: TikTokAdgroupReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokAdgroupStatusItem,
  ): TikTokAdgroupReport | null {
    const accountId = this.getAccountId(dto.metrics.advertiser_id, accountIdMap);
    if (accountId === null) {
      return null;
    }

    const commonMetrics = this.convertCommonMetrics(dto.metrics as unknown as Record<string, string | number | undefined>);
    const statusFields = this.convertStatusFields(status);

    return {
      ...commonMetrics,
      ad_account_id: accountId,
      ad_platform_account_id: dto.metrics.advertiser_id,
      stat_time_day: new Date(dto.dimensions.stat_time_day),
      ...statusFields,
      platform_adgroup_id: this.safeBigInt(dto.dimensions.adgroup_id),
      adgroup_name: dto.metrics.adgroup_name,
      status: statusFields.secondary_status,
      opt_status: statusFields.operation_status,
      status_updated_time: new Date(statusFields.modify_time || Date.now()),
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
  ): Promise<TikTokAdgroupReportDto[]> {
    const metrics = [
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
      "adgroup_name",
    ];

    const dimensions = ["adgroup_id", "stat_time_day"];
    const requiredMetrics = ["adgroup_name"];

    return this.fetchReportDataGeneric<TikTokAdgroupReportDto>(
      advertiserId,
      dateStr,
      headers,
      metrics,
      dimensions,
      "AUCTION_ADGROUP",
      requiredMetrics,
      "アドグループ",
    );
  }
}
