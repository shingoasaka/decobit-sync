import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
// `index.ts` から全ての `LogService` を取得
import * as Logs from "./modules/logs";
import { CronService } from "./cron.service";
import { LogsModule } from "./modules/logs/logs.module";
import { LogService } from "./modules/logs/types";

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, LogsModule],
  providers: [
    CronService,
    {
      provide: "LOG_SERVICES",
      useFactory: (...services: LogService[]) => services,
      // `index.ts` から全ての `LogService` を取得
      inject: Object.values(Logs),
    },
  ],
})
export class AppModule {}
