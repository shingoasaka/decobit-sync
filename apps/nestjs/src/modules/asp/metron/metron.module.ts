import { Module } from "@nestjs/common";
import { MetronActionLogService } from "./services/action-logs.service";
import { PrismaService } from "@prismaService";
import { MetronClickLogService } from "./services/click-logs.service";
import { HttpModule } from "@nestjs/axios";
import { MetronActionLogRepository } from "./repositories/action-logs.repository";
import { MetronClickLogRepository } from "./repositories/click-logs.repository";

@Module({
  imports: [HttpModule],
  providers: [
    MetronActionLogService,
    MetronClickLogService,
    PrismaService,
    MetronActionLogRepository,
    MetronClickLogRepository,
  ],
  exports: [MetronActionLogService, MetronClickLogService],
})
export class metronModule {}
