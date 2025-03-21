import { Module } from "@nestjs/common";
import { CatsModule } from "./cats/cats.module";
import { FinebirdModule } from "./finebird/finebird.module";
import { HanikamuModule } from "./hanikamu/hanikamu.module";

@Module({
  imports: [CatsModule, FinebirdModule, HanikamuModule],
  exports: [CatsModule, FinebirdModule, HanikamuModule],
})
export class AspModule {}
