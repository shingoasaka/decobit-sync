import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TikTokStatusItem } from "../interfaces/status-response.interface";
import { ReportBaseService } from "./report-base.service";
import {
  ApiHeaders,
  GetApiResponse,
  PageInfo,
} from "../interfaces/api.interface";
import { getNowJstForDB } from "src/libs/date-utils";

/**
 * TikTok ステータスAPI用ベースサービス
 * ステータスAPI（GET API）とレポートAPIを組み合わせた共通機能を提供
 */
@Injectable()
export abstract class StatusBaseService extends ReportBaseService {
  /** ステータスAPIのエンドポイントURL */
  protected abstract readonly statusApiUrl: string;

  /** ステータスAPIで取得するフィールド一覧 */
  protected abstract readonly statusFields: string[];

  constructor(http: HttpService, serviceName: string) {
    super(http, serviceName);
  }

  /**
   * ステータスAPI（GET API）からデータを取得（ページネーション対応）
   */
  protected async fetchStatusData<T extends TikTokStatusItem>(
    advertiserId: string,
    headers: ApiHeaders,
    pageSize: number = 1000,
  ): Promise<T[]> {
    const allStatusData: T[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const params = {
        advertiser_id: advertiserId,
        page_size: pageSize,
        page,
        fields: JSON.stringify(this.statusFields),
      };

      try {
        const response = await firstValueFrom(
          this.http.get<GetApiResponse<T>>(this.statusApiUrl, {
            params,
            headers,
            timeout: this.TIMEOUT,
          }),
        );

        if (
          response?.data?.data?.list &&
          Array.isArray(response.data.data.list)
        ) {
          allStatusData.push(...response.data.data.list);

          const pageInfo: PageInfo = response.data.data.page_info;
          hasNext = page < pageInfo.total_page;
          page += 1;
        } else {
          this.logWarn(
            `ステータスAPI レスポンスが不正: advertiser=${advertiserId}, page=${page}`,
          );
          break;
        }

        if (hasNext) {
          await this.delay(50);
        }
      } catch (error) {
        this.logError(
          `ステータスデータの取得に失敗: advertiser=${advertiserId}, page=${page}`,
          error,
        );
        break;
      }
    }

    this.logInfo(
      `ステータスAPI 完了: advertiser=${advertiserId}, 総件数=${allStatusData.length}`,
    );
    return allStatusData;
  }

