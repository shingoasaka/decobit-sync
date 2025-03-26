import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import * as Logs from "./modules/logs";
import { CronService } from "./cron.service";
import { LogsModule } from "./modules/logs/logs.module";
import { LogService } from "./modules/logs/types";
import { AspModule } from "./modules/asp/asp.module";
import { DiscrepanyModule } from "./modules/discrepany-check/discrepany.module";
import { CronModule } from "./modules/cron/cron.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    LogsModule,
    AspModule,
    DiscrepanyModule,
    CronModule,
  ],
  providers: [
    CronService,
    {
      provide: "LOG_SERVICES",
      useFactory: (...services: LogService[]) => services,
      inject: Object.values(Logs),
    },
  ],
})
export class AppModule {}
