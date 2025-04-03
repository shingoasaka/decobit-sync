import { Module } from "@nestjs/common";
import { MetronActionLogService } from "./service/action-logs.service";
import { PrismaService } from "@prismaService";
import { MetronActionLogRepository } from "./repositories/action-logs-repository";

@Module({
  providers: [MetronActionLogService, MetronActionLogRepository, PrismaService],
  exports: [MetronActionLogService],
})
export class tbcModule {}