  /**
   * 特定のIDリストでステータスデータを取得
   */
  protected async fetchStatusDataByIds<T extends TikTokStatusItem>(
    advertiserId: string,
    ids: string[],
    headers: ApiHeaders,
    idField: string = "ad_id",
  ): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }

    const allStatusData: T[] = [];
    const batchSize = 100;

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);

      const params = {
        advertiser_id: advertiserId,
        [idField + "s"]: JSON.stringify(batchIds),
        fields: JSON.stringify(this.statusFields),
      };

      try {
        const response = await firstValueFrom(
          this.http.get<GetApiResponse<T>>(this.statusApiUrl, {
            params,
            headers,
            timeout: this.TIMEOUT,
          }),
        );

        if (
          response?.data?.data?.list &&
          Array.isArray(response.data.data.list)
        ) {
          allStatusData.push(...response.data.data.list);
        }

        if (i + batchSize < ids.length) {
          await this.delay(50);
        }
      } catch (error) {
        this.logError(
          `ステータスデータ取得失敗 (advertiser=${advertiserId}, batch=${Math.floor(i / batchSize) + 1})`,
          error,
        );
        continue;
      }
    }

    return allStatusData;
  }

  /**
   * データ整合性チェック
   */
  protected validateDataConsistency<T extends TikTokStatusItem>(
    reportData: { dimensions: Record<string, string> }[],
    statusMap: Map<string, T>,
    idField: string,
    entityName: string,
  ): void {
    const reportIds = new Set(reportData.map((d) => d.dimensions[idField]));
    const statusIds = new Set(statusMap.keys());

    const missingStatus = Array.from(reportIds).filter(
      (id) => !statusIds.has(id),
    );

    if (missingStatus.length > 0) {
      this.logWarn(
        `データ不整合: ${missingStatus.length}件の${entityName}ステータスが見つかりません`,
      );
    } else {
      this.logInfo(
        `データ整合性チェック完了: 全${reportData.length}件の${entityName}ステータスが取得できました`,
      );
    }
  }

  /**
   * レポートデータを広告主別にグループ化
   */
  protected groupIdsByAdvertiser<
    T extends {
      metrics: { advertiser_id: string };
      dimensions: Record<string, string>;
    },
  >(reportData: T[], idField: string): Map<string, string[]> {
    const groupedIds = new Map<string, string[]>();

    for (const item of reportData) {
      const advertiserId = item.metrics.advertiser_id;
      const id = item.dimensions[idField];

      if (!groupedIds.has(advertiserId)) {
        groupedIds.set(advertiserId, []);
      }
      groupedIds.get(advertiserId)!.push(id);
    }

    return groupedIds;
  }

  /**
   * レポートデータとステータスデータの統合処理
   */
  protected async processReportAndStatusData<
    T extends TikTokStatusItem,
    R extends {
      metrics: { advertiser_id: string };
      dimensions: Record<string, string>;
    },
  >(
    allReportData: R[],
    idField: string,
    headers: ApiHeaders,
    entityName: string,
  ): Promise<Map<string, T[]>> {
    const groupedIds = this.groupIdsByAdvertiser(allReportData, idField);
    const allStatusData = new Map<string, T[]>();

    for (const [advertiserId, ids] of groupedIds) {
      try {
        const statusData = await this.fetchStatusDataByIds<T>(
          advertiserId,
          ids,
          headers,
          idField,
        );
        allStatusData.set(advertiserId, statusData);
      } catch (error) {
        this.logError(
          `ステータスデータ取得失敗 (advertiser=${advertiserId})`,
          error,
        );
        allStatusData.set(advertiserId, []);
      }
    }

    return allStatusData;
  }

  /**
   * レポートデータ取得の汎用メソッド
   */
  protected async fetchReportDataGeneric<T>(
    advertiserId: string,
    dateStr: string,
    headers: ApiHeaders,
    metrics: string[],
    dimensions: string[],
    dataLevel: string,
    requiredMetrics: string[],
    entityName: string,
  ): Promise<T[]> {
    this.validateDate(dateStr);
    this.validateMetrics(metrics);
    this.validateDimensions(dimensions);

    const params = {
      advertiser_ids: JSON.stringify([advertiserId]),
      report_type: "BASIC",
      dimensions: JSON.stringify(dimensions),
      metrics: JSON.stringify(metrics),
      start_date: dateStr,
      end_date: dateStr,
      primary_status: "STATUS_ALL",
      page: 1,
      page_size: 1000,
      data_level: dataLevel,
    };

    try {
      const responseData = await this.makeReportApiRequest<T>(params, headers);
      const validData = responseData.list.filter((item: unknown) =>
        this.isValidReportDto(item, requiredMetrics),
      );

      this.logInfo(
        `${entityName}レポート取得完了: advertiser=${advertiserId}, 取得件数=${validData.length}`,
      );

      return validData;
    } catch (error) {
      this.logError(
        `${entityName}レポート取得失敗: advertiser=${advertiserId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * レポートDTOの妥当性チェック
   */
  protected isValidReportDto<T extends { metrics: Record<string, any> }>(
    item: unknown,
    requiredMetrics: string[],
  ): item is T {
    if (!item || typeof item !== "object") {
      return false;
    }

    const obj = item as Record<string, any>;
    if (!obj.metrics || typeof obj.metrics !== "object") {
      return false;
    }

    return requiredMetrics.every((metric) => obj.metrics[metric] !== undefined);
  }

  /**
   * 共通メトリクスの変換
   */
  protected convertCommonMetrics(metrics: Record<string, string>) {
    return {
      advertiser_id: metrics.advertiser_id,
      spend: this.parseNumber(metrics.spend),
      impressions: this.parseNumber(metrics.impressions),
      clicks: this.parseNumber(metrics.clicks),
      video_play_actions: this.parseNumber(metrics.video_play_actions),
      video_watched_2s: this.parseNumber(metrics.video_watched_2s),
      video_watched_6s: this.parseNumber(metrics.video_watched_6s),
      video_views_p100: this.parseNumber(metrics.video_views_p100),
      reach: this.parseNumber(metrics.reach),
      conversion: this.parseNumber(metrics.conversion),
      stat_time_day: metrics.stat_time_day,
      created_at: getNowJstForDB(),
      updated_at: getNowJstForDB(),
    };
  }

  /**
   * DTOからエンティティへの共通変換
   */
  protected convertDtoToEntityCommon<T extends TikTokStatusItem>(
    dto: {
      metrics: { advertiser_id: string } & Record<string, any>;
      dimensions: Record<string, string>;
    },
    accountIdMap: Map<string, number>,
    status: T | undefined,
    idField: string,
    entityName: string,
    additionalFields: Record<string, any> = {},
  ): any {
    const accountId = accountIdMap.get(dto.metrics.advertiser_id);
    if (!accountId) {
      this.logWarn(
        `アカウントIDが見つかりません: advertiser=${dto.metrics.advertiser_id}`,
      );
      return null;
    }

    const commonMetrics = this.convertCommonMetrics(dto.metrics);
    const statusFields = status
      ? {
          secondary_status: status.secondary_status,
          operation_status: status.operation_status,
          modify_time: status.modify_time,
          budget: (status as any).budget
            ? this.parseNumber((status as any).budget)
            : 0,
        }
      : {
          secondary_status: "UNKNOWN",
          operation_status: "UNKNOWN",
          modify_time: "",
          budget: 0,
        };

    return {
      ...commonMetrics,
      account_id: accountId,
      ...statusFields,
      ...additionalFields,
    };
  }

  /**
   * レポートデータとステータスデータの共通マージ処理
   */
  protected mergeReportAndStatusDataCommon<
    T extends TikTokStatusItem,
    R extends {
      metrics: { advertiser_id: string } & Record<string, any>;
      dimensions: Record<string, string>;
    },
    E,
  >(
    reportData: R[],
    allStatusData: Map<string, T[]>,
    accountIdMap: Map<string, number>,
    idField: string,
    entityName: string,
    convertFunction: (
      dto: R,
      accountIdMap: Map<string, number>,
      status?: T,
    ) => E,
  ): E[] {
    const mergedRecords: E[] = [];
    const statusMap = new Map<string, T>();

    // ステータスデータをIDでマップ化
    for (const [advertiserId, statusList] of allStatusData) {
      for (const status of statusList) {
        const id = (status as any)[idField];
        if (id) {
          statusMap.set(id, status);
        }
      }
    }

    // レポートデータとステータスデータをマージ
    for (const report of reportData) {
      const id = report.dimensions[idField];
      const status = statusMap.get(id);
      const entity = convertFunction(report, accountIdMap, status);

      if (entity) {
        mergedRecords.push(entity);
      }
    }

    this.logInfo(
      `${entityName}データマージ完了: 総件数=${mergedRecords.length}`,
    );

    return mergedRecords;
  }
}
