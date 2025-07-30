import { Module } from "@nestjs/common";
// import { PrismaModule } from "src/prisma/prisma.module";

// Services
import { CampaignService } from "./services/campaign.service";
import { AdgroupService } from "./services/adgroup.service";
import { AdService } from "./services/ad.service";

// Repositories
import { CampaignRepository } from "./repositories/campaign.repository";
import { AdgroupRepository } from "./repositories/adgroup.repository";
import { AdRepository } from "./repositories/ad.repository";

/**
 * マスターデータ共通モジュール
 * Campaign、Adgroup、Adの共通同期処理を提供
 */
@Module({
  // imports: [PrismaModule],
  providers: [
    // Services
    CampaignService,
    AdgroupService,
    AdService,
    // Repositories
    CampaignRepository,
    AdgroupRepository,
    AdRepository,
  ],
  exports: [
    // Services
    CampaignService,
    AdgroupService,
    AdService,
  ],
})
export class MasterDataModule {}
