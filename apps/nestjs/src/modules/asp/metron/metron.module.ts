import { Module } from "@nestjs/common";
import { MetronActionLogService } from "./service/action-logs.service";
import { PrismaService } from "@prismaService";
import { MetronActionLogRepository } from "./repositories/action-logs-repository";
import { MetronClickLogService } from "./service/click-logs.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  providers: [MetronActionLogService,MetronClickLogService ,MetronActionLogRepository, PrismaService],
  exports: [MetronActionLogService,MetronClickLogService],
})
export class metronModule {}
