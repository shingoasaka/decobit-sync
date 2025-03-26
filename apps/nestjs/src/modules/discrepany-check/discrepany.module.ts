import { Module } from "@nestjs/common";
import { WebantennaModule } from "./webantenna/webantenna.module";

@Module({
  imports: [WebantennaModule],
  exports: [WebantennaModule],
})
export class DiscrepanyModule {}
