import { Module } from "@nestjs/common";
import { MonkeyActionLogService } from "./services/action-logs.service";
import { MonkeyClickLogService } from "./services/click-logs.service";
import { MonkeyActionLogRepository } from "./repositories/action-logs.repository";
import { MonkeyClickLogRepository } from "./repositories/click-logs.repository";
import { PrismaService } from "@prismaService";

@Module({
  providers: [
    MonkeyActionLogService,
    MonkeyClickLogService,
    MonkeyActionLogRepository,
    MonkeyClickLogRepository,
    PrismaService,
  ],
  exports: [MonkeyActionLogService, MonkeyClickLogService],
})
export class MonkeyModule {}
