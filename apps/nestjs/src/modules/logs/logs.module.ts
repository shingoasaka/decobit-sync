import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import * as LogServices from "./index";

@Module({
  imports: [HttpModule],
  // 全ての `LogService` を追加
  providers: Object.values(LogServices),
  // AppModule で `LOG_SERVICES` として参照できるようにする
  exports: Object.values(LogServices),
})
export class LogsModule {}
