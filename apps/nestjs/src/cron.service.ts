import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Inject } from "@nestjs/common";
import { LogService } from "./modules/logs/types";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @Inject("LOG_SERVICES") private readonly logServices: LogService[],
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncLogs() {
    // TODO: ログを出力,あとで消す
    console.log("🚀 CronService is running...");
    for (const service of this.logServices) {
      await this.syncLogType(service);
    }
  }

  private async syncLogType(service: LogService) {
    const logger = new Logger(service.constructor.name);
    try {
      const count = await service.fetchAndInsertLogs();
      // TODO: ログを出力,あとで消す
      logger.log(`✅ Synced ${count} logs`);
    } catch (error) {
      // TODO: ログを出力,あとで消す
      logger.error(`❌ Failed to sync logs:`, error);
    }
  }
}
