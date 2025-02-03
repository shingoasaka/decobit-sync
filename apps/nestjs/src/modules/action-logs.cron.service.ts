import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ActionLogsService } from "./action-logs.service";

@Injectable()
export class ActionLogsCronService {
  private readonly logger = new Logger(ActionLogsCronService.name);
  constructor(private readonly actionLogsService: ActionLogsService) {}

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
