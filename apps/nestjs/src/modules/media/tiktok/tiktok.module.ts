import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { TikTokCampaignRepository } from "./repositories/report-campaign.repository";
import { TikTokAdgroupRepository } from "./repositories/report-adgroup.repository";
import { TikTokAdRepository } from "./repositories/report-ad.repository";
import { TikTokCampaignReportService } from "./services/report-campaign.service";
import { TikTokAdgroupReportService } from "./services/report-adgroup.service";
import { TikTokAdReportService } from "./services/report-ad.service";
import { HttpModule } from "@nestjs/axios";
import { MediaModule } from "../media.module";
import { TikTokAccountService } from "./services/account.service";

@Module({
  imports: [PrismaModule, HttpModule, forwardRef(() => MediaModule)],
  providers: [
    TikTokCampaignRepository,
    TikTokAdgroupRepository,
    TikTokAdRepository,
    TikTokCampaignReportService,
    TikTokAdgroupReportService,
    TikTokAdReportService,
    TikTokAccountService,
  ],
  exports: [
    TikTokCampaignReportService,
    TikTokAdgroupReportService,
    TikTokAdReportService,
  ],
})
export class TikTokModule {}
