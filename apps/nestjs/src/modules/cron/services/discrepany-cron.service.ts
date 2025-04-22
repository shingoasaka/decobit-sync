import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { WebantennaActionLogService } from "@discrepany/webantenna/services/action-logs.service";

@Injectable()
export class DiscrepanyCronService {
  constructor(
    private readonly webantennaActionLogService: WebantennaActionLogService,

  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDiscrepanyCheck() {
    console.log("✅ 不一致チェック処理開始");

    await this.executeWithErrorHandling("Webantenna", async () => {
      void (await this.webantennaActionLogService.fetchAndInsertLogs());
    });
  }

  private async executeWithErrorHandling(
    aspName: string,
    action: () => Promise<void>,
  ) {
    try {
      await action();
    } catch (error) {
      console.error(
        `${aspName}の不一致チェック処理でエラーが発生しました: ${error}`,
      );
    }
  }
}
