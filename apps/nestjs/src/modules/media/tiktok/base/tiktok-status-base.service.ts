import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import {
  TikTokStatusItem,
} from "../interfaces/tiktok-status-response.interface";
import { TikTokReportBaseService } from "./tiktok-report-base.service";
import {
  TikTokApiHeaders,
  TikTokGetApiResponse,
  TikTokPageInfo,
} from "../interfaces/tiktok-api.interface";

@Injectable()
export abstract class TikTokStatusBaseService extends TikTokReportBaseService {
  protected abstract readonly statusApiUrl: string;
  protected abstract readonly statusFields: string[];

  constructor(http: HttpService, serviceName: string) {
    super(http, serviceName);
  }

  /**
   * ステータスAPI（GET API）からデータを取得（ページネーション対応）
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
    reportData: any[],
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
   * レート制限対策のための遅延
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
