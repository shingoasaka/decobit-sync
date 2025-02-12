import { Module } from "@nestjs/common";
import { MetronClickLogsService } from "../metron/click-logs/click-logs.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule],
  providers: [MetronClickLogsService],
  exports: [MetronClickLogsService],
})
export class ClickLogsModule {}
