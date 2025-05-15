import { Module } from "@nestjs/common";
import { TikTokAdvertiserService } from "./services/advertiser.service";
import { HttpModule } from "@nestjs/axios";
import { TikTokReportService } from "./services/report.service";
import { DimCampaignService } from "./services/dimensions/dim-campaign.service";
import { DimAdgroupService } from "./services/dimensions/dim-adgroup.service";
import { DimAdService } from "./services/dimensions/dim-ad.service";
import { DimExecService } from "./services/dimensions/dim-exec.service";
import { FactAdReportService } from "./services/fact/fact-report-ad.service";
import { TikTokReportRepository } from "./repositories/tiktok-report.repository";
import { FactAdReportRepository } from "./repositories/fact/fact-report-ad.repository";
import { DimCampaignRepository } from "./repositories/dimensions/dim-campaign.repository";
import { DimAdgroupRepository } from "./repositories/dimensions/dim-adgroup.repository";
import { DimAdRepository } from "./repositories/dimensions/dim-ad.repository";
import { PrismaService } from "@prismaService";

@Module({
  imports: [HttpModule],
  providers: [
    TikTokAdvertiserService,
    TikTokReportService,
    FactAdReportService,
    DimCampaignService,
    DimAdgroupService,
    DimAdService,
    DimExecService,
    TikTokReportRepository,
    FactAdReportRepository,
    DimCampaignRepository,
    DimAdgroupRepository,
    DimAdRepository,
    PrismaService,
  ],
  exports: [
    TikTokAdvertiserService,
    TikTokReportService,
    FactAdReportService,
    DimCampaignService,
    DimAdgroupService,
    DimAdService,
    DimExecService,
    TikTokReportRepository,
    FactAdReportRepository,
    DimCampaignRepository,
    DimAdgroupRepository,
    DimAdRepository,
  ],
})
export class TikTokModule {}
