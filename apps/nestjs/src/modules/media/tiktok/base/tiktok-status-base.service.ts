import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TikTokStatusItem } from "../interfaces/tiktok-status-response.interface";
import { TikTokReportBaseService } from "./tiktok-report-base.service";
import {
  TikTokApiHeaders,
  TikTokGetApiResponse,
  TikTokPageInfo,
} from "../interfaces/tiktok-api.interface";

/**
 * TikTok ステータスAPI用ベースサービス
 *
 * このクラスは、TikTokのステータスAPI（GET API）とレポートAPIを組み合わせて
 * 効率的にデータを取得・処理するための共通機能を提供します。
 *
 * 主な機能:
 * - ステータスAPIからのデータ取得（ページネーション対応）
 * - レポートデータとステータスデータの統合
 * - データ整合性チェック
 * - レート制限対策
 *
 * 使用方法:
 * 各サービス（Ad, AdGroup, Campaign）でこのクラスを継承し、
 * 抽象プロパティ（statusApiUrl, statusFields）を実装してください。
 */
@Injectable()
export abstract class TikTokStatusBaseService extends TikTokReportBaseService {
  /** ステータスAPIのエンドポイントURL */
  protected abstract readonly statusApiUrl: string;

  /** ステータスAPIで取得するフィールド一覧 */
  protected abstract readonly statusFields: string[];

  constructor(http: HttpService, serviceName: string) {
    super(http, serviceName);
  }

  /**
   * ステータスAPI（GET API）からデータを取得（ページネーション対応）
   *
   * 指定された広告主の全ステータスデータをページネーションで取得します。
   * レート制限対策として、ページ間で50msの遅延を設けています。
   *
   * @param advertiserId - 広告主ID
   * @param headers - APIリクエストヘッダー
   * @param pageSize - 1ページあたりの取得件数（デフォルト: 1000）
   * @returns ステータスデータの配列
   *
   * @throws MediaError - APIエラー、認証エラー、タイムアウトエラー
   */
  protected async fetchStatusData<T extends TikTokStatusItem>(
    advertiserId: string,
    headers: TikTokApiHeaders,
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
          this.http.get<TikTokGetApiResponse<T>>(this.statusApiUrl, {
            params,
            headers,
            timeout: this.TIMEOUT,
          }),
        );

        // レスポンスの構造を確認
        if (
          response?.data?.data?.list &&
          Array.isArray(response.data.data.list)
        ) {
          allStatusData.push(...response.data.data.list);

          // ページネーション情報を確認
          const pageInfo: TikTokPageInfo = response.data.data.page_info;
          hasNext = page < pageInfo.total_page;
          page += 1;
        } else {
          this.logWarn(
            `ステータスAPI レスポンスが不正: advertiser=${advertiserId}, page=${page}`,
          );
          break;
        }

