import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TikTokAdRepository } from "./repositories/report/report-ad.repository";
import { TikTokAdgroupRepository } from "./repositories/report/report-adgroup.repository";
import { TikTokCampaignRepository } from "./repositories/report/report-campaign.repository";
import { TikTokAdReportService } from "./services/report/report-ad.service";
import { TikTokAdgroupReportService } from "./services/report/report-adgroup.service";
import { TikTokCampaignReportService } from "./services/report/report-campaign.service";
import { TikTokAccountService } from "./services/account.service";
import { PrismaService } from "@prismaService";

@Module({
  imports: [HttpModule],
  providers: [
    TikTokAdReportService,
    TikTokAdgroupReportService,
    TikTokCampaignReportService,
    TikTokAccountService,
    TikTokAdRepository,
    TikTokAdgroupRepository,
    TikTokCampaignRepository,
    PrismaService,
  ],
  exports: [
    TikTokAdReportService,
    TikTokAdgroupReportService,
    TikTokCampaignReportService,
    TikTokAccountService,
  ],
})
export class TikTokModule {}
