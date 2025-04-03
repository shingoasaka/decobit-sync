import { Module } from "@nestjs/common";
import { TbcActionLogService } from "./tbc/action-logs.service";
import { PrismaService } from "@prismaService";
import { MetronActionLogRepository } from "./repositories/action-logs-repository";


@Module({
    providers: [
      TbcActionLogService,
      MetronActionLogRepository,
      PrismaService,
    ],
    exports: [TbcActionLogService],
  })
  export class tbcModule {}