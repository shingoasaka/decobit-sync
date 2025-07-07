import { Injectable, Logger } from "@nestjs/common";
import { AdgroupRepository } from "../repositories/adgroup.repository";
import {
  AdgroupData,
  PlatformType,
  SyncResult,
} from "../../interfaces/master-data.interface";

/**
 * Adgroupマスターデータの共通Service
 * 全媒体共通のAdgroup同期処理
 */
@Injectable()
export class AdgroupService {
  private readonly logger = new Logger(AdgroupService.name);

  constructor(private readonly adgroupRepository: AdgroupRepository) {}

  /**
   * レポートデータからAdgroupを同期
   * @param platform プラットフォーム種別
   * @param data Adgroupデータ配列
   * @returns 同期結果
   */
  async syncFromReport(
    platform: PlatformType,
    data: AdgroupData[],
  ): Promise<SyncResult> {
    try {
      if (data.length === 0) {
        return { success: true, count: 0 };
      }

      const count = await this.adgroupRepository.upsert(data);

      this.logger.log(`Adgroup同期完了: platform=${platform}, count=${count}`);

      return { success: true, count };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logger.error(
        `Adgroup同期エラー: platform=${platform}, error=${errorMessage}`,
      );

      return {
        success: false,
        count: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * platform_adgroup_idからAdgroupを取得
   */
  async findByPlatformId(platformAdgroupId: string) {
    return await this.adgroupRepository.findByPlatformId(platformAdgroupId);
  }
}
