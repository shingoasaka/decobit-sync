import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PrismaService } from "../prisma/prisma.service";
import { ScheduleModule } from "@nestjs/schedule";
import { ActionLogsService } from "./action-logs.service";
import { ActionLogsCronService } from "./action-logs.cron.service";

@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  providers: [PrismaService, ActionLogsService, ActionLogsCronService],
})
export class ActionLogsModule {}