        // レート制限対策: ページ間で少し待機
        if (hasNext) {
          await this.delay(50);
        }
      } catch (error) {
        this.logError(
          `ステータスデータの取得に失敗: advertiser=${advertiserId}, page=${page}`,
          error,
        );
        // ステータス取得に失敗してもレポートデータは処理を継続
        break;
      }
    }

    this.logInfo(
      `ステータスAPI 完了: advertiser=${advertiserId}, 総件数=${allStatusData.length}`,
    );
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
   * 特定のIDリストでステータスデータを取得
   */
  protected async fetchStatusDataByIds<T extends TikTokStatusItem>(
    advertiserId: string,
    ids: string[],
    headers: TikTokApiHeaders,
    idField: string = "ad_id",
  ): Promise<T[]> {
    if (ids.length === 0) {
      return [];
    }

    const allStatusData: T[] = [];

    // バッチサイズ: TikTok APIの制限に応じて調整
    const batchSize = 100;

    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);

      const params = {
        advertiser_id: advertiserId,
        [idField + "s"]: JSON.stringify(batchIds), // ad_ids, adgroup_ids, campaign_ids
        fields: JSON.stringify(this.statusFields),
      };

      try {
        const response = await firstValueFrom(
          this.http.get<TikTokGetApiResponse<T>>(this.statusApiUrl, {
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

        // レート制限対策: バッチ間で少し待機
        if (i + batchSize < ids.length) {
          await this.delay(50);
        }
      } catch (error) {
        this.logError(
          `ステータスデータ取得失敗 (advertiser=${advertiserId}, batch=${Math.floor(i / batchSize) + 1})`,
          error,
        );
        // 一部のバッチで失敗しても継続
        continue;
      }
    }

    this.logInfo(
      `ステータスAPI (ID指定) 完了: advertiser=${advertiserId}, 要求ID数=${ids.length}, 取得件数=${allStatusData.length}`,
    );
    return allStatusData;
  }

  /**
   * レート制限対策のための遅延
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 汎用的なレポートDTOの型ガード
   *
   * @param item - チェック対象のアイテム
   * @param requiredMetrics - 必須のメトリクスフィールド
   * @returns 型ガードの結果
   */
  protected isValidReportDto<T extends { metrics: Record<string, any> }>(
    item: unknown,
    requiredMetrics: string[],
  ): item is T {
    if (
      typeof item !== "object" ||
      item === null ||
      !("metrics" in item) ||
      typeof (item as any).metrics !== "object" ||
      (item as any).metrics === null
    ) {
      return false;
    }

    const metrics = (item as any).metrics;
    return requiredMetrics.every((field) => field in metrics);
  }

  /**
   * 共通メトリクスの変換処理
   *
   * @param metrics - メトリクスオブジェクト
   * @returns 変換されたメトリクス
   */
  protected convertCommonMetrics(metrics: Record<string, string>) {
    return {
      budget: this.parseNumber(metrics.budget),
      spend: this.parseNumber(metrics.spend),
      impressions: this.parseNumber(metrics.impressions),
      clicks: this.parseNumber(metrics.clicks),
      video_play_actions: this.parseNumber(metrics.video_play_actions),
      video_watched_2s: this.parseNumber(metrics.video_watched_2s),
      video_watched_6s: this.parseNumber(metrics.video_watched_6s),
      video_views_p100: this.parseNumber(metrics.video_views_p100),
      reach: this.parseNumber(metrics.reach),
      conversion: this.parseNumber(metrics.conversion),
    };
  }

  /**
   * ReportデータからIDを抽出し、広告主ごとにグループ化
   */
  protected groupIdsByAdvertiser<
    T extends {
      metrics: { advertiser_id: string };
      dimensions: Record<string, string>;
    },
  >(reportData: T[], idField: string): Map<string, string[]> {
    const advertiserIds = new Map<string, string[]>();
    for (const report of reportData) {
      const advertiserId = report.metrics.advertiser_id;
      const id = report.dimensions[idField];
      if (!advertiserIds.has(advertiserId)) {
        advertiserIds.set(advertiserId, []);
      }
      advertiserIds.get(advertiserId)!.push(id);
    }
    return advertiserIds;
  }

  /**
   * ReportデータからIDを抽出し、ステータスデータを取得
   *
   * レポートAPIで取得したデータからIDを抽出し、そのIDを使用して
   * ステータスAPIからデータを効率的に取得します。
   *
   * 処理フロー:
   * 1. レポートデータからIDを抽出し、広告主ごとにグループ化
   * 2. 各広告主に対して、抽出したIDのみでステータスAPIを呼び出し
   * 3. レート制限対策として、広告主間で100msの遅延を設ける
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
    headers: TikTokApiHeaders,
    entityName: string,
  ): Promise<Map<string, T[]>> {
    // ID抽出とグループ化
    const advertiserIds = this.groupIdsByAdvertiser(allReportData, idField);

    this.logInfo(
      `今日のReportデータから ${allReportData.length} 件の${entityName}IDを抽出`,
    );

    // ステータス取得
    const allStatusData = new Map<string, T[]>();
    for (const [advertiserId, ids] of advertiserIds) {
      try {
        const statusData = await this.fetchStatusDataByIds<T>(
          advertiserId,
          ids,
          headers,
          idField,
        );
        allStatusData.set(advertiserId, statusData);

        // レート制限対策: 広告主間で少し待機
        await this.delay(100);
      } catch (error) {
        this.logError(`ステータス取得失敗 (advertiser=${advertiserId})`, error);
        // 他の広告主の処理は継続
        continue;
      }
    }

    return allStatusData;
  }

  protected async fetchReportDataGeneric<T>(
    advertiserId: string,
    dateStr: string,
    headers: TikTokApiHeaders,
    metrics: string[],
    dimensions: string[],
    dataLevel: string,
    requiredMetrics: string[],
    entityName: string,
  ): Promise<T[]> {
    this.validateMetrics(metrics);
    this.validateDimensions(dimensions);

    const allReportData: T[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const params = {
        advertiser_ids: JSON.stringify([advertiserId]),
        report_type: "BASIC",
        dimensions: JSON.stringify(dimensions),
        metrics: JSON.stringify(metrics),
        data_level: dataLevel,
        start_date: dateStr,
        end_date: dateStr,
        primary_status: "STATUS_ALL",
        page,
        page_size: 1000,
      };

      try {
        const response = await this.makeReportApiRequest<T>(params, headers);
        const list = response.list ?? [];

        if (list.length > 0) {
          // 型安全な変換
          const filteredData = list.filter((item): item is T =>
            this.isValidReportDto(item, requiredMetrics),
          );

          allReportData.push(...filteredData);
        }

        // より正確なページネーション判定
        const pageInfo = response.page_info;
        if (pageInfo?.total_page) {
          hasNext = page < pageInfo.total_page;
        } else {
          hasNext = pageInfo?.has_next ?? false;
        }

        page += 1;

        // レート制限対策: ページ間で少し待機
        if (hasNext) {
          await this.delay(50);
        }
      } catch (error) {
        this.logError(
          `レポートAPI エラー (advertiser=${advertiserId}, page=${page})`,
          error,
        );
        break;
      }
    }

    this.logInfo(
      `レポートAPI 完了: advertiser=${advertiserId}, 総件数=${allReportData.length}`,
    );
    return allReportData;
  }
}
