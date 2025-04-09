import { Module } from "@nestjs/common";
import { CatsModule } from "./cats/cats.module";
import { FinebirdModule } from "./finebird/finebird.module";
import { HanikamuModule } from "./hanikamu/hanikamu.module";
import { LadModule } from "./lad/lad.module";
import { metronModule } from "./metron/metron.module";
import { MonkeyModule } from "./monkey/monkey.module";
import { RentracksModule } from "./rentracks/rentracks.module";
import { SampleAffiliateModule } from "./sampleAffiliate/sample_affiliate.module";

@Module({
  imports: [
    CatsModule,
    FinebirdModule,
    HanikamuModule,
    LadModule,
    metronModule,
    MonkeyModule,
    RentracksModule,
    SampleAffiliateModule,
  ],
  exports: [
    CatsModule,
    FinebirdModule,
    HanikamuModule,
    LadModule,
    metronModule,
    MonkeyModule,
    RentracksModule,
    SampleAffiliateModule,
  ],
})
export class AspModule {}
