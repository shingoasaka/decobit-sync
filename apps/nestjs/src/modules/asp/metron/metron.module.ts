import { Module } from "@nestjs/common";
import { MetronActionLogService } from "./service/action-logs.service";
import { PrismaService } from "@prismaService";
import { MetronClickLogService } from "./service/click-logs.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  providers: [MetronActionLogService, MetronClickLogService, PrismaService],
  exports: [MetronActionLogService, MetronClickLogService],
})
export class metronModule {}
