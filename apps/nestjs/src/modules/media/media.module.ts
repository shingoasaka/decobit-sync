// すべてのメディア関連モジュールを統合
import { Module } from "@nestjs/common";
import { TikTokModule } from "./tiktok/tiktok.module";
import { PrismaService } from "@prismaService";


@Module({
  imports: [TikTokModule],
  providers: [PrismaService],
  exports: [TikTokModule],
})
export class MediaModule {}
