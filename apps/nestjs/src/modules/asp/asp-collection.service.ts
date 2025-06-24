import { Injectable, Logger } from "@nestjs/common";
import { CatsActionLogService } from "@asp/cats/services/action-logs.service";
import { CatsClickLogService } from "@asp/cats/services/click-logs.service";
import { FinebirdActionLogService } from "@asp/finebird/services/action-logs.service";
import { FinebirdClickLogService } from "@asp/finebird/services/click-logs.service";
import { TryActionLogService } from "@asp/hanikamu/try/action-logs.service";
import { TryClickLogService } from "@asp/hanikamu/try/click-logs.service";
import { LadActionLogService } from "@asp/lad/services/action-logs.service";
import { LadClickLogService } from "@asp/lad/services/click-logs.service";
import { MetronActionLogService } from "@asp/metron/services/action-logs.service";
import { MetronClickLogService } from "@asp/metron/services/click-logs.service";
import { MonkeyActionLogService } from "@asp/monkey/services/action-logs.service";
import { MonkeyClickLogService } from "@asp/monkey/services/click-logs.service";
import { RentracksActionLogService } from "@asp/rentracks/services/action-logs.service";
import { RentracksClickLogService } from "@asp/rentracks/services/click-logs.service";
import { SampleAffiliateActionLogService } from "@asp/sampleAffiliate/services/action-logs.service";
import { SampleAffiliateClickLogService } from "@asp/sampleAffiliate/services/click-logs.service";
import { CommonLogService } from "@logs/common-log.service";

// 実行結果の型定義
interface ServiceResult {
  name: string;
  success: boolean;
  count?: number;
  error?: string;
}

interface CollectionResults {
  succeeded: number;
  failed: number;
  total: number;
  totalRecords: number;
  duration: number;
  details: ServiceResult[];
}

@Injectable()
export class AspCollectionService {
  private readonly logger = new Logger(AspCollectionService.name);
  // タイムアウトとリトライ機能は削除

  constructor(
    private readonly catsActionLogService: CatsActionLogService,
    private readonly catsClickLogService: CatsClickLogService,
    private readonly finebirdActionLogService: FinebirdActionLogService,
    private readonly finebirdClickLogService: FinebirdClickLogService,
    private readonly LadActionLogService: LadActionLogService,
    private readonly LadClickLogService: LadClickLogService,
    private readonly metronActionLogService: MetronActionLogService,
    private readonly metronClickLogService: MetronClickLogService,
    private readonly monkeyActionLogService: MonkeyActionLogService,
    private readonly monkeyClickLogService: MonkeyClickLogService,
    private readonly RentracksActionLogService: RentracksActionLogService,
    private readonly RentracksClickLogService: RentracksClickLogService,
    private readonly sampleAffiliateActionLogService: SampleAffiliateActionLogService,
    private readonly sampleAffiliateClickLogService: SampleAffiliateClickLogService,
    private readonly tryActionLogService: TryActionLogService,
    private readonly tryClickLogService: TryClickLogService,
    private readonly commonLog: CommonLogService,
  ) {}

