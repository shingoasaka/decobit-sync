import { Module } from "@nestjs/common";
import { TryActionLogService } from "./action-logs.service";
import { TryClickLogService } from "./click-logs.service";
import { PrismaService } from "@prismaService";

@Module({
  providers: [TryActionLogService, TryClickLogService, PrismaService],
  exports: [TryActionLogService, TryClickLogService],
})
export class TryModule {}
