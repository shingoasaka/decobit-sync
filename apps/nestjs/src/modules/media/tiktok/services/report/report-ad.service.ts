import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GenericReportService, ReportConfig } from './generic-report.service';
import { TikTokAccountService } from '../account.service';
import { TikTokAdRepository } from '../../repositories/report/report-ad.repository';
import { DataMapper } from '../../utils/data-mapper.util';
import {
  TikTokAdReportDto,
  TikTokAdMetrics,
} from '../../dtos/tiktok-report.dto';
import { TikTokAdReport } from '../../interfaces/report.interface';
import { TikTokAdStatusItem } from '../../interfaces/status-response.interface';

/**
 * TikTok 広告レポートサービス
 * ジェネリックサービスを活用した実装
 */
@Injectable()
export class TikTokAdReportService extends GenericReportService {
  // 抽象クラスの必須プロパティ
  protected readonly apiUrl =
    'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/';
  protected readonly statusApiUrl =
    'https://business-api.tiktok.com/open_api/v1.3/ad/get/';
  protected readonly statusFields = [
    'ad_id',
    'secondary_status',
    'operation_status',
    'modify_time',
  ];

  constructor(
    http: HttpService,
    tikTokAccountService: TikTokAccountService,
    private readonly adRepository: TikTokAdRepository,
  ) {
    super(http, tikTokAccountService);
  }

  /**
   * 広告レポート取得・保存
   */
  public async fetchAndInsertLogs(): Promise<number> {
    const config: ReportConfig<
      TikTokAdReport,
      TikTokAdStatusItem,
      TikTokAdReportDto
    > = {
      entityName: '広告',
      idField: 'ad_id',
      statusApiUrl: 'https://business-api.tiktok.com/open_api/v1.3/ad/get/',
      statusFields: [
        'ad_id',
        'secondary_status',
        'operation_status',
        'modify_time',
      ],
      apiUrl:
        'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/',
      metrics: [
        'budget',
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
        'ad_name',
        'ad_url',
        'campaign_id',
        'campaign_name',
        'adgroup_id',
        'adgroup_name',
      ],
      dimensions: ['ad_id', 'stat_time_day'],
      dataLevel: 'AUCTION_AD',
      requiredMetrics: ['ad_name'],
      repository: {
        save: (reports: TikTokAdReport[]) => this.adRepository.save(reports),
        getAccountMapping: (advertiserIds: string[]) =>
          this.adRepository.getAccountMapping(advertiserIds),
      },
      convertDtoToEntity: (dto, accountIdMap, status) =>
        this.convertDtoToEntity(dto, accountIdMap, status),
    };

    return super.fetchAndInsertLogs(config);
  }

  /**
   * レポート保存
   */
  public async saveReports(reports: TikTokAdReport[]): Promise<number> {
    if (!reports || reports.length === 0) {
      this.logDebug('処理対象のデータがありません');
      return 0;
    }

    try {
      const savedCount = await this.adRepository.save(reports);
      this.logInfo(`✅ ${savedCount} 件の広告レポートを保存しました`);
      return savedCount;
    } catch (error) {
      this.logError('広告レポートの保存に失敗しました', error);
      throw error;
    }
  }

  /**
   * DTOからエンティティへの変換
   */
  private convertDtoToEntity(
    dto: TikTokAdReportDto,
    accountIdMap: Map<string, number>,
    status?: TikTokAdStatusItem,
  ): TikTokAdReport | null {
    const accountId = this.getAccountId(
      dto.metrics.advertiser_id,
      accountIdMap,
    );
    if (accountId === null) {
      return null;
    }

    const commonMetrics = DataMapper.convertCommonMetrics(
      dto.metrics as TikTokAdMetrics,
    );
    const statusFields = DataMapper.convertStatusFields(status);

    return {
      ...commonMetrics,
      ad_account_id: accountId,
      ad_platform_account_id: dto.metrics.advertiser_id,
      stat_time_day: new Date(dto.dimensions.stat_time_day),
      ...statusFields,
      platform_campaign_id: this.safeBigInt(dto.metrics.campaign_id),
      campaign_name: dto.metrics.campaign_name,
      platform_adgroup_id: this.safeBigInt(dto.metrics.adgroup_id),
      adgroup_name: dto.metrics.adgroup_name,
      platform_ad_id: this.safeBigInt(dto.dimensions.ad_id),
      ad_name: dto.metrics.ad_name,
      ad_url: dto.metrics.ad_url,
    };
  }
}
