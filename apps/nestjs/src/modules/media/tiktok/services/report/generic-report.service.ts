import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { StatusBaseService } from "../../base/status-base.service";
import { TikTokAccountService } from "../account.service";
import {
  MediaError,
  ErrorType,
  ERROR_CODES,
} from "../../../common/errors/media.error";
import { ERROR_MESSAGES } from "../../../common/errors/media.error";
import { ApiHeaders } from "../../interfaces/api.interface";
import { ValidationUtil } from "../../utils/validation.util";
import { TikTokStatusItem } from "../../interfaces/status.interface";
import { TikTokStatusHistoryBase } from "../../interfaces/status-history.interface";

// ジェネリック型定義
export interface ReportConfig<TReport, TStatus extends StatusItemWithId, TDto> {
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

// ステータス履歴リポジトリのインターフェース
export interface StatusHistoryRepository<T extends TikTokStatusHistoryBase> {
  saveStatusHistory(records: T[]): Promise<number>;
}

/**
 * ジェネリックレポートサービス
 * Campaign, AdGroup, Adの共通ロジックを統合
 */
@Injectable()
export abstract class GenericReportService<
  TStatusHistory extends TikTokStatusHistoryBase,
> extends StatusBaseService {
  constructor(
    http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
    private readonly statusHistoryRepository: StatusHistoryRepository<TStatusHistory>,
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

      // 保存
      if (mergedRecords.length > 0) {
        const savedCount = await config.repository.save(mergedRecords);
        this.logInfo(
          `✅ ${savedCount} 件の${config.entityName}レポートを保存しました`,
        );

        // ステータス履歴を保存（エラーが発生しても処理を継続）
        try {
          await this.saveStatusHistory(
            allStatusData,
            accountMapping,
            config.idField,
          );
        } catch (error) {
          this.logError(
            `${config.entityName}ステータス履歴保存でエラーが発生しましたが、処理を継続します`,
            error,
          );
        }

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

  /**
   * ステータス履歴を保存
   */
  private async saveStatusHistory<TStatus extends StatusItemWithId>(
    allStatusData: Map<string, TStatus[]>,
    accountIdMap: Map<string, number>,
    idField: string,
  ): Promise<void> {
    // ステータスデータが空の場合はスキップ
    if (allStatusData.size === 0) {
      this.logInfo(
        "ステータスデータが空のため、ステータス履歴の保存をスキップします",
      );
      return;
    }

    const now = new Date();
    let totalSaved = 0;
    let errorCount = 0;

    for (const [advertiserId, statusList] of allStatusData) {
      const accountId = accountIdMap.get(advertiserId);
      if (!accountId) {
        this.logWarn(
          `アカウントIDが見つかりません: advertiser=${advertiserId}`,
        );
        continue;
      }

      if (statusList.length === 0) {
        this.logInfo(
          `ステータスデータが空のため、advertiser=${advertiserId}の保存をスキップします`,
        );
        continue;
      }

      const statusHistoryRecords = statusList.map((status) => {
        const baseRecord = {
          ad_account_id: accountId,
          ad_platform_account_id: advertiserId,
          operation_status: status.operation_status,
          secondary_status: status.secondary_status,
          created_at: now,
        };

        // IDフィールドを動的に追加
        const idValue = this.getStatusItemId(status, idField);
        if (!idValue) {
          throw new Error(`IDが見つかりません: ${idField}`);
        }

        return {
          ...baseRecord,
          [this.getPlatformIdField(idField)]: idValue,
        } as TStatusHistory;
      });

      try {
        const savedCount =
          await this.statusHistoryRepository.saveStatusHistory(
            statusHistoryRecords,
          );
        totalSaved += savedCount;
        this.logInfo(
          `✅ advertiser=${advertiserId}: ${savedCount}件のステータス履歴を保存しました`,
        );
      } catch (error) {
        errorCount++;
        this.logError(
          `ステータス履歴保存失敗 (advertiser=${advertiserId})`,
          error,
        );
      }
    }

    if (totalSaved > 0) {
      this.logInfo(`✅ 合計${totalSaved}件のステータス履歴を保存しました`);
    }

    if (errorCount > 0) {
      this.logWarn(`${errorCount}件のステータス履歴保存でエラーが発生しました`);
    }
  }

  /**
   * IDフィールドからプラットフォームIDフィールド名を取得
   */
  private getPlatformIdField(idField: string): string {
    switch (idField) {
      case "ad_id":
        return "platform_ad_id";
      case "adgroup_id":
        return "platform_adgroup_id";
      case "campaign_id":
        return "platform_campaign_id";
      default:
        throw new Error(`Unknown idField: ${idField}`);
    }
  }
}
