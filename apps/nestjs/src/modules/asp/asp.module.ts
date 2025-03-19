import { Module } from "@nestjs/common";
import { CatsModule } from "./cats/cats.module";

@Module({
  imports: [CatsModule],
  exports: [CatsModule],
})
export class AspModule {}
