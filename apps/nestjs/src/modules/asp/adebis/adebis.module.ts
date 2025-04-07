import { Module } from "@nestjs/common";

import { PrismaService } from "@prismaService";
import { SparkOripaActionLogService } from "./services/action-logs.service";
import { SparkOripaClickLogService } from "./services/click-logs.service";
import { AdebisActionLogRepository } from "./repositories/action-logs.repository";
import { AdebisClickLogRepository } from "./repositories/click-logs.repository";

@Module({
  providers: [
    SparkOripaActionLogService,
    SparkOripaClickLogService,
    AdebisActionLogRepository,
    AdebisClickLogRepository,
    PrismaService,
  ],
  exports: [SparkOripaActionLogService, SparkOripaClickLogService],
})
export class AdebisModule {}