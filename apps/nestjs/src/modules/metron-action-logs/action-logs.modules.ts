import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PrismaService } from "../../prisma/prisma.service";
import { ScheduleModule } from "@nestjs/schedule";
import { MetronActionLogsService } from "../metron-action-logs/action-logs.service";
import { MetronActionLogsCronService } from "../metron-action-logs/action-logs.cron.service";

@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  providers: [
    PrismaService,
    MetronActionLogsService,
    MetronActionLogsCronService,
  ],
})
export class MetronActionLogsModule {}
