import { Module } from "@nestjs/common";
import { FinebirdActionLogService } from "./action-logs.service";
import { FinebirdClickLogService } from "./click-logs.service";
import { FinebirdActionLogRepository } from "./action-logs.repository";
import { FinebirdClickLogRepository } from "./click-logs.repository";
import { PrismaService } from "@prismaService";

@Module({
  providers: [
    FinebirdActionLogService,
    FinebirdClickLogService,
    FinebirdActionLogRepository,
    FinebirdClickLogRepository,
    PrismaService,
  ],
  exports: [FinebirdActionLogService, FinebirdClickLogService],
})
export class FinebirdModule {}
