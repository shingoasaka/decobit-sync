import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MetronActionLogsService } from "./action-logs.service";

@Injectable()
export class MetronActionLogsCronService {
  private readonly logger = new Logger(MetronActionLogsCronService.name);
  constructor(private readonly actionLogsService: MetronActionLogsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncActionLogs() {
    try {
      const count = await this.actionLogsService.fetchAndInsertLogs();
      // TODO:ログを出力,あとで消す
      this.logger.log(`Synced ${count} action logs`);
    } catch (error) {
      // TODO:ログを出力,あとで消す
      this.logger.error("Failed to sync action logs:", error);
    }
  }
}
