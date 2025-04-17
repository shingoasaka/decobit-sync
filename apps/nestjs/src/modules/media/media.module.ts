// すべてのメディア関連モジュールを統合
import { Module } from "@nestjs/common";
import { TiktokModule } from "./tiktok/tiktok.module";

@Module({
  imports: [TiktokModule],
  exports: [TiktokModule],
})
export class MediaModule {}
