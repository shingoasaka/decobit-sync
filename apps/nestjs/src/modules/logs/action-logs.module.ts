import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { MetronActionLogsService } from "../metron/action-logs/action-logs.service";

@Module({
  imports: [HttpModule],
  providers: [MetronActionLogsService],
  exports: [MetronActionLogsService],
})
export class ActionLogsModule {}
