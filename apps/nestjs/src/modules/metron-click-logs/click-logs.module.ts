import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PrismaService } from "../../prisma/prisma.service";
import { MetronClickLogsService } from "./click-logs.service";
import { MetronClickLogsCronService } from "./click-logs.cron.service";
@Module({
  imports: [HttpModule],
  providers: [
    MetronClickLogsService,
    PrismaService,
    MetronClickLogsCronService,
  ],
})
export class MetronClickLogsModule {}
