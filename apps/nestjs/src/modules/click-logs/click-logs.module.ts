import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PrismaService } from "../../prisma/prisma.service";
import { ClickLogsService } from "./click-logs.service";
import { ClickLogsCronService } from "./click-logs.cron.service";
@Module({
  imports: [HttpModule],
  providers: [ClickLogsService, PrismaService, ClickLogsCronService],
})
export class ClickLogsModule {}
