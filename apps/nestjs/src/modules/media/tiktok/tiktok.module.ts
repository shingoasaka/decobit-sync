import { Module } from "@nestjs/common";
import { TiktokAdvertiserService } from "./service/advertiser.service";
import { HttpModule } from "@nestjs/axios";
import { TikTokReportService } from "./service/report.service";

@Module({
  imports: [HttpModule],
  providers: [TiktokAdvertiserService, TikTokReportService],
  exports: [TiktokAdvertiserService, TikTokReportService],
})
export class TiktokModule {}
