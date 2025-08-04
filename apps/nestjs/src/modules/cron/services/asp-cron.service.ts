import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
// import { CatsActionLogService } from "@asp/cats/services/action-logs.service";
// import { CatsClickLogService } from "@asp/cats/services/click-logs.service";
import { FinebirdActionLogService } from "@asp/finebird/services/action-logs.service";
import { FinebirdClickLogService } from "@asp/finebird/services/click-logs.service";
import { FinebirdActionLogYesterdayService } from "@asp/finebird/services/action-logs-yesterday.service";
import { FinebirdClickLogYesterdayService } from "@asp/finebird/services/click-logs-yesterday.service";
// // import { TryActionLogService } from "@asp/hanikamu/try/action-logs.service";
// // import { TryClickLogService } from "@asp/hanikamu/try/click-logs.service";
import { LadActionLogService } from "@asp/lad/services/action-logs.service";
import { LadClickLogService } from "@asp/lad/services/click-logs.service";
import { LadActionLogYesterdayService } from "@asp/lad/services/action-logs-yesterday.service"
import { LadClickLogYesterdayService } from "@asp/lad/services/click-logs-yesterday.service";
import { LadStActionLogService } from "@asp/lad/st/services/action-logs.service";
import { LadStClickLogService } from "@asp/lad/st/services/click-logs.service";
import { LadStActionLogYesterdayService } from "@asp/lad/st/services/action-logs-yesterday.service";
import { LadStClickLogYesterdayService } from "@asp/lad/st/services/click-logs-yesterday.service";
import { LadMenCpfActionLogService } from "@asp/lad/mencpf/services/action-logs.service";
import { LadMenCpfActionLogYesterdayService } from "@asp/lad/mencpf/services/action-logs-yesterday.service";
import { LadAdminActionLogService } from "@asp/lad/admin/services/action-logs.service";
import { LadAdminActionLogYesterdayService } from "@asp/lad/admin/services/action-logs-yesterday.service";
import { MetronActionLogService } from "@asp/metron/services/action-logs.service";
import { MetronClickLogService } from "@asp/metron/services/click-logs.service";
// import { MetronActionLogYesterdayService } from "@asp/metron/services/action-logs-yesterday.service";
import { MetronClickLogYesterdayService } from "@asp/metron/services/click-logs-yesterday.service";
import { WebanntenaActionLogService } from "@asp/webanntena/services/action-logs.service";
import { WebanntenaActionLogYesterdayService } from "@asp/webanntena/services/action-logs-yesterday.service";
// import { MonkeyActionLogService } from "@asp/monkey/services/action-logs.service";
// import { MonkeyClickLogService } from "@asp/monkey/services/click-logs.service";
// import { RentracksActionLogService } from "@asp/rentracks/services/action-logs.service";
// import { RentracksClickLogService } from "@asp/rentracks/services/click-logs.service";
// import { SampleAffiliateActionLogService } from "@asp/sampleAffiliate/services/action-logs.service";
// import { SampleAffiliateClickLogService } from "@asp/sampleAffiliate/services/click-logs.service";
import { CommonLogService } from "@logs/common-log.service";
import * as fs from 'fs';
import * as path from 'path';


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
export class AspCronService implements OnModuleInit {
  private readonly logger = new Logger(AspCronService.name);
  private isRunningYesterday = false;
  private isRunningToday = false;
  private readonly semaphore: Semaphore;
  private readonly MAX_RETRIES = 1; // リトライ回数

