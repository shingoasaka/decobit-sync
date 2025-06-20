import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GenericReportService, ReportConfig } from './generic-report.service';
import { TikTokAccountService } from '../account.service';
import { TikTokAdgroupRepository } from '../../repositories/report/report-adgroup.repository';
import { DataMapper } from '../../utils/data-mapper.util';
import {
  TikTokAdgroupReportDto,
  TikTokAdgroupMetrics,
} from '../../dtos/tiktok-report.dto';
import { TikTokAdgroupReport } from '../../interfaces/report.interface';
import { TikTokAdgroupStatusItem } from '../../interfaces/status-response.interface';

/**
 * TikTok 広告グループレポートサービス
 * ジェネリックサービスを活用した実装
 */
@Injectable()
export class TikTokAdgroupReportService extends GenericReportService {
  // 抽象クラスの必須プロパティ
  protected readonly apiUrl =
    'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/';
  protected readonly statusApiUrl =
    'https://business-api.tiktok.com/open_api/v1.3/adgroup/get/';
  protected readonly statusFields = [
    'adgroup_id',
    'secondary_status',
    'operation_status',
    'modify_time',
    'budget',
  ];

  constructor(
    http: HttpService,
    tikTokAccountService: TikTokAccountService,
    private readonly adgroupRepository: TikTokAdgroupRepository,
  ) {
    super(http, tikTokAccountService);
  }

  /**
   * 広告グループレポート取得・保存
   */
  public async fetchAndInsertLogs(): Promise<number> {
    const config: ReportConfig<
      TikTokAdgroupReport,
      TikTokAdgroupStatusItem,
      TikTokAdgroupReportDto
    > = {
      entityName: '広告グループ',
      idField: 'adgroup_id',
      statusApiUrl:
        'https://business-api.tiktok.com/open_api/v1.3/adgroup/get/',
      statusFields: [
        'adgroup_id',
        'secondary_status',
        'operation_status',
        'modify_time',
        'budget',
      ],
      apiUrl:
        'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/',
      metrics: [
        'spend',
        'impressions',
        'clicks',
        'video_play_actions',
        'video_watched_2s',
        'video_watched_6s',
        'video_views_p100',
        'reach',
        'conversion',
        'advertiser_id',
        'adgroup_name',
      ],
      dimensions: ['adgroup_id', 'stat_time_day'],
      dataLevel: 'AUCTION_ADGROUP',
      requiredMetrics: ['adgroup_name'],
      repository: {
        save: (reports: TikTokAdgroupReport[]) =>
          this.adgroupRepository.save(reports),
        getAccountMapping: (advertiserIds: string[]) =>
          this.adgroupRepository.getAccountMapping(advertiserIds),
      },
      convertDtoToEntity: (dto, accountIdMap, status) =>
        this.convertDtoToEntity(dto, accountIdMap, status),
    };

    return super.fetchAndInsertLogs(config);
  }

  /**
   * レポート保存
   */
  public async saveReports(reports: TikTokAdgroupReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug('処理対象のデータがありません');
      return 0;
    }

    try {
      const savedCount = await this.adgroupRepository.save(reports);
      this.logInfo(`✅ ${savedCount} 件の広告グループレポートを保存しました`);
      return savedCount;
    } catch (error) {
      this.logError('広告グループレポートの保存に失敗しました', error);
      throw error;
    }
  }

  /**
   * DTOからエンティティへの変換
   */
  private convertDtoToEntity(
    dto: TikTokAdgroupReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokAdgroupStatusItem,
  ): TikTokAdgroupReport | null {
    const accountId = this.getAccountId(
      dto.metrics.advertiser_id,
      accountIdMap,
    );
    if (accountId === null) {
      return null;
    }

    const commonMetrics = DataMapper.convertCommonMetrics(
      dto.metrics as TikTokAdgroupMetrics,
    );
    const statusFields = DataMapper.convertStatusFields(status);

    return {
      ...commonMetrics,
      ad_account_id: accountId,
      ad_platform_account_id: dto.metrics.advertiser_id,
      stat_time_day: new Date(dto.dimensions.stat_time_day),
      ...statusFields,
      platform_adgroup_id: this.safeBigInt(dto.dimensions.adgroup_id),
      adgroup_name: dto.metrics.adgroup_name,
    };
  }
}
