import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AspCronService } from "./services/asp-cron.service";
import { DiscrepanyCronService } from "./services/discrepany-cron.service";
import { MediaCronService } from "./services/media-cron.service";
import { AspModule } from "@asp/asp.module";
import { DiscrepanyModule } from "@discrepany/discrepany.module";
import { CommonLogService } from "@logs/common-log.service";
// import { MediaModule } from "../media/media.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AspModule,
    DiscrepanyModule,
    // MediaModule
  ],
  providers: [
    AspCronService,
    DiscrepanyCronService,
    CommonLogService,
    // MediaCronService,
  ],
})
export class CronModule {}
