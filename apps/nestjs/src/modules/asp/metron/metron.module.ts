import { Module } from "@nestjs/common";
import { MetronActionLogService } from "./services/action-logs.service";
// import { PrismaService } from "@prismaService";
import { MetronClickLogService } from "./services/click-logs.service";
// import { MetronActionLogYesterdayService } from "./services/action-logs-yesterday.service";
import { MetronClickLogYesterdayService } from "./services/click-logs-yesterday.service";
import { HttpModule } from "@nestjs/axios";
// import { MetronActionLogRepository } from "./repositories/action-logs.repository";
// import { MetronClickLogRepository } from "./repositories/click-logs.repository";

@Module({
  imports: [HttpModule],
  providers: [
    MetronActionLogService,
    MetronClickLogService,
    // MetronActionLogYesterdayService,
    MetronClickLogYesterdayService,
//     PrismaService,
//     MetronActionLogRepository,
//     MetronClickLogRepository,
  ],
  exports: [MetronActionLogService, 
    MetronClickLogService,
    // MetronActionLogYesterdayService,
    MetronClickLogYesterdayService,
  ],
})
export class metronModule {}
