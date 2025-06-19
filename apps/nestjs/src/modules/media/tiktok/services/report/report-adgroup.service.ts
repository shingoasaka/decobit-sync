import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { TikTokAdGroupRepository } from "../../repositories/report/report-adgroup.repository";
import { TikTokAdgroupReport } from "../../interfaces/report.interface";
import { TikTokAdgroupReportDto } from "../../dtos/tiktok-report.dto";
import { getNowJstForDB } from "src/libs/date-utils";
import { TikTokAccountService } from "../account.service";
import { PrismaService } from "@prismaService";
import { TikTokReportBase } from "../../base/tiktok-report.base";
import {
  MediaError,
  ERROR_MESSAGES,
  ERROR_CODES,
  ErrorType,
} from "../../../common/errors/media.error";
import { TikTokAdgroupStatusResponse, TikTokAdgroupStatusItem } from "../../interfaces/tiktok-status-response.interface";
import { TikTokStatusBaseService } from "../../base/tiktok-status-base.service";

@Injectable()
export class TikTokAdgroupReportService extends TikTokStatusBaseService {
  protected readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
  protected readonly statusApiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/adgroup/get/";
  protected readonly statusFields = [
    "adgroup_id",
    "secondary_status",
    "operation_status",
    "modify_time",
  ];

  constructor(
    private readonly adgroupRepository: TikTokAdGroupRepository,
    http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
    private readonly prisma: PrismaService,
  ) {
    super(http, TikTokAdgroupReportService.name);
  }

  async saveReports(reports?: TikTokAdgroupReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug("処理対象のデータがありません");
      return 0;
    }

    try {
      const savedCount = await this.adgroupRepository.save(reports);
      this.logInfo(`✅ ${savedCount} 件のアドグループレポートを保存しました`);
      return savedCount;
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

      if (!advertiserIds || advertiserIds.length === 0) {
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

      const headers = {
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

      // ステータスAPI: 各広告主を個別に処理
      const allStatusData = new Map<string, TikTokAdgroupStatusItem[]>();
      for (const advertiserId of advertiserIds) {
        try {
          const statusData = await this.fetchStatusData<TikTokAdgroupStatusItem>(
            advertiserId,
            headers,
          );
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

  private convertDtoToEntity(
    dto: TikTokAdgroupReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokAdgroupStatusItem,
  ): TikTokAdgroupReport {
    const now = getNowJstForDB();
    const advertiserId = dto.metrics.advertiser_id;
    const adAccountId = accountIdMap.get(advertiserId);

    if (!adAccountId) {
      this.logWarn(`AdAccount not found for advertiser_id: ${advertiserId}`);
    }

    if (!status) {
      this.logWarn(
        `Status not found for adgroup_id: ${dto.dimensions.adgroup_id}, using default values`,
      );
      // デフォルト値を設定して処理を継続
      return {
        ad_account_id: adAccountId ?? 0,
        ad_platform_account_id: advertiserId,
        platform_adgroup_id: this.safeBigInt(dto.dimensions.adgroup_id),
        adgroup_name: dto.metrics.adgroup_name,
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
      platform_adgroup_id: this.safeBigInt(dto.dimensions.adgroup_id),
      adgroup_name: dto.metrics.adgroup_name,
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
    headers: any,
  ): Promise<TikTokAdgroupReportDto[]> {
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
      "adgroup_name",
    ];

    const dimensions = ["adgroup_id", "stat_time_day"];

    this.validateMetrics(metrics);
    this.validateDimensions(dimensions);

    const allReportData: TikTokAdgroupReportDto[] = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const params = {
        advertiser_ids: JSON.stringify([advertiserId]),
        report_type: "BASIC",
        dimensions: JSON.stringify(dimensions),
        metrics: JSON.stringify(metrics),
        data_level: "AUCTION_ADGROUP",
        start_date: dateStr,
        end_date: dateStr,
        primary_status: "STATUS_ALL",
        page,
        page_size: 200, // 1000から200に削減（タイムアウト対策）
      };

      try {
        this.logDebug(`レポートAPI: advertiser=${advertiserId}, page=${page}`);

        const response = await this.makeApiRequest(params, headers);
        const list = response.list ?? [];

        if (list.length > 0) {
          // 型安全な変換 - TikTokAdgroupReportDtoのみを処理
          const adgroupReportData = list.filter(
            (item): item is TikTokAdgroupReportDto => {
              const metrics = item.metrics as any;
              return metrics.adgroup_name !== undefined;
            },
          );

          allReportData.push(...adgroupReportData);
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
   * レポートデータとステータスデータをバッチマージ
   */
  private mergeReportAndStatusDataBatch(
    reportData: TikTokAdgroupReportDto[],
    allStatusData: Map<string, TikTokAdgroupStatusItem[]>,
    accountIdMap: Map<string, number>,
  ): TikTokAdgroupReport[] {
    // 全ステータスデータを統合
    const statusMap = new Map<string, TikTokAdgroupStatusItem>();
    for (const [advertiserId, statusList] of allStatusData) {
      // 配列チェックを追加
      if (Array.isArray(statusList)) {
        for (const status of statusList) {
          statusMap.set(status.adgroup_id, status);
        }
      } else {
        this.logWarn(
          `ステータスデータが配列ではありません: advertiser=${advertiserId}, type=${typeof statusList}`,
        );
      }
    }

    // データ整合性チェック
    this.validateDataConsistency(reportData, statusMap, 'adgroup_id', 'AdGroup');

    // バッチ処理でメモリ使用量を削減
    const batchSize = 100;
    const mergedRecords: TikTokAdgroupReport[] = [];

    for (let i = 0; i < reportData.length; i += batchSize) {
      const batch = reportData.slice(i, i + batchSize);

      try {
        const batchRecords = batch.map((dto) => {
          const status = statusMap.get(dto.dimensions.adgroup_id);
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
} 