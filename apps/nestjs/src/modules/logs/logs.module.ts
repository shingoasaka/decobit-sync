import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { CommonLogService } from "./common-log.service";

@Module({
  imports: [HttpModule],
  providers: [CommonLogService],
  exports: [CommonLogService],
})
export class LogsModule {}
