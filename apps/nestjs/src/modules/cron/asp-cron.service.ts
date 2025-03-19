import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CatsActionLogService } from "../asp/cats/services/action-logs.service";
import { CatsClickLogService } from "../asp/cats/services/click-logs.service";
import { FinebirdActionLogService } from "../asp/finebird/action-logs.service";
import { FinebirdClickLogService } from "../asp/finebird/click-logs.service";

@Injectable()
export class AspCronService {
  constructor(
    private readonly catsActionLogService: CatsActionLogService,
    private readonly catsClickLogService: CatsClickLogService,
    private readonly finebirdActionLogService: FinebirdActionLogService,
    private readonly finebirdClickLogService: FinebirdClickLogService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAspDataCollection() {
    console.log("✅ ASPデータ取得処理開始");

    await this.executeWithErrorHandling("Cats", async () => {
      await this.catsActionLogService.fetchAndInsertLogs();
      await this.catsClickLogService.fetchAndInsertLogs();
      await this.finebirdActionLogService.fetchAndInsertLogs();
      await this.finebirdClickLogService.fetchAndInsertLogs();
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
