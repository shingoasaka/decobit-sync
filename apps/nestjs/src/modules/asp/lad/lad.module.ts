import { Module } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { LadActionLogRepository } from "./repositories/action-logs.repository";
import { LadClickLogRepository } from "./repositories/click-logs.repository";
import { LadActionLogService } from "./service/action-logs.service";
import { LadClickLogService } from "./service/click-logs.service";

@Module({
  providers: [
    LadActionLogRepository,
    LadActionLogService,
    LadClickLogRepository,
    LadClickLogService,
    PrismaService,
  ],
  exports: [LadActionLogService, LadClickLogService],
})
export class LadModule {}
