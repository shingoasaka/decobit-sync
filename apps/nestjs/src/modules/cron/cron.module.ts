import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AspCronService } from "./services/asp-cron.service";
import { DiscrepanyCronService } from "./services/discrepany-cron.service";
import { AspModule } from "@asp/asp.module";
import { DiscrepanyModule } from "@discrepany/discrepany.module";
import { CommonLogService } from "@logs/common-log.service";

@Module({
  imports: [ScheduleModule.forRoot(), AspModule, DiscrepanyModule],
  providers: [AspCronService, DiscrepanyCronService, CommonLogService],
})
export class CronModule {}
