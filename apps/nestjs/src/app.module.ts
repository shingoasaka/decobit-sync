import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { CronService } from "./cron.service";
import { ScheduleModule } from "@nestjs/schedule";
import { MetronClickLogsService } from "./modules/metron/click-logs/click-logs.service";
import { MetronActionLogsService } from "./modules/metron/action-logs/action-logs.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    PrismaModule,
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [CronService, MetronClickLogsService, MetronActionLogsService],
})
export class AppModule {}
