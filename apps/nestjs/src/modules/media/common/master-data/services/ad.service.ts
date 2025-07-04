import { Injectable, Logger } from "@nestjs/common";
import { AdRepository } from "../repositories/ad.repository";
import {
  AdData,
  PlatformType,
  SyncResult,
} from "../../interfaces/master-data.interface";

/**
 * Adマスターデータの共通Service
 * 全媒体共通のAd同期処理
 */
@Injectable()
export class AdService {
  private readonly logger = new Logger(AdService.name);

  constructor(private readonly adRepository: AdRepository) {}

  /**
   * レポートデータからAdを同期
   * @param platform プラットフォーム種別
   * @param data Adデータ配列
   * @returns 同期結果
   */
  async syncFromReport(
    platform: PlatformType,
    data: AdData[],
  ): Promise<SyncResult> {
    try {
      if (data.length === 0) {
        return { success: true, count: 0 };
      }

      const count = await this.adRepository.upsert(data);

      this.logger.log(`Ad同期完了: platform=${platform}, count=${count}`);

      return { success: true, count };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error(
        `Ad同期エラー: platform=${platform}, error=${errorMessage}`,
      );

      return {
        success: false,
        count: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * platform_ad_idからAdを取得
   */
  async findByPlatformId(platformAdId: bigint) {
    return await this.adRepository.findByPlatformId(platformAdId);
  }
}
