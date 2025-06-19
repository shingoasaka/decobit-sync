import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { TikTokAdReportDto } from "../../dtos/tiktok-report.dto";
import { TikTokAdReport } from "../../interfaces/report.interface";
import { getNowJstForDB } from "src/libs/date-utils";
import { TikTokAdRepository } from "../../repositories/report/report-ad.repository";
import { TikTokAccountService } from "../account.service";
import { PrismaService } from "@prismaService";
import {
  TikTokReportBase,
  TikTokApiHeaders,
} from "../../base/tiktok-report.base";
import {
  MediaError,
  ErrorType,
  ERROR_CODES,
} from "../../../common/errors/media.error";
import { ERROR_MESSAGES } from "../../../common/errors/media.error";
import { firstValueFrom } from "rxjs";

interface TikTokStatusResponse {
  data: {
    list: Array<{
      ad_id: string;
      secondary_status: string;
      operation_status: string;
      modify_time: string;
    }>;
    page_info: {
      total_number: number;
      page: number;
      page_size: number;
      total_page: number;
    };
  };
}

@Injectable()
export class TikTokAdReportService extends TikTokReportBase {
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  private readonly statusApiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/ad/get/";

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

      // レポートAPI: 各広告主を個別に処理（配列処理だと1つでもデータがないと全体が失敗するため）
      const allReportData: TikTokAdReportDto[] = [];
      for (const advertiserId of advertiserIds) {
        try {
          this.logInfo(`レポートAPI処理: advertiser=${advertiserId}`);
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

      // ステータスAPI: 各広告主を個別に処理（API制限のため）
      const allStatusData = new Map<
        string,
        TikTokStatusResponse["data"]["list"]
      >();
      for (const advertiserId of advertiserIds) {
        try {
          const statusData = await this.fetchAdStatus(advertiserId, headers);
          allStatusData.set(advertiserId, statusData);

          // レート制限対策: 広告主間で少し待機
          await this.delay(100);
        } catch (error) {
          this.logError(
            `ステータス取得失敗 (advertiser=${advertiserId})`,
            error,
          );
          // 他の広告主の処理は継続
          continue;
        }
      }

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

    this.validateMetrics(metrics);
    this.validateDimensions(dimensions);

    const allReportData: TikTokAdReportDto[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const params = {
        advertiser_ids: JSON.stringify([advertiserId]),
        report_type: "BASIC",
        dimensions: JSON.stringify(dimensions),
        metrics: JSON.stringify(metrics),
        data_level: "AUCTION_AD",
        start_date: dateStr,
        end_date: dateStr,
        primary_status: "STATUS_ALL",
        page,
        page_size: 1000,
      };

      try {
        this.logDebug(`レポートAPI: advertiser=${advertiserId}, page=${page}`);

        const response = await this.makeApiRequest(params, headers);
        const list = response.list ?? [];

        if (list.length > 0) {
          // 型安全な変換 - TikTokAdReportDtoのみを処理
          const adReportData = list.filter(
            (item): item is TikTokAdReportDto => {
              const metrics = item.metrics as any;
              return (
                metrics.campaign_id !== undefined &&
                metrics.adgroup_id !== undefined &&
                metrics.ad_name !== undefined
              );
            },
          );

          allReportData.push(...adReportData);
        }

        hasNext = response.page_info?.has_next ?? false;
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

    return allReportData;
  }

  /**
   * ad/get APIからステータスデータを取得
   * 注意: レポートAPIとは異なるパラメータ形式のため、直接HttpServiceを使用
   */
  private async fetchAdStatus(
    advertiserId: string,
    headers: TikTokApiHeaders,
  ): Promise<TikTokStatusResponse["data"]["list"]> {
    const params = {
      advertiser_id: advertiserId,
      page_size: 1000,
      fields: JSON.stringify([
        "ad_id",
        "secondary_status",
        "operation_status",
        "modify_time",
      ]),
    };

    try {
      this.logDebug(`ステータスAPI: advertiser=${advertiserId}`);

      // ステータスAPIはレポートAPIと異なるパラメータ形式のため直接HttpServiceを使用
      const response = await firstValueFrom(
        this.http.get<TikTokStatusResponse>(this.statusApiUrl, {
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
        this.logInfo(
          `ステータスAPI 成功: advertiser=${advertiserId}, list.length=${response.data.data.list.length}`,
        );
        return response.data.data.list;
      } else {
        this.logWarn(
          `ステータスAPI レスポンスが不正: advertiser=${advertiserId}`,
        );
        return [];
      }
    } catch (error) {
      this.logError(
        `ステータスデータの取得に失敗: advertiser=${advertiserId}`,
        error,
      );
      // ステータス取得に失敗してもレポートデータは処理を継続
      return [];
    }
  }

  /**
   * レポートデータとステータスデータをバッチマージ
   */
  private mergeReportAndStatusDataBatch(
    reportData: TikTokAdReportDto[],
    allStatusData: Map<string, TikTokStatusResponse["data"]["list"]>,
    accountIdMap: Map<string, number>,
  ): TikTokAdReport[] {
    // 全ステータスデータを統合
    const statusMap = new Map<
      string,
      TikTokStatusResponse["data"]["list"][0]
    >();
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

  /**
   * レート制限対策のための遅延
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private convertDtoToEntity(
    dto: TikTokAdReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokStatusResponse["data"]["list"][0],
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
      this.logError(`convertDtoToEntity エラー: ${JSON.stringify(dto)}`, error);
      throw error;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
