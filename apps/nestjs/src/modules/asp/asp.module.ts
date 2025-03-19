import { Module } from "@nestjs/common";
import { CatsModule } from "./cats/cats.module";
import { FinebirdModule } from "./finebird/finebird.module";

@Module({
  imports: [CatsModule, FinebirdModule],
  exports: [CatsModule, FinebirdModule],
})
export class AspModule {}
