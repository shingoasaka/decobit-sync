import { Module } from "@nestjs/common";
import { CatsModule } from "./cats/cats.module";
import { FinebirdModule } from "./finebird/finebird.module";
import { HanikamuModule } from "./hanikamu/hanikamu.module";
import { LadModule } from "./lad/lad.module";
import { metronModule } from "./metron/metron.module";
import { MonkeyModule } from "./monkey/monkey.module";
import { RentracksModule } from "./rentracks/rentracks.module";
import { SampleAffiliateModule } from "./sampleAffiliate/sample_affiliate.module";
import { AspController } from "./asp.controller";
import { AspCollectionService } from "./asp-collection.service";
import { LogsModule } from "@logs/logs.module";

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
    LogsModule,
  ],
  controllers: [AspController],
  providers: [AspCollectionService],
  exports: [
    CatsModule,
    FinebirdModule,
    HanikamuModule,
    LadModule,
    metronModule,
    MonkeyModule,
    RentracksModule,
    SampleAffiliateModule,
    AspCollectionService,
  ],
})
export class AspModule {}
