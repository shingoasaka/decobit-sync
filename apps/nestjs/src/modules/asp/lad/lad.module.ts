import { Module } from "@nestjs/common";
import { PrismaService } from '../../../prisma/prisma.service';
// import { LadActionLogRepository } from "./repositories/action-logs.repository";
// import { LadClickLogRepository } from "./repositories/click-logs.repository";
import { LadActionLogService } from "./services/action-logs.service";
import { LadClickLogService } from "./services/click-logs.service";
import { LadActionLogYesterdayService } from "./services/action-logs-yesterday.service";
import { LadClickLogYesterdayService } from "./services/click-logs-yesterday.service";
import { LadStActionLogService } from "./st/services/action-logs.service";
import { LadStClickLogService } from "./st/services/click-logs.service";
import { LadStActionLogYesterdayService } from "./st/services/action-logs-yesterday.service";
import { LadStClickLogYesterdayService } from "./st/services/click-logs-yesterday.service";
import { LadMenCpfActionLogService } from "./mencpf/services/action-logs.service";
import { LadMenCpfActionLogYesterdayService } from "./mencpf/services/action-logs-yesterday.service";
import { LadAdminActionLogService } from "./admin/services/action-logs.service";
import { LadAdminActionLogYesterdayService } from "./admin/services/action-logs-yesterday.service";

@Module({
  providers: [
    // LadActionLogRepository,
    LadActionLogService,
    LadStActionLogService,
    LadStActionLogYesterdayService,
    LadActionLogYesterdayService,
    LadClickLogYesterdayService,
    // LadClickLogRepository,
    LadClickLogService,
    LadStClickLogService,
    LadStClickLogYesterdayService,
    LadMenCpfActionLogService,
    LadMenCpfActionLogYesterdayService,
    LadAdminActionLogService,
    LadAdminActionLogYesterdayService,
    // PrismaService,
  ],
  exports: [LadActionLogService, 
    LadClickLogService, 
    LadActionLogYesterdayService, 
    LadClickLogYesterdayService, 
    LadStActionLogService, 
    LadStClickLogService, 
    LadStActionLogYesterdayService, 
    LadStClickLogYesterdayService, 
    LadMenCpfActionLogService,
    LadMenCpfActionLogYesterdayService,
    LadAdminActionLogService,
    LadAdminActionLogYesterdayService,
  ],
})
export class LadModule {}
