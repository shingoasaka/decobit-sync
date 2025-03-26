import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AspCronService } from "./asp-cron.service";
import { DiscrepanyCronService } from "./discrepany-cron.service";
import { AspModule } from "../asp/asp.module";
import { DiscrepanyModule } from "../discrepany-check/discrepany.module";

@Module({
  imports: [ScheduleModule.forRoot(), AspModule, DiscrepanyModule],
  providers: [AspCronService, DiscrepanyCronService],
})
export class CronModule {}
