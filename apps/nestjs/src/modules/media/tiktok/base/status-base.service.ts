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
import { TikTokMetrics } from "../dtos/tiktok-report.dto";

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

      // デバッグログ: リクエストパラメータを出力
      this.logInfo(`Status API リクエスト: ${this.statusApiUrl}`);
      this.logInfo(`Status API パラメータ: ${JSON.stringify(params)}`);

      try {
        const response = await firstValueFrom(
          this.http.get<GetApiResponse<T>>(this.statusApiUrl, {
            params,
            headers,
            timeout: this.TIMEOUT,
          }),
        );

        // デバッグログ: レスポンスを出力
        this.logInfo(`Status API レスポンス: ${JSON.stringify({
          status: response.status,
          data_length: response?.data?.data?.list?.length || 0,
          first_item: response?.data?.data?.list?.[0] || null,
        })}`);

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
   * レポートデータを広告主別にグループ化
   */
  protected groupIdsByAdvertiser<T extends { 
    metrics: { advertiser_id: string }; 
    dimensions: Record<string, string> 
  }>(
    reportData: T[],
    idField: string,
  ): Map<string, string[]> {
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
  protected async processReportAndStatusData<T extends TikTokStatusItem>(
    allReportData: { 
      metrics: { advertiser_id: string }; 
      dimensions: Record<string, string> 
    }[],
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
  protected isValidReportDto<T extends { metrics: Record<string, unknown> }>(
    item: unknown,
    requiredMetrics: string[],
  ): item is T {
    if (!item || typeof item !== "object") {
      return false;
    }

    const obj = item as Record<string, unknown>;
    if (!obj.metrics || typeof obj.metrics !== "object") {
      return false;
    }

    const metrics = obj.metrics as Record<string, unknown>;
    return requiredMetrics.every((metric) => metrics[metric] !== undefined);
  }

  /**
   * 共通メトリクスの変換
   */
  protected convertCommonMetrics<T extends TikTokMetrics>(metrics: T) {
    return {
      spend: this.parseNumber(String(metrics.spend || "0")),
      impressions: this.parseNumber(String(metrics.impressions || "0")),
      clicks: this.parseNumber(String(metrics.clicks || "0")),
      video_play_actions: this.parseNumber(String(metrics.video_play_actions || "0")),
      video_watched_2s: this.parseNumber(String(metrics.video_watched_2s || "0")),
      video_watched_6s: this.parseNumber(String(metrics.video_watched_6s || "0")),
      video_views_p100: this.parseNumber(String(metrics.video_views_p100 || "0")),
      reach: this.parseNumber(String(metrics.reach || "0")),
      conversion: this.parseNumber(String(metrics.conversion || "0")),
      created_at: getNowJstForDB(),
    };
  }

  /**
   * ステータスフィールドの変換
   */
  protected convertStatusFields(status: TikTokStatusItem & { budget?: string | number } | undefined) {
    if (!status) {
      return {
        status: "UNKNOWN",
        opt_status: "UNKNOWN",
        status_updated_time: null,
        budget: 0,
      };
    }

    return {
      status: status.secondary_status,
      opt_status: status.operation_status,
      status_updated_time: new Date(status.modify_time || Date.now()),
      budget: status.budget ? this.parseNumber(status.budget) : 0,
    };
  }

  /**
   * アカウントIDの取得と検証
   */
  protected getAccountId(
    advertiserId: string,
    accountIdMap: Map<string, number>,
  ): number | null {
    const accountId = accountIdMap.get(advertiserId);
    if (!accountId) {
      this.logWarn(
        `アカウントIDが見つかりません: advertiser=${advertiserId}`,
      );
      return null;
    }
    return accountId;
  }
} 