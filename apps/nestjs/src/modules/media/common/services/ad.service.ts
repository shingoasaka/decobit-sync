import { Injectable, Logger } from "@nestjs/common";
import { DimAdRepository } from "../repositories/ad.repository";

@Injectable()
export class DimAdService {
  private readonly logger = new Logger(DimAdService.name);
  constructor(private readonly repository: DimAdRepository) {}

  async upsertMany(
    ads: {
      ad_id: string;
      ad_name: string;
      advertiser_id: string;
      adgroup_id: string;
    }[],
  ): Promise<void> {
    if (!ads.length) {
      this.logger.log("処理対象の広告データがありません");
      return;
    }

    try {
      await this.repository.createMany(ads);
      this.logger.log(
        `${ads.length} 件の広告データを挿入しました (重複はスキップ)`,
      );
    } catch (error) {
      this.logger.error(
        "広告データの保存に失敗しました",
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
