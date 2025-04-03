import { Module } from "@nestjs/common";
import { CatsModule } from "./cats/cats.module";
import { FinebirdModule } from "./finebird/finebird.module";
import { HanikamuModule } from "./hanikamu/hanikamu.module";
import { MonkeyModule } from "./monkey/monkey.module";
import { SampleAffiliateModule } from "./sampleAffiliate/sample_affiliate";
import { tbcModule } from "./metron/tbc.module";

@Module({
  imports: [
    tbcModule,
    CatsModule,
    FinebirdModule,
    HanikamuModule,
    MonkeyModule,
    SampleAffiliateModule,
    tbcModule,
  ],
  exports: [
    tbcModule,
    CatsModule,
    FinebirdModule,
    HanikamuModule,
    MonkeyModule,
    SampleAffiliateModule,
  ],
})
export class AspModule {}
