import { Module } from "@nestjs/common";
import { WebantennaActionLogService } from "./services/action-logs.service";
import { WebantennaActionLogRepository } from "./repositories/action-logs.repository";
import { PrismaService } from "@prismaService";

@Module({
  providers: [
    WebantennaActionLogService,
    WebantennaActionLogRepository,
    PrismaService,
  ],
  exports: [WebantennaActionLogService],
})
export class WebantennaModule {}
