import { Injectable, Logger } from "@nestjs/common";
import { DimAdgroupRepository } from "../../repositories/dimensions/dim-adgroup.repository";

@Injectable()
export class DimAdgroupService {
  private readonly logger = new Logger(DimAdgroupService.name);

  constructor(private readonly repository: DimAdgroupRepository) {}

  async upsertMany(
    adgroups: {
      adgroup_id: string;
      adgroup_name: string;
      advertiser_id: string;
      campaign_id: string;
    }[],
  ): Promise<void> {
    if (!adgroups.length) {
      this.logger.debug("処理対象のアドグループデータがありません");
      return;
    }

    try {
      await this.repository.createMany(adgroups);
      this.logger.log(
        `${adgroups.length} 件のアドグループデータを挿入しました (重複はスキップ)`,
      );
    } catch (error) {
      this.logger.error(
        "アドグループデータの保存に失敗しました",
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
