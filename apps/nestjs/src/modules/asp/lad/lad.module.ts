import { Module } from "@nestjs/common";
import { PrismaService } from '../../../prisma/prisma.service';
// import { LadActionLogRepository } from "./repositories/action-logs.repository";
// import { LadClickLogRepository } from "./repositories/click-logs.repository";
import { LadActionLogService } from "./services/action-logs.service";
import { LadClickLogService } from "./services/click-logs.service";

@Module({
  providers: [
    // LadActionLogRepository,
    // LadActionLogService,
    // LadClickLogRepository,
    LadClickLogService,
    // PrismaService,
  ],
  // exports: [LadActionLogService, LadClickLogService],
  exports: [LadClickLogService],
})
export class LadModule {}