  /**
   * 特定のASPのデータを取得する
   */
  public collectSpecificAspData = async (aspNames: string[]) => {
    this.logger.log("🚀 ASP データ取得処理を開始（API経由）");

    const startTime = Date.now();

    // ASPサービスのリスト定義
    const aspServices = [
      { name: "Cats-Action", service: this.catsActionLogService },
      { name: "Cats-Click", service: this.catsClickLogService },
      { name: "Finebird-Action", service: this.finebirdActionLogService },
      { name: "Finebird-Click", service: this.finebirdClickLogService },
      { name: "Lad-Action", service: this.LadActionLogService },
      { name: "Lad-Click", service: this.LadClickLogService },
      { name: "Metron-Click", service: this.metronClickLogService },
      { name: "Metron-Action", service: this.metronActionLogService },
      { name: "Monkey-Action", service: this.monkeyActionLogService },
      { name: "Monkey-Click", service: this.monkeyClickLogService },
      { name: "Rentracks-Action", service: this.RentracksActionLogService },
      { name: "Rentracks-Click", service: this.RentracksClickLogService },
      {
        name: "SampleAffiliate-Action",
        service: this.sampleAffiliateActionLogService,
      },
      {
        name: "SampleAffiliate-Click",
        service: this.sampleAffiliateClickLogService,
      },
      { name: "Try-Action", service: this.tryActionLogService },
      { name: "Try-Click", service: this.tryClickLogService },
    ];

    const targetAspServices = aspServices.filter((asp) =>
      aspNames.includes(asp.name),
    );

    // 結果を格納する配列
    const results: ServiceResult[] = [];

    // 指定されたサービスを順番に処理
    for (const { name, service } of targetAspServices) {
      const serviceLogger = new Logger(`ASP:${name}`);

      serviceLogger.log(`処理を開始`);

      try {
        // リトライとタイムアウト機能を削除し、直接サービスを実行
        const count = await service.fetchAndInsertLogs();

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

    const summary = `ASP処理結果（API経由）: 成功=${succeeded}, 失敗=${failed}, 合計=${results.length}, 取得レコード=${totalRecords}, 処理時間=${Math.round(duration / 1000)}秒`;
    this.logger.log(summary);
    await this.commonLog.log("info", summary, "AspCollectionService");

    return {
      succeeded,
      failed,
      total: results.length,
      totalRecords,
      duration: Math.round(duration / 1000),
      details: results,
    };
  };

  // async collectAllAspData(): Promise<CollectionResults> {
  //   this.logger.log('🚀 ASP データ取得処理を開始（API経由）');
  //   await this.commonLog.log(
  //     'info',
  //     'ASP データ取得処理を開始（API経由）',
  //     'AspCollectionService',
  //   );

  //   const startTime = Date.now();

  //   // ASPサービスのリスト定義
  //   const aspServices = [
  //     { name: 'Cats-Action', service: this.catsActionLogService },
  //     { name: 'Cats-Click', service: this.catsClickLogService },
  //     { name: 'Finebird-Action', service: this.finebirdActionLogService },
  //     { name: 'Finebird-Click', service: this.finebirdClickLogService },
  //     { name: 'Lad-Action', service: this.LadActionLogService },
  //     { name: 'Lad-Click', service: this.LadClickLogService },
  //     { name: 'Metron-Click', service: this.metronClickLogService },
  //     { name: 'Metron-Action', service: this.metronActionLogService },
  //     { name: 'Monkey-Action', service: this.monkeyActionLogService },
  //     { name: 'Monkey-Click', service: this.monkeyClickLogService },
  //     { name: 'Rentracks-Action', service: this.RentracksActionLogService },
  //     { name: 'Rentracks-Click', service: this.RentracksClickLogService },
  //     {
  //       name: 'SampleAffiliate-Action',
  //       service: this.sampleAffiliateActionLogService,
  //     },
  //     {
  //       name: 'SampleAffiliate-Click',
  //       service: this.sampleAffiliateClickLogService,
  //     },
  //     { name: 'Try-Action', service: this.tryActionLogService },
  //     { name: 'Try-Click', service: this.tryClickLogService },
  //   ];

  //   // 結果を格納する配列
  //   const results: ServiceResult[] = [];

  //   // 全サービスを順番に処理（Semaphoreで同時実行数制御）
  //   for (const { name, service } of aspServices) {
  //     // semaphoreを使って同時実行数を制御
  //     const serviceLogger = new Logger(`ASP:${name}`);
  //     serviceLogger.debug(`処理を準備中...`);

  //     try {
  //       const release = await this.semaphore.acquire();
  //       serviceLogger.log(`処理を開始`);

  //       try {
  //         // タイムアウト付きでサービスを実行（リトライあり）
  //         const count = await this.executeWithRetry(
  //           async () =>
  //             await this.executeWithTimeout(
  //               async () => await service.fetchAndInsertLogs(),
  //               this.TIMEOUT_MS,
  //               `${name} がタイムアウトしました（${this.TIMEOUT_MS}ms）`,
  //             ),
  //           name,
  //           this.MAX_RETRIES,
  //           serviceLogger,
  //         );

  //         results.push({ name, success: true, count });
  //         serviceLogger.log(`処理完了: ${count}件のデータを取得`);
  //         await this.commonLog.log(
  //           'info',
  //           `${count}件のデータを取得`,
  //           `ASP:${name}`,
  //         );
  //       } catch (error) {
  //         const errorMsg =
  //           error instanceof Error ? error.message : String(error);
  //         const stack = error instanceof Error ? error.stack : undefined;

  //         results.push({ name, success: false, error: errorMsg });
  //         serviceLogger.error(`処理失敗: ${errorMsg}`);
  //         await this.commonLog.logError(`ASP:${name}`, errorMsg, stack);
  //       } finally {
  //         // semaphoreを解放
  //         release();
  //       }
  //     } catch (error) {
  //       const errorMsg = error instanceof Error ? error.message : String(error);
  //       results.push({ name, success: false, error: errorMsg });
  //       serviceLogger.error(`前処理でエラー: ${errorMsg}`);
  //     }
  //   }

  //   // 結果のサマリーを作成
  //   const succeeded = results.filter((r) => r.success).length;
  //   const failed = results.filter((r) => !r.success).length;
  //   const totalRecords = results.reduce(
  //     (acc, r) => acc + (r.success && r.count ? r.count : 0),
  //     0,
  //   );
  //   const duration = Date.now() - startTime;

  //   const summary = `ASP処理結果（API経由）: 成功=${succeeded}, 失敗=${failed}, 合計=${results.length}, 取得レコード=${totalRecords}, 処理時間=${Math.round(duration / 1000)}秒`;
  //   this.logger.log(summary);
  //   await this.commonLog.log('info', summary, 'AspCollectionService');

  //   return {
  //     succeeded,
  //     failed,
  //     total: results.length,
  //     totalRecords,
  //     duration: Math.round(duration / 1000),
  //     details: results,
  //   };
  // }

  // タイムアウトとリトライ機能は削除
}
