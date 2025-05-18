import { Controller, Get, Logger } from "@nestjs/common";
import { MediaAdvertiserService } from "./advertiser.service";

@Controller("media/accounts")
export class MediaAdvertiserController {
  private readonly logger = new Logger(MediaAdvertiserController.name);

  constructor(private readonly advertiserService: MediaAdvertiserService) {}

  @Get("fetch")
  async fetchAdvertisers() {
    this.logger.log("広告主アカウント情報の取得を開始します");
    await this.advertiserService.fetchAndSaveAllPlatformAdvertisers();
    return { message: "広告主アカウント情報の取得が完了しました" };
  }


}
