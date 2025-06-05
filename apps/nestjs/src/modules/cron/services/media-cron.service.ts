import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TikTokAdReportService } from "../../media/tiktok/services/report-ad.service";
import { TikTokAdgroupReportService } from "../../media/tiktok/services/report-adgroup.service";
import { TikTokCampaignReportService } from "../../media/tiktok/services/report-campaign.service";
import { CommonLogService } from "@logs/common-log.service";

// 実行結果の型定義
interface ServiceResult {
  name: string;
  success: boolean;
  count?: number;
  error?: string;
}

// Semaphoreクラスの実装
class Semaphore {
  private count: number;
  private waiting: Array<() => void> = [];

  constructor(count: number) {
    this.count = count;
  }

  public acquire(): Promise<() => void> {
    if (this.count > 0) {
      this.count--;
      return Promise.resolve(this.release.bind(this));
    }

    return new Promise<() => void>((resolve) => {
      this.waiting.push(() => {
        this.count--;
        resolve(this.release.bind(this));
      });
    });
  }

  private release(): void {
    this.count++;
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) next();
    }
  }
}

@Injectable()
export class MediaCronService {
  private readonly logger = new Logger(MediaCronService.name);
  private isRunning = false;
  private readonly semaphore: Semaphore;
  private readonly TIMEOUT_MS = 180000; // 3分
  private readonly MAX_RETRIES = 1; // リトライ回数

  constructor(
    private readonly tikTokAdReportService: TikTokAdReportService,
    private readonly tikTokAdgroupReportService: TikTokAdgroupReportService,
    private readonly tikTokCampaignReportService: TikTokCampaignReportService,
    private readonly commonLog: CommonLogService,
  ) {
    // 同時実行数の設定
    const concurrency = Number(process.env.MEDIA_WORKER_COUNT) || 2;
    this.semaphore = new Semaphore(concurrency);
    this.logger.log(
      `Media Cron: 同時実行制御を設定 - 最大 ${concurrency} 並列`,
    );
  }

  @Cron("*/3 * * * *")
  async handleMediaDataCollection() {
    if (this.isRunning) {
      this.logger.warn(
        "前回のメディア処理がまだ完了していません。スキップします。",
      );
      return;
    }

    this.isRunning = true;
    this.logger.log("🚀 メディア データ取得処理を開始");
    await this.commonLog.log(
      "info",
      "メディア データ取得処理を開始",
      "MediaCronService",
    );

    const startTime = Date.now();
    try {
      // メディアサービスのリスト定義
      const mediaServices = [
        { name: "TikTok-Report", service: this.tikTokAdReportService },
        {
          name: "TikTok-Report-adgroup",
          service: this.tikTokAdgroupReportService,
        },
        {
          name: "TikTok-Report-campaign",
          service: this.tikTokCampaignReportService,
        },
        // 他のメディアサービスを今後追加
      ];

      // 結果を格納する配列
      const results: ServiceResult[] = [];

      // 全サービスを順番に処理（Semaphoreで同時実行数制御）
      for (const { name, service } of mediaServices) {
        // semaphoreを使って同時実行数を制御
        const serviceLogger = new Logger(`Media:${name}`);
        serviceLogger.debug(`処理を準備中...`);

        try {
          const release = await this.semaphore.acquire();
          serviceLogger.log(`処理を開始`);

          try {
            // タイムアウト付きでサービスを実行（リトライあり）
            const count = await this.executeWithRetry(
              async () =>
                await this.executeWithTimeout(
                  async () => await service.saveReports(),
                  this.TIMEOUT_MS,
                  `${name} がタイムアウトしました（${this.TIMEOUT_MS}ms）`,
                ),
              name,
              this.MAX_RETRIES,
              serviceLogger,
            );

            results.push({ name, success: true, count });
            serviceLogger.log(`処理完了: ${count}件のデータを取得`);
            await this.commonLog.log(
              "info",
              `${count}件のデータを取得`,
              `Media:${name}`,
            );
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;

            results.push({ name, success: false, error: errorMsg });
            serviceLogger.error(`処理失敗: ${errorMsg}`);
            await this.commonLog.logError(`Media:${name}`, errorMsg, stack);
          } finally {
            // semaphoreを解放
            release();
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          results.push({ name, success: false, error: errorMsg });
          serviceLogger.error(`前処理でエラー: ${errorMsg}`);
        }
      }

      // 結果のサマリーを作成
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const totalRecords = results.reduce(
        (acc, r) => acc + (r.success && r.count ? r.count : 0),
        0,
      );
      const duration = Date.now() - startTime;

      const summary = `メディア処理結果: 成功=${succeeded}, 失敗=${failed}, 合計=${results.length}, 取得レコード=${totalRecords}, 処理時間=${Math.round(duration / 1000)}秒`;
      this.logger.log(summary);
      await this.commonLog.log("info", summary, "MediaCronService");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`メディア処理でエラーが発生: ${errorMsg}`);
      await this.commonLog.logError("MediaCronService", errorMsg, stack);
    } finally {
      this.isRunning = false;
    }
  }

  // 開発・テスト用の手動トリガー
  async manualTrigger(): Promise<string> {
    if (this.isRunning) {
      return "処理中です。完了をお待ちください。";
    }

    // バックグラウンドで非同期実行して即時レスポンス
    this.handleMediaDataCollection().catch((error) => {
      this.logger.error("手動実行中にエラーが発生", error);
    });

    return "メディアデータ収集処理を開始しました。";
  }

  // タイムアウト付き実行
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
    timeoutMessage: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeout);

      fn().then(
        (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  // リトライ付き実行
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    serviceName: string,
    maxRetries: number,
    logger: Logger,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 初回以外はリトライメッセージをログ
        if (attempt > 0) {
          logger.warn(`リトライ実行 ${attempt}/${maxRetries}`);
          await this.commonLog.log(
            "warn",
            `リトライ実行 ${attempt}/${maxRetries}`,
            `Media:${serviceName}`,
          );
        }

        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 最後のリトライでなければ待機してリトライ
        if (attempt < maxRetries) {
          const waitTime = 5000; // 5秒待機
          logger.warn(
            `エラー発生: ${lastError.message} - ${waitTime}ms後にリトライします`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    // すべてのリトライが失敗した場合
    throw lastError || new Error(`${serviceName}の実行に失敗しました`);
  }
}
