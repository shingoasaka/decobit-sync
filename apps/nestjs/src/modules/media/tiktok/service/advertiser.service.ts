import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class TiktokAdvertiserService {
  private readonly apiUrl =
    "https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/";

  constructor(private readonly http: HttpService) {}

  async fetchAdvertiserLogs(): Promise<string | null> {
    const headers = {
      "Access-Token": process.env.TIKTOK_ACCESS_TOKEN,
      "Content-Type": "application/json",
    };

    const params = new URLSearchParams();
    params.append("app_id", process.env.TIKTOK_APP_ID || "");
    params.append("secret", process.env.TIKTOK_SECRET || "");

    try {
      const resp = await firstValueFrom(
        this.http.get(this.apiUrl, { params, headers }),
      );
      const data = resp.data;
      const advertiserIds = data.data.list
        .map((advertiser: any) => advertiser.advertiser_id)
        .filter((id: string | null) => id !== null);

      return advertiserIds;
    } catch (error) {
      return null;
    }
  }
}
