import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { TikTokAccountService } from '../account.service';
import { TikTokCampaignReportService } from './report-campaign.service';
import { TikTokAdgroupReportService } from './report-adgroup.service';
import { TikTokAdReportService } from './report-ad.service';

/**
 * TikTok 統合レポートサービス
 * 各レベルのレポートサービスを統合管理
 */
@Injectable()
export class TikTokReportService {
  constructor(
    private readonly http: HttpService,
    private readonly tikTokAccountService: TikTokAccountService,
    private readonly campaignReportService: TikTokCampaignReportService,
    private readonly adgroupReportService: TikTokAdgroupReportService,
    private readonly adReportService: TikTokAdReportService,
  ) {}

  /**
   * 全レベルのレポートを並行取得・保存
   */
  public async fetchAllReports(): Promise<{
    campaign: number;
    adgroup: number;
    ad: number;
  }> {
    try {
      // 並行実行でパフォーマンス向上
      const [campaignCount, adgroupCount, adCount] = await Promise.all([
        this.campaignReportService.fetchAndInsertLogs(),
        this.adgroupReportService.fetchAndInsertLogs(),
        this.adReportService.fetchAndInsertLogs(),
      ]);

      return {
        campaign: campaignCount,
        adgroup: adgroupCount,
        ad: adCount,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 個別レベルのレポート取得
   */
  public async fetchCampaignReports(): Promise<number> {
    return this.campaignReportService.fetchAndInsertLogs();
  }

  public async fetchAdgroupReports(): Promise<number> {
    return this.adgroupReportService.fetchAndInsertLogs();
  }

  public async fetchAdReports(): Promise<number> {
    return this.adReportService.fetchAndInsertLogs();
  }
}
