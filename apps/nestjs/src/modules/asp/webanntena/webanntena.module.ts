import { Module } from "@nestjs/common";
import { WebanntenaActionLogService } from "./services/action-logs.service";
// import { PrismaService } from "@prismaService";
// import { WebanntenaClickLogService } from "./services/click-logs.service";
import { WebanntenaActionLogYesterdayService } from "./services/action-logs-yesterday.service";
import { HttpModule } from "@nestjs/axios";
// import { MetronActionLogRepository } from "./repositories/action-logs.repository";
// import { MetronClickLogRepository } from "./repositories/click-logs.repository";

@Module({
  imports: [HttpModule],
  providers: [
    WebanntenaActionLogService,
    WebanntenaActionLogYesterdayService,
    //     PrismaService,
//     MetronActionLogRepository,
//     MetronClickLogRepository,
  ],
  exports: [
    WebanntenaActionLogService,
    WebanntenaActionLogYesterdayService,
   ],
})
export class WebanntenaModule {}
