import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { StatusBaseService } from "../../base/status-base.service";
import { TikTokAccountService } from "../account.service";
import { TikTokStatusItem } from "../../interfaces/status-response.interface";
import {
  MediaError,
  ErrorType,
  ERROR_CODES,
} from "../../../common/errors/media.error";
import { ERROR_MESSAGES } from "../../../common/errors/media.error";
import { ApiHeaders } from "../../interfaces/api.interface";
import { ValidationUtil } from "../../utils/validation.util";

// ジェネリック型定義
export interface ReportConfig<TReport, TStatus extends TikTokStatusItem, TDto> {
  entityName: string;
  idField: "ad_id" | "adgroup_id" | "campaign_id";
  statusApiUrl: string;
  statusFields: string[];
  apiUrl: string;
  metrics: string[];
  dimensions: string[];
  dataLevel: string;
  requiredMetrics: string[];
  repository: {
    save(reports: TReport[]): Promise<number>;
    getAccountMapping(advertiserIds: string[]): Promise<Map<string, number>>;
  };
  convertDtoToEntity(
    dto: TDto,
    accountIdMap: Map<string, number>,
    status?: TStatus,
  ): TReport | null;
}

export interface ReportMetrics {
  advertiser_id: string;
  budget: string;
  spend: string;
  impressions: string;
  clicks: string;
  video_play_actions: string;
  video_watched_2s: string;
  video_watched_6s: string;
  video_views_p100: string;
  reach: string;
  conversion: string;
}

export interface ReportDimensions {
  stat_time_day: string;
  [key: string]: string;
}

export interface ReportDto {
  metrics: ReportMetrics;
  dimensions: ReportDimensions;
}

// 型安全なステータスアイテムのID取得用インターフェース
export interface StatusItemWithId extends TikTokStatusItem {
  ad_id?: string;
  adgroup_id?: string;
  campaign_id?: string;
}

/**
 * ジェネリックレポートサービス
 * Campaign, AdGroup, Adの共通ロジックを統合
 */
@Injectable()
export abstract class GenericReportService extends StatusBaseService {
  constructor(
    http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
  ) {
    super(http, GenericReportService.name);
  }

