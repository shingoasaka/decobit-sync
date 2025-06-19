import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
// import { AspCronService } from "./services/asp-cron.service";
import { MediaCronService } from "./services/media-cron.service";
// import { AspModule } from "@asp/asp.module";
import { CommonLogService } from "@logs/common-log.service";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    //  AspModule,
    MediaModule,
  ],
  providers: [
    // AspCronService,
    CommonLogService,
    MediaCronService,
  ],
})
export class CronModule {}
