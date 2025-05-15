import { Injectable, Logger } from "@nestjs/common";
import { DimCampaignService } from "./dim-campaign.service";
import { DimAdgroupService } from "./dim-adgroup.service";
import { DimAdService } from "./dim-ad.service";
import { TikTokRawReportAd } from "../../interface/tiktok-report.interface";

@Injectable()
export class DimExecService {
  private readonly logger = new Logger(DimExecService.name);

  constructor(
    private readonly dimCampaignService: DimCampaignService,
    private readonly dimAdgroupService: DimAdgroupService,
    private readonly dimAdService: DimAdService,
  ) {}

  async execute(records: TikTokRawReportAd[]): Promise<void> {
    this.logger.log(
      `ディメンション更新を開始します。対象レコード数: ${records.length}`,
    );

    await this.dimCampaignService.upsertMany(
      records.map((r) => ({
        campaign_id: r.campaign_id,
        advertiser_id: r.advertiser_id,
        campaign_name: r.campaign_name ?? "",
      })),
    );

    await this.dimAdgroupService.upsertMany(
      records.map((r) => ({
        adgroup_id: r.adgroup_id,
        adgroup_name: r.adgroup_name ?? "",
        advertiser_id: r.advertiser_id,
        campaign_id: r.campaign_id,
      })),
    );

    await this.dimAdService.upsertMany(
      records.map((r) => ({
        ad_id: r.ad_id,
        ad_name: r.ad_name ?? "",
        advertiser_id: r.advertiser_id,
        adgroup_id: r.adgroup_id,
      })),
    );

    this.logger.log(
      `ディメンション更新完了: campaigns=${new Set(records.map((r) => r.campaign_id)).size}, ` +
        `adgroups=${new Set(records.map((r) => r.adgroup_id)).size}, ` +
        `ads=${new Set(records.map((r) => r.ad_id)).size}`,
    );
  }
}
