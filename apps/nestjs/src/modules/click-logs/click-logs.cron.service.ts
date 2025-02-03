import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ClickLogsService } from "./click-logs.service";

@Injectable()
export class ClickLogsCronService {
  private readonly logger = new Logger(ClickLogsCronService.name);
  constructor(private readonly clickLogsService: ClickLogsService) {}

  // 毎分実行
  @Cron(CronExpression.EVERY_MINUTE)
  async handleEveryMinute() {
    try {
      const count = await this.clickLogsService.fetchAndInsertLogs();
      // TODO:ログを出力,あとで消す
      this.logger.log(`Synced ${count} click logs`);
    } catch (error) {
      // TODO:ログを出力,あとで消す
      this.logger.error("Failed to sync click logs:", error);
    }
  }
}
