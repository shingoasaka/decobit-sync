import { Module } from "@nestjs/common";
import { MetronClickLogsService } from "../metron/click-logs/click-logs.service";

@Module({
  providers: [MetronClickLogsService],
})
export class ClickLogsModule {}
