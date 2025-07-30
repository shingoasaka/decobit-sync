import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
// import { PrismaModule } from "./prisma/prisma.module";
import { LogsModule } from "./modules/logs/logs.module";
import { AspModule } from "./modules/asp/asp.module";
import { CronModule } from "./modules/cron/cron.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    ScheduleModule.forRoot(),
    // PrismaModule,
    LogsModule,
    AspModule,
    CronModule,
  ],
  providers: [],
})
export class AppModule {}
