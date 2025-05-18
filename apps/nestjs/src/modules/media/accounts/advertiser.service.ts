import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import {
  AdAccounts,
  TikTokResponseData,
  TikTokApiResponse,
  TikTokApiParams,
} from "./advertiser.interface";
import { MediaAdvertiserRepository } from "./advertiser.repository";
import { getNowJstForDB } from "src/libs/date-utils";
import { PLATFORM_IDS } from "src/constants/platform";

@Injectable()
export class MediaAdvertiserService {
  private readonly logger = new Logger(MediaAdvertiserService.name);

  constructor(
    private readonly http: HttpService,
    private readonly repository: MediaAdvertiserRepository,
  ) {}

  /**
   * 全てのプラットフォームのアドバタイザー情報を取得・保存します
   */
  async fetchAndSaveAllPlatformAdvertisers(): Promise<void> {
    this.logger.log("[MediaAdvertiser] 全プラットフォームのアドバタイザー情報取得を開始します");

    try {
      // TikTokのアドバタイザー情報を取得
      await this.fetchAndSaveTikTokAdvertisers();

      // 他のプラットフォームを追加する場合はここに追加
      // await this.fetchAndSaveTwitterAdvertisers();
      // await this.fetchAndSaveFacebookAdvertisers();

      this.logger.log("[MediaAdvertiser] 全プラットフォームのアドバタイザー情報を保存しました");
    } catch (error) {
      this.logger.error(
        "❌ アドバタイザー情報の取得中にエラーが発生しました",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async fetchAndSaveTikTokAdvertisers(): Promise<string[]> {
    this.validateTikTokEnv();
    const apiUrl =
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/";

    const headers = {
      "Access-Token": process.env.TIKTOK_ACCESS_TOKEN,
      "Content-Type": "application/json",
    };

    const params: TikTokApiParams = {
      app_id: process.env.TIKTOK_APP_ID || "",
      secret: process.env.TIKTOK_SECRET || "",
    };

    try {
      this.logger.log("TikTok広告主情報の取得を開始します");

      const resp = await firstValueFrom(
        this.http.get<TikTokApiResponse>(apiUrl, { params, headers }),
      );

      const advertisers: AdAccounts[] = resp.data.data.list.map(
        (advertiser: TikTokResponseData) => ({
          ad_platform_account_id: advertiser.advertiser_id,
          name: advertiser.advertiser_name,
          ad_platform_id: PLATFORM_IDS.TIKTOK,
          department_id: null,
          project_id: null,
          created_at: getNowJstForDB(),
          updated_at: getNowJstForDB(),
        }),
      );

      if (!advertisers?.length) {
        this.logger.warn("広告主情報が見つかりませんでした");
        return [];
      }

      await this.repository.upsertMany(advertisers);
      return advertisers.map(
        (advertiser: AdAccounts) => advertiser.ad_platform_account_id,
      );
    } catch (error) {
      this.logger.error(
        "TikTok広告主情報の取得中にエラーが発生しました",
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }
      );
      throw new Error('Failed to fetch TikTok advertisers');
    }
  }
  // 他のプラットフォームのメソッドを追加する場合はここに追加

  // 指定されたプラットフォームの広告主IDを取得
  async getAdvertisersByPlatform(platformId: number): Promise<string[]> {
    return this.repository.findAdvertisersByPlatform(platformId);
  }

  private validateTikTokEnv(): void {
    if (!process.env.TIKTOK_APP_ID || !process.env.TIKTOK_SECRET) {
      throw new Error('Required TikTok environment variables are not set');
    }
  }
}
