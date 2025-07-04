import { Module, forwardRef } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PrismaModule } from "src/prisma/prisma.module";
import { MediaModule } from "../media.module";
import { TikTokAccountService } from "./services/account.service";
import { TikTokCampaignReportService } from "./services/report/report-campaign.service";
import { TikTokAdgroupReportService } from "./services/report/report-adgroup.service";
import { TikTokAdReportService } from "./services/report/report-ad.service";
import { TikTokCampaignRepository } from "./repositories/report/report-campaign.repository";
import { TikTokAdgroupRepository } from "./repositories/report/report-adgroup.repository";
import { TikTokAdRepository } from "./repositories/report/report-ad.repository";
import { TikTokCampaignStatusHistoryRepository } from "./repositories/status/status-history-campaign.repository";
import { TikTokAdgroupStatusHistoryRepository } from "./repositories/status/status-history-adgroup.repository";
import { TikTokAdStatusHistoryRepository } from "./repositories/status/status-history-ad.repository";

// 共通モジュール
import { MasterDataModule } from "../common/master-data/master-data.module";

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    forwardRef(() => MediaModule),
    MasterDataModule,
  ],
  providers: [
    TikTokAccountService,
    TikTokCampaignReportService,
    TikTokAdgroupReportService,
    TikTokAdReportService,
    TikTokCampaignRepository,
    TikTokAdgroupRepository,
    TikTokAdRepository,
    TikTokCampaignStatusHistoryRepository,
    TikTokAdgroupStatusHistoryRepository,
    TikTokAdStatusHistoryRepository,
  ],
  exports: [
    TikTokCampaignReportService,
    TikTokAdgroupReportService,
    TikTokAdReportService,
    TikTokCampaignStatusHistoryRepository,
    TikTokAdgroupStatusHistoryRepository,
    TikTokAdStatusHistoryRepository,
  ],
})
export class TikTokModule {}
