import { Module } from "@nestjs/common";
import { CatsModule } from "./cats/cats.module";
import { FinebirdModule } from "./finebird/finebird.module";
import { HanikamuModule } from "./hanikamu/hanikamu.module";
import { MonkeyModule } from "./monkey/monkey.module";
import { SampleAffiliateModule } from "./sampleAffiliate/sample_affiliate";

@Module({
  imports: [
    CatsModule,
    FinebirdModule,
    HanikamuModule,
    MonkeyModule,
    SampleAffiliateModule,
  ],
  exports: [
    CatsModule,
    FinebirdModule,
    HanikamuModule,
    MonkeyModule,
    SampleAffiliateModule,
  ],
})
export class AspModule {}
