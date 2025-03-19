import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CatsActionLogService } from "../asp/cats/services/action-logs.service";
import { CatsClickLogService } from "../asp/cats/services/click-logs.service";

@Injectable()
export class AspCronService {
  constructor(
    private readonly catsActionLogService: CatsActionLogService,
    private readonly catsClickLogService: CatsClickLogService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAspDataCollection() {
    console.log("✅ ASPデータ取得処理開始");

    await this.executeWithErrorHandling("Cats", async () => {
      await this.catsActionLogService.fetchAndInsertLogs();
      await this.catsClickLogService.fetchAndInsertLogs();
    });
  }

  private async executeWithErrorHandling(
    aspName: string,
    action: () => Promise<void>,
  ) {
    try {
      await action();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          `❌ ${aspName}データ取得処理でエラーが発生しました: ${error.message}`,
        );
      } else {
        console.error(
          `❌ ${aspName}データ取得処理でエラーが発生しました: 不明なエラー`,
        );
      }
    }
  }
}
