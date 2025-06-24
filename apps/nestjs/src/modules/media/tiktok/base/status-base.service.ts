import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TikTokStatusHistoryBase } from "../interfaces/status-history.interface";
import { ReportBaseService } from "./tiktok-report.base";
import {
  ApiHeaders,
  GetApiResponse,
  PageInfo,
} from "../interfaces/api.interface";
import { ValidationUtil } from "../utils/validation.util";
import { TikTokStatusItem } from "../interfaces/status.interface";

// HTTP設定の型定義
export interface HttpConfig {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * HTTP通信の抽象化インターフェース
 */
export interface IHttpClient {
  get<T>(url: string, config?: HttpConfig): Promise<{ data: T }>;
}

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

  /** ステータスAPIのバッチサイズ */
  private static readonly STATUS_BATCH_SIZE = 100;

  /** ステータスAPIの遅延時間（ミリ秒） */
  private static readonly STATUS_DELAY_MS = 50;

  constructor(http: HttpService, serviceName: string) {
    super(http, serviceName);
  }

  /**
   * HTTP通信を実行（テスト用にオーバーライド可能）
   */
  protected async executeHttpRequest<T>(
    url: string,
    config: HttpConfig,
  ): Promise<{ data: T }> {
    return firstValueFrom(this.http.get<T>(url, config));
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
        const response = await this.executeHttpRequest<GetApiResponse<T>>(
          this.statusApiUrl,
          { params, headers, timeout: this.TIMEOUT },
        );

        if (ValidationUtil.isValidStatusResponse<T>(response)) {
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
          await this.delay(StatusBaseService.STATUS_DELAY_MS);
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
    idField: "ad_id" | "adgroup_id" | "campaign_id" = "ad_id",
  ): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }

    const allStatusData: T[] = [];

    for (let i = 0; i < ids.length; i += StatusBaseService.STATUS_BATCH_SIZE) {
      const batchIds = ids.slice(i, i + StatusBaseService.STATUS_BATCH_SIZE);

      const params = {
        advertiser_id: advertiserId,
        [idField + "s"]: JSON.stringify(batchIds),
        fields: JSON.stringify(this.statusFields),
      };

      try {
        const response = await this.executeHttpRequest<GetApiResponse<T>>(
          this.statusApiUrl,
          { params, headers, timeout: this.TIMEOUT },
        );

        if (ValidationUtil.isValidStatusResponse<T>(response)) {
          allStatusData.push(...response.data.data.list);
        }

        if (i + StatusBaseService.STATUS_BATCH_SIZE < ids.length) {
          await this.delay(StatusBaseService.STATUS_DELAY_MS);
        }
      } catch (error) {
        this.logError(
          `ステータスデータ取得失敗 (advertiser=${advertiserId}, batch=${Math.floor(i / StatusBaseService.STATUS_BATCH_SIZE) + 1})`,
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
  protected groupIdsByAdvertiser<
    T extends {
      metrics: { advertiser_id: string };
      dimensions: Record<string, string>;
    },
  >(
    reportData: T[],
    idField: "ad_id" | "adgroup_id" | "campaign_id",
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
      dimensions: Record<string, string>;
    }[],
    idField: "ad_id" | "adgroup_id" | "campaign_id",
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
        // 他の広告主の処理は継続
        continue;
      }
    }

    return allStatusData;
  }
}
