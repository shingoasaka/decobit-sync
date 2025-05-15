import { Module } from "@nestjs/common";
import { TikTokAdvertiserService } from "./services/advertiser.service";
import { HttpModule } from "@nestjs/axios";

import { TikTokReportService } from "./services/report.service";
import { TikTokReportRepository } from "./repositories/tiktok-report.repository";
import { PrismaService } from "@prismaService";

@Module({
  imports: [HttpModule],
  providers: [
    TikTokAdvertiserService,
    TikTokReportService,
    TikTokReportRepository,
    PrismaService,
  ],
  exports: [
    TikTokAdvertiserService,
    TikTokReportService,
    TikTokReportRepository,
  ],
})
export class TikTokModule {}
