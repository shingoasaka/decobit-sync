import { Module } from "@nestjs/common";
import { WebantennaActionLogService } from "./services/action-logs.service";
import { WebantennaClickLogService } from "./services/click-logs.service";
import { WebantennaActionLogRepository } from "./repositories/action-logs.repository";
import { WebantennaClickLogRepository } from "./repositories/click-logs.repository";
import { PrismaService } from "@prismaService";

@Module({
  providers: [
    WebantennaActionLogService,
    WebantennaClickLogService,
    WebantennaActionLogRepository,
    WebantennaClickLogRepository,
    PrismaService,
  ],
  exports: [WebantennaActionLogService, WebantennaClickLogService],
})
export class WebantennaModule {}
