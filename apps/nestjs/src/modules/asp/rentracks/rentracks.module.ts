import { Module } from "@nestjs/common";

import { PrismaService } from "@prismaService";
import { RentracksActionLogRepository } from "./repositories/action-logs.repository";
import { RentracksClickLogRepository } from "./repositories/click-logs.repository";
import { RentracksActionLogService } from "./services/action-logs.service";
import { RentracksClickLogService } from "./services/click-logs.service";

@Module({
  providers: [
    RentracksActionLogRepository,
    RentracksClickLogRepository,
    RentracksActionLogService,
    RentracksClickLogService,
    PrismaService,
  ],
  exports: [RentracksActionLogService, RentracksClickLogService],
})
export class RentracksModule {}
