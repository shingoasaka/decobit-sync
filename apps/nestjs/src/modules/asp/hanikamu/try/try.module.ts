import { Module } from "@nestjs/common";
import { TryActionLogService } from "./action-logs.service";
import { TryClickLogService } from "./click-logs.service";
import { PrismaService } from "@prismaService";
import { HanikamuActionLogRepository } from "../repositories/action-logs.repository";
import { HanikamuClickLogRepository } from "../repositories/click-logs.repository";

@Module({
  providers: [
    TryActionLogService,
    TryClickLogService,
    HanikamuActionLogRepository,
    HanikamuClickLogRepository,
    PrismaService,
  ],
  exports: [TryActionLogService, TryClickLogService],
})
export class TryModule {}
