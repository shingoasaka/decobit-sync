import { Module } from "@nestjs/common";
import { MetronActionLogService } from "./services/action-logs.service";
import { PrismaService } from "@prismaService";
import { MetronClickLogService } from "./services/click-logs.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  providers: [MetronActionLogService, MetronClickLogService, PrismaService],
  exports: [MetronActionLogService, MetronClickLogService],
})
export class metronModule {}
