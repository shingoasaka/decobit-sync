import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AspCronService } from "./asp-cron.service";
import { AspModule } from "../asp/asp.module";
// import { DiscrepancyCheckCronService } from './discrepancy-check-cron.service';

@Module({
  imports: [ScheduleModule.forRoot(), AspModule],
  providers: [
    AspCronService,
    // DiscrepancyCheckCronService,
  ],
})
export class CronModule {}
