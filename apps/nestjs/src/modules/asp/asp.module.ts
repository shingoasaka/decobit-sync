import { Module } from "@nestjs/common";
import { CatsModule } from "./cats/cats.module";
import { FinebirdModule } from "./finebird/finebird.module";
import { HanikamuModule } from "./hanikamu/hanikamu.module";
import { MonkeyModule } from "./monkey/monkey.module";
import { SampleAffiliateModule } from "./sampleAffiliate/sample_affiliate.module";
import { metronModule } from "./metron/metron.module";
import { RentracksModule } from "./rentracks/rentracks.module";

@Module({
  imports: [
    // metronModule,
    // CatsModule,
    // FinebirdModule,
    // HanikamuModule,
    // MonkeyModule,
    // SampleAffiliateModule,
    RentracksModule,
  ],
  exports: [
    // metronModule,
    // CatsModule,
    // FinebirdModule,
    // HanikamuModule,
    // MonkeyModule,
    // SampleAffiliateModule,
    RentracksModule,
  ],
})
export class AspModule {}
