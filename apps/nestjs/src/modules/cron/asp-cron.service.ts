import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CatsActionLogService } from "../asp/cats/services/action-logs.service";
import { CatsClickLogService } from "../asp/cats/services/click-logs.service";
import { FinebirdActionLogService } from "../asp/finebird/services/action-logs.service";
import { FinebirdClickLogService } from "../asp/finebird/services/click-logs.service";
import { TryActionLogService } from "../asp/hanikamu/try/action-logs.service";
import { TryClickLogService } from "../asp/hanikamu/try/click-logs.service";

@Injectable()
export class AspCronService {
  constructor(
    private readonly catsActionLogService: CatsActionLogService,
    private readonly catsClickLogService: CatsClickLogService,
    private readonly finebirdActionLogService: FinebirdActionLogService,
    private readonly finebirdClickLogService: FinebirdClickLogService,
    private readonly tryActionLogService: TryActionLogService,
    private readonly tryClickLogService: TryClickLogService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAspDataCollection() {
    console.log("✅ ASPデータ取得処理開始");

    await this.executeWithErrorHandling("Cats", async () => {
      void (await this.catsActionLogService.fetchAndInsertLogs());
      void (await this.catsClickLogService.fetchAndInsertLogs());
    });

    await this.executeWithErrorHandling("Finebird", async () => {
      void (await this.finebirdActionLogService.fetchAndInsertLogs());
      void (await this.finebirdClickLogService.fetchAndInsertLogs());
    });

    await this.executeWithErrorHandling("Hanikamu-Try", async () => {
      void (await this.tryActionLogService.fetchAndInsertLogs());
      void (await this.tryClickLogService.fetchAndInsertLogs());
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
