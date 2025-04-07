import { Module } from "@nestjs/common";

import { PrismaService } from "@prismaService";
import { RentracksActionLogRepository } from "./repositories/action-logs.repository";
import { RentracksClickLogRepository } from "./repositories/click-logs.repository";
import { NavicluActionLogService } from "./services/action-logs.service";
import { NavicluClickLogService } from "./services/click-logs.service";

@Module({
  providers: [
    RentracksActionLogRepository,
    RentracksClickLogRepository,
    NavicluActionLogService,
    NavicluClickLogService,
    PrismaService,
  ],
  exports: [NavicluActionLogService, NavicluClickLogService],
})
export class RentracksModule {}