  constructor(
    // private readonly catsActionLogService: CatsActionLogService,
    // private readonly catsClickLogService: CatsClickLogService,
    private readonly finebirdActionLogService: FinebirdActionLogService,
    private readonly finebirdClickLogService: FinebirdClickLogService,
    private readonly finebirdActionLogYesterdayService: FinebirdActionLogYesterdayService,
    private readonly finebirdClickLogYesterdayService: FinebirdClickLogYesterdayService,
    private readonly LadActionLogService: LadActionLogService,
    private readonly LadClickLogService: LadClickLogService,
    private readonly ladActionLogYesterdayService: LadActionLogYesterdayService,
    private readonly ladClickLogYesterdayService: LadClickLogYesterdayService,
    private readonly LadStActionLogService: LadStActionLogService,
    private readonly LadStClickLogService: LadStClickLogService,
    private readonly LadStActionLogYesterdayService: LadStActionLogYesterdayService,
    private readonly LadStClickLogYesterdayService: LadStClickLogYesterdayService,
    private readonly LadMenCpfActionLogService: LadMenCpfActionLogService,
    private readonly LadMenCpfActionLogYesterdayService: LadMenCpfActionLogYesterdayService,
    private readonly LadAdminActionLogService: LadAdminActionLogService,
    private readonly LadAdminActionLogYesterdayService: LadAdminActionLogYesterdayService,
    private readonly metronActionLogService: MetronActionLogService,
    private readonly metronClickLogService: MetronClickLogService,
    // private readonly metronActionLogYesterdayService: MetronActionLogYesterdayService,
    private readonly metronClickLogYesterdayService: MetronClickLogYesterdayService,
    private readonly WebanntenaActionLogService: WebanntenaActionLogService,
    private readonly WebanntenaActionLogYesterdayService: WebanntenaActionLogYesterdayService,
    // private readonly monkeyActionLogService: MonkeyActionLogService,
    // private readonly monkeyClickLogService: MonkeyClickLogService,
    // private readonly RentracksActionLogService: RentracksActionLogService,
    // private readonly RentracksClickLogService: RentracksClickLogService,
    // private readonly sampleAffiliateActionLogService: SampleAffiliateActionLogService,
    // private readonly sampleAffiliateClickLogService: SampleAffiliateClickLogService,
    // private readonly tryActionLogService: TryActionLogService,
    // private readonly tryClickLogService: TryClickLogService,
    private readonly commonLog: CommonLogService,
  ) {
    // 同時実行数の設定
    const concurrency = Number(process.env.BROWSER_WORKER_COUNT) || 3;
    this.semaphore = new Semaphore(concurrency);
    this.logger.log(`ASP Cron: 同時実行制御を設定 - 最大 ${concurrency} 並列`);
  }

  onModuleInit() {
    this.logger.log("AspCronService が初期化されました。");
  }

