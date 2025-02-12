import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import * as Logs from "./modules/logs";
import { CronService } from "./cron.service";
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    // TODO: ログ、あとで消す
    Logs.ClickLogsModule,
    Logs.ActionLogsModule,
  ],
  providers: [CronService],
})
export class AppModule {}
