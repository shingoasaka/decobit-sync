import { Module } from "@nestjs/common";
import { MetronActionLogsService } from "../metron/action-logs/action-logs.service";

@Module({
  providers: [MetronActionLogsService],
})
export class ActionLogsModule {}
