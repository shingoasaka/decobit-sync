// すべてのメディア関連モジュールを統合
import { Module } from "@nestjs/common";
import { TikTokModule } from "./tiktok/tiktok.module";
import { MasterDataModule } from "./common/master-data/master-data.module";
import { PrismaService } from "@prismaService";

@Module({
  imports: [TikTokModule, MasterDataModule],
  providers: [PrismaService],
  exports: [TikTokModule, MasterDataModule],
})
export class MediaModule {}
