import { Injectable, Logger } from "@nestjs/common";
import { DimCampaignRepository } from "../repositories/campaign.repository";

@Injectable()
export class DimCampaignService {
  private readonly logger = new Logger(DimCampaignService.name);

  constructor(private readonly repository: DimCampaignRepository) {}

  async upsertMany(
    campaigns: {
      campaign_id: string;
      advertiser_id: string;
      campaign_name?: string;
    }[],
  ): Promise<void> {
    if (!campaigns.length) {
      this.logger.debug("処理対象のキャンペーンデータがありません");
      return;
    }

    try {
      await this.repository.createMany(campaigns);
      this.logger.log(
        `${campaigns.length} 件のキャンペーンデータを挿入しました (重複はスキップ)`,
      );
    } catch (error) {
      this.logger.error(
        "キャンペーンデータの保存に失敗しました",
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