  /**
   * 汎用的なレポート取得・保存処理
   */
  public async fetchAndInsertLogs<
    TReport,
    TStatus extends StatusItemWithId,
    TDto extends ReportDto,
  >(config: ReportConfig<TReport, TStatus, TDto>): Promise<number> {
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
        await config.repository.getAccountMapping(advertiserIds);
      const today = new Date();
      const todayStr = this.formatDate(today);
      this.validateDate(todayStr);

      this.logInfo(`本日(${todayStr})の${config.entityName}データを取得します`);

      const headers: ApiHeaders = {
        "Access-Token": process.env.TIKTOK_ACCESS_TOKEN!,
        "Content-Type": "application/json",
      };

      // レポートデータ取得
      const allReportData = await this.fetchAllReportData<TDto>(
        advertiserIds,
        todayStr,
        headers,
        config,
      );

      // ステータスデータ取得
      const allStatusData = await this.processReportAndStatusData<TStatus>(
        allReportData,
        config.idField,
        headers,
        config.entityName,
      );

      // データマージ
      const mergedRecords = this.mergeReportAndStatusDataBatch<
        TReport,
        TStatus,
        TDto
      >(allReportData, allStatusData, accountMapping, config);

      // 詳細ログ出力
      const reportDataCount = allReportData.length;
      const statusDataCount = Array.from(allStatusData.values()).reduce(
        (total, statusList) => total + statusList.length,
        0,
      );
      const mergedCount = mergedRecords.length;
      const failedCount = reportDataCount - mergedCount;

      this.logInfo(`📊 ${config.entityName}データマージ結果:`);
      this.logInfo(`  - レポートデータ取得: ${reportDataCount}件`);
      this.logInfo(`  - ステータスデータ取得: ${statusDataCount}件`);
      this.logInfo(`  - マージ成功: ${mergedCount}件`);
      if (failedCount > 0) {
        this.logWarn(`  - マージ失敗（ステータスなし）: ${failedCount}件`);
      }

      // 保存
      if (mergedRecords.length > 0) {
        const savedCount = await config.repository.save(mergedRecords);
        this.logInfo(
          `✅ ${savedCount} 件の${config.entityName}レポートを保存しました`,
        );
        return savedCount;
      } else {
        this.logWarn("マージされたレコードが0件のため、保存をスキップ");
        return 0;
      }
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
   * 全広告主のレポートデータを取得
   */
  private async fetchAllReportData<TDto extends ReportDto>(
    advertiserIds: string[],
    todayStr: string,
    headers: ApiHeaders,
    config: ReportConfig<unknown, StatusItemWithId, TDto>,
  ): Promise<TDto[]> {
    const allReportData: TDto[] = [];

    for (const advertiserId of advertiserIds) {
      try {
        const reportData = await this.fetchReportData(
          advertiserId,
          todayStr,
          headers,
          config,
        );
        allReportData.push(...reportData);
        await this.delay(100); // レート制限対策
      } catch (error) {
        this.logError(`レポート取得失敗 (advertiser=${advertiserId})`, error);
        continue;
      }
    }

    return allReportData;
  }

  /**
   * レポートデータとステータスデータのバッチマージ
   */
  private mergeReportAndStatusDataBatch<
    TReport,
    TStatus extends StatusItemWithId,
    TDto extends ReportDto,
  >(
    reportData: TDto[],
    allStatusData: Map<string, TStatus[]>,
    accountIdMap: Map<string, number>,
    config: ReportConfig<TReport, TStatus, TDto>,
  ): TReport[] {
    const mergedRecords: TReport[] = [];
    const statusMap = new Map<string, TStatus>();

    // ステータスデータをIDでマップ化
    for (const [, statusList] of allStatusData) {
      for (const status of statusList) {
        const id = this.getStatusItemId(status, config.idField);
        if (id) {
          statusMap.set(id, status);
        }
      }
    }

    // レポートデータとステータスデータをマージ
    for (const report of reportData) {
      const id = report.dimensions[config.idField];
      const status = statusMap.get(id);
      const entity = config.convertDtoToEntity(report, accountIdMap, status);

      if (entity) {
        mergedRecords.push(entity);
      }
    }

    return mergedRecords;
  }

  /**
   * ステータスアイテムからIDを安全に取得
   */
  private getStatusItemId(
    status: StatusItemWithId,
    idField: string,
  ): string | undefined {
    switch (idField) {
      case "ad_id":
        return status.ad_id;
      case "adgroup_id":
        return status.adgroup_id;
      case "campaign_id":
        return status.campaign_id;
      default:
        return undefined;
    }
  }

  /**
   * レポートデータ取得（具体的な実装）
   */
  protected async fetchReportData<TDto extends ReportDto>(
    advertiserId: string,
    dateStr: string,
    headers: ApiHeaders,
    config: ReportConfig<unknown, StatusItemWithId, TDto>,
  ): Promise<TDto[]> {
    this.validateDate(dateStr);
    this.validateMetrics(config.metrics);
    this.validateDimensions(config.dimensions);

    const params = {
      advertiser_ids: JSON.stringify([advertiserId]),
      report_type: "BASIC",
      dimensions: JSON.stringify(config.dimensions),
      metrics: JSON.stringify(config.metrics),
      start_date: dateStr,
      end_date: dateStr,
      primary_status: "STATUS_ALL",
      page: 1,
      page_size: 1000,
      data_level: config.dataLevel,
    };

    try {
      const responseData = await this.makeReportApiRequest<TDto>(
        params,
        headers,
      );
      const validData = responseData.list.filter((item: unknown) =>
        ValidationUtil.isValidReportDto(item, config.requiredMetrics),
      );

      this.logInfo(
        `${config.entityName}レポート取得完了: advertiser=${advertiserId}, 取得件数=${validData.length}`,
      );

      return validData;
    } catch (error) {
      this.logError(
        `${config.entityName}レポート取得失敗: advertiser=${advertiserId}`,
        error,
      );
      throw error;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  protected validateDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    return true;
  }
}
