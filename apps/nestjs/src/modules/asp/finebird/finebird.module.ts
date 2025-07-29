import { Module } from "@nestjs/common";
import { FinebirdActionLogService } from "./services/action-logs.service";
import { FinebirdClickLogService } from "./services/click-logs.service";
import { FinebirdActionLogYesterdayService } from "./services/action-logs-yesterday.service";
import { FinebirdClickLogYesterdayService } from "./services/click-logs-yesterday.service";
// import { FinebirdActionLogRepository } from "./repositories/action-logs.repository";
// import { FinebirdClickLogRepository } from "./repositories/click-logs.repository";
// import { PrismaService } from "@prismaService";

@Module({
  providers: [
    FinebirdActionLogService,
    FinebirdClickLogService,
    FinebirdActionLogYesterdayService,
    FinebirdClickLogYesterdayService,
//     FinebirdActionLogRepository,
//     FinebirdClickLogRepository,
//     PrismaService,
  ],
  exports: [FinebirdActionLogService, 
    FinebirdClickLogService,
    FinebirdActionLogYesterdayService,
    FinebirdClickLogYesterdayService,
  ],

})
export class FinebirdModule {}
