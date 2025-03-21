import { Module } from "@nestjs/common";
import { TryModule } from "./try/try.module";

@Module({
  imports: [TryModule],
  exports: [TryModule],
})
export class HanikamuModule {}
