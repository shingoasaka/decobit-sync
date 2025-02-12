import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MetronClickLogsService } from "./modules/metron/click-logs/click-logs.service";
import { MetronActionLogsService } from "./modules/metron/action-logs/action-logs.service";

@Injectable()
export class CronService {
  constructor(
    private readonly clickLogsService: MetronClickLogsService,
    private readonly actionLogsService: MetronActionLogsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncLogs() {
    await this.syncLogType(this.clickLogsService);
    await this.syncLogType(this.actionLogsService);
  }

  private async syncLogType(service: {
    fetchAndInsertLogs: () => Promise<number>;
  }) {
    const logger = new Logger(service.constructor.name);
    try {
      const count = await service.fetchAndInsertLogs();
      // TODO:ログを出力,あとで消す
      logger.log(`✅ Synced ${count} logs`);
    } catch (error) {
      // TODO:ログを出力,あとで消す
      logger.error(`❌ Failed to sync logs:`, error);
    }
  }
}
