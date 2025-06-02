import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TikTokReportService } from "./services/report/report-ad.service";
import { TikTokReportAdgroupService } from "./services/report/report-adgroup.service";
import { TikTokReportCampaignService } from "./services/report/report-campaign.service";
import { DimCampaignService } from "./services/dimensions/dim-campaign.service";
import { DimAdgroupService } from "./services/dimensions/dim-adgroup.service";
import { DimAdService } from "./services/dimensions/dim-ad.service";
import { DimExecService } from "./services/dimensions/dim-exec.service";
import { TikTokReportRepository } from "./repositories/report/tiktok-report-ad.repository";
import { TikTokReportAdgroupRepository } from "./repositories/report/tiktok-report-adgroup.repository";
import { TikTokReportCampaignRepository } from "./repositories/report/tiktok-report-campaign.repository";
import { DimCampaignRepository } from "./repositories/dimensions/dim-campaign.repository";
import { DimAdgroupRepository } from "./repositories/dimensions/dim-adgroup.repository";
import { DimAdRepository } from "./repositories/dimensions/dim-ad.repository";
import { PrismaService } from "@prismaService";
import { MediaModule } from "../media.module";
import { MediaAdvertiserService } from "../accounts/advertiser.service";
import { MediaAdvertiserRepository } from "../accounts/advertiser.repository";

@Module({
  imports: [HttpModule],
  providers: [
    TikTokReportService,
    TikTokReportAdgroupService,
    TikTokReportCampaignService,
    DimCampaignService,
    DimAdgroupService,
    DimAdService,
    DimExecService,
    TikTokReportRepository,
    TikTokReportAdgroupRepository,
    TikTokReportCampaignRepository,
    DimCampaignRepository,
    DimAdgroupRepository,
    DimAdRepository,
    PrismaService,
    MediaAdvertiserService,
    MediaAdvertiserRepository,
  ],
  exports: [
    TikTokReportService,
    TikTokReportAdgroupService,
    TikTokReportCampaignService,
    DimCampaignService,
    DimAdgroupService,
    DimAdService,
    DimExecService,
    TikTokReportRepository,
    TikTokReportAdgroupRepository,
    TikTokReportCampaignRepository,
    DimCampaignRepository,
    DimAdgroupRepository,
    DimAdRepository,
    MediaAdvertiserService,
    MediaAdvertiserRepository,
  ],
})
export class TikTokModule {}