  // 前日分のASPのログ取得（1:00〜6:30まで、毎時30分ごと（1:00, 1:30, ..., 6:30））
  @Cron('0,30 1-6 * * *')
  async handleAspYesterdayDataCollection() {

    const timeoutMs = 7 * 60 * 1000; // 7分

    if (this.isRunningYesterday) {
      this.logger.warn("前回のASP昨日分処理がまだ完了していません。スキップします。");
      return;
    }

    this.isRunningYesterday = true;
    this.logger.log("🌙 ASP 昨日分データ取得処理を開始");
    await this.commonLog.log(
      "info",
      "ASP 昨日分データ取得処理を開始",
      "AspCronService",
    );

    const startTime = Date.now();
    const aspYesterdayServices = [
      { name: "Lad-Action-Yesterday", service: this.ladActionLogYesterdayService },
      { name: "Lad-Click-Yesterday", service: this.ladClickLogYesterdayService },
      { name: "Lad-St-Action-Yesterday", service: this.LadStActionLogYesterdayService },
      { name: "Lad-St-Click-Yesterday", service: this.LadStClickLogYesterdayService },
      { name: "Lad-Mencpf-Action-Yesterday", service: this.LadMenCpfActionLogYesterdayService },
      { name: "Lad-Admin-Action-Yesterday", service: this.LadAdminActionLogYesterdayService },
      { name: "Finebird-Action-Yesterday", service: this.finebirdActionLogYesterdayService },
      { name: "Finebird-Click-Yesterday", service: this.finebirdClickLogYesterdayService },
      { name: "Metron-Click-Yesterday", service: this.metronClickLogYesterdayService },
      // { name: "Metron-Action-Yesterday", service: this.metronActionLogYesterdayService },
      { name: "Webanntena-Action-Yesterday", service: this.WebanntenaActionLogYesterdayService },
    ];

    const results: ServiceResult[] = [];

    for (const { name, service } of aspYesterdayServices) {
      const serviceLogger = new Logger(`ASP:${name}`);
      serviceLogger.debug(`処理を準備中...`);

      try {
        const release = await this.semaphore.acquire();
        serviceLogger.log(`処理を開始`);

        try {
          const resultValue = await this.executeWithRetry(
            async () =>
              await this.executeWithTimeout(
                async () => await service.fetchAndInsertLogs(),
                timeoutMs,
                `${name} がタイムアウトしました（${timeoutMs}ms）`,
              ),
            name,
            this.MAX_RETRIES,
            serviceLogger,
          );

          const count = Array.isArray(resultValue) ? resultValue.length : resultValue;
          results.push({ name, success: true, count });
          serviceLogger.log(`処理完了: ${count}件のデータを取得`);
          await this.commonLog.log(
            "info",
            `${count}件のデータを取得`,
            `ASP:${name}`,
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          const stack = error instanceof Error ? error.stack : undefined;
          results.push({ name, success: false, error: errorMsg });
          serviceLogger.error(`処理失敗: ${errorMsg}`);
          await this.commonLog.logError(`ASP:${name}`, errorMsg, stack);
        } finally {
          release();
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.push({ name, success: false, error: errorMsg });
        serviceLogger.error(`前処理でエラー: ${errorMsg}`);
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalRecords = results.reduce(
      (acc, r) => acc + (r.success && r.count ? r.count : 0),
      0,
    );
    const duration = Date.now() - startTime;

    const summary = `ASP昨日分処理結果: 成功=${succeeded}, 失敗=${failed}, 合計=${results.length}, 取得レコード=${totalRecords}, 処理時間=${Math.round(duration / 1000)}秒`;
    this.logger.log(summary);
    await this.commonLog.log("info", summary, "AspCronService");

    this.isRunningYesterday = false;

    // // ログ出力処理（昨日分のみ）
    // try {
    //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    //   const logDir = path.resolve(__dirname, '../../../../logs/yesterday'); // 保存先ディレクトリ（任意に変更可）
    //   const logFile = path.join(logDir, `asp-yesterday-${timestamp}.log`);

    //   if (!fs.existsSync(logDir)) {
    //     fs.mkdirSync(logDir, { recursive: true });
    //   }

    //   const logText =
    //     `=== ASP 昨日分 実行ログ ===\n` +
    //     results.map(r =>
    //       `[${r.name}] ${r.success ? `✅ 成功（${r.count ?? 0}件）` : `❌ 失敗 - ${r.error}`}`
    //     ).join('\n') +
    //     `\n---\n合計: ${results.length}件, 成功: ${succeeded}, 失敗: ${failed}, レコード数: ${totalRecords}, 処理時間: ${Math.round(duration / 1000)}秒`;

    //   fs.writeFileSync(logFile, logText, { encoding: 'utf-8' });
    //   this.logger.log(`📝 ログファイル出力完了: ${logFile}`);
    // } catch (e) {
    //   this.logger.error('❌ ログファイルの出力に失敗しました:', e);
    // }
  }

  // 3分おきに実行される定期処理（ASPのログ取得）
  @Cron("*/3 * * * *")
  async handleAspDataCollection() {

    const timeoutMs = 2 * 60 * 1000; // 2分（120秒）

    if (this.isRunningToday) {
      this.logger.warn("前回のASP処理がまだ完了していません。スキップします。");
      return;
    }

    this.isRunningToday = true;
    this.logger.log("🚀 ASP データ取得処理を開始");
    await this.commonLog.log(
      "info",
      "ASP データ取得処理を開始",
      "AspCronService",
    );

    const startTime = Date.now();
    try {
      // ASPサービスのリスト定義
      const aspServices = [
        // { name: "Cats-Action", service: this.catsActionLogService },
        // { name: "Cats-Click", service: this.catsClickLogService },
        { name: "Finebird-Action", service: this.finebirdActionLogService },
        { name: "Finebird-Click", service: this.finebirdClickLogService },
        { name: "Lad-Action", service: this.LadActionLogService },
        { name: "Lad-Click", service: this.LadClickLogService },
        { name: "Lad-St-Action", service: this.LadStActionLogService },
        { name: "Lad-St-Click", service: this.LadStClickLogService },
        { name: "Lad-Mencpf-Action", service: this.LadMenCpfActionLogService },
        { name: "Lad-Admin-Action", service: this.LadAdminActionLogService },
        { name: "Metron-Click", service: this.metronClickLogService },
        { name: "Metron-Action", service: this.metronActionLogService },
        { name: "Webanntena-Action", service: this.WebanntenaActionLogService },
        // { name: "Monkey-Action", service: this.monkeyActionLogService },
        // { name: "Monkey-Click", service: this.monkeyClickLogService },
        // { name: "Rentracks-Action", service: this.RentracksActionLogService },
        // { name: "Rentracks-Click", service: this.RentracksClickLogService },
        // {
        //   name: "SampleAffiliate-Action",
        //   service: this.sampleAffiliateActionLogService,
        // },
        // {
        //   name: "SampleAffiliate-Click",
        //   service: this.sampleAffiliateClickLogService,
        // },
        // { name: "Try-Action", service: this.tryActionLogService },
        // { name: "Try-Click", service: this.tryClickLogService },
      ];

      // 結果を格納する配列
      const results: ServiceResult[] = [];

      // 全サービスを順番に処理（Semaphoreで同時実行数制御）
      for (const { name, service } of aspServices) {
        // semaphoreを使って同時実行数を制御
        const serviceLogger = new Logger(`ASP:${name}`);
        serviceLogger.debug(`処理を準備中...`);

        try {
          const release = await this.semaphore.acquire();
          serviceLogger.log(`処理を開始`);

          try {
            // タイムアウト付きでサービスを実行（リトライあり）
            const resultValue = await this.executeWithRetry(
              async () =>
                await this.executeWithTimeout(
                  async () => await service.fetchAndInsertLogs(),
                  timeoutMs,
                  `${name} がタイムアウトしました（${timeoutMs}ms）`,
                ),
              name,
              this.MAX_RETRIES,
              serviceLogger,
            );

            const count = Array.isArray(resultValue) ? resultValue.length : resultValue;
            results.push({ name, success: true, count });
            serviceLogger.log(`処理完了: ${count}件のデータを取得`);
            await this.commonLog.log(
              "info",
              `${count}件のデータを取得`,
              `ASP:${name}`,
            );
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;

            results.push({ name, success: false, error: errorMsg });
            serviceLogger.error(`処理失敗: ${errorMsg}`);
            await this.commonLog.logError(`ASP:${name}`, errorMsg, stack);
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

      const summary = `ASP処理結果: 成功=${succeeded}, 失敗=${failed}, 合計=${results.length}, 取得レコード=${totalRecords}, 処理時間=${Math.round(duration / 1000)}秒`;
      this.logger.log(summary);
      await this.commonLog.log("info", summary, "AspCronService");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`ASP処理でエラーが発生: ${errorMsg}`);
      await this.commonLog.logError("AspCronService", errorMsg, stack);
    } finally {
      this.isRunningToday = false;
    }
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
            `ASP:${serviceName}`,
          );
        }

        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 最後のリトライでなければ待機してリトライ
        if (attempt < maxRetries) {
          const waitTime = 3000; // 3秒待機
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
