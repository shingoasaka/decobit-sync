import { Injectable, Logger } from "@nestjs/common";
import { CampaignRepository } from "../repositories/campaign.repository";
import {
  CampaignData,
  PlatformType,
  SyncResult,
} from "../../interfaces/master-data.interface";

/**
 * Campaignマスターデータの共通Service
 * 全媒体共通のCampaign同期処理
 */
@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(private readonly campaignRepository: CampaignRepository) {}

  /**
   * レポートデータからCampaignを同期
   * @param platform プラットフォーム種別
   * @param data Campaignデータ配列
   * @returns 同期結果
   */
  async syncFromReport(
    platform: PlatformType,
    data: CampaignData[],
  ): Promise<SyncResult> {
    try {
      if (data.length === 0) {
        return { success: true, count: 0 };
      }

      const count = await this.campaignRepository.upsert(data);

      this.logger.log(`Campaign同期完了: platform=${platform}, count=${count}`);

      return { success: true, count };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error(
        `Campaign同期エラー: platform=${platform}, error=${errorMessage}`,
      );

      return {
        success: false,
        count: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * platform_campaign_idからCampaignを取得
   */
  async findByPlatformId(platformCampaignId: string) {
    return await this.campaignRepository.findByPlatformId(platformCampaignId);
  }
}
