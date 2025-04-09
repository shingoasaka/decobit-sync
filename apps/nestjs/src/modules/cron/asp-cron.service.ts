import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CatsActionLogService } from "../asp/cats/services/action-logs.service";
import { CatsClickLogService } from "../asp/cats/services/click-logs.service";
import { FinebirdActionLogService } from "../asp/finebird/services/action-logs.service";
import { FinebirdClickLogService } from "../asp/finebird/services/click-logs.service";
import { TryActionLogService } from "../asp/hanikamu/try/action-logs.service";
import { TryClickLogService } from "../asp/hanikamu/try/click-logs.service";
import { LadActionLogService } from "../asp/lad/service/action-logs.service";
import { LadClickLogService } from "../asp/lad/service/click-logs.service";
import { MetronActionLogService } from "../asp/metron/service/action-logs.service";
import { MetronClickLogService } from "../asp/metron/service/click-logs.service";
import { MonkeyActionLogService } from "../asp/monkey/services/action-logs.service";
import { MonkeyClickLogService } from "../asp/monkey/services/click-logs.service";
import { RentracksActionLogService } from "../asp/rentracks/services/action-logs.service";
import { RentracksClickLogService } from "../asp/rentracks/services/click-logs.service";
import { SampleAffiliateActionLogService } from "../asp/sampleAffiliate/services/action-logs.service";
import { SampleAffiliateClickLogService } from "../asp/sampleAffiliate/services/click-logs.service";

@Injectable()
export class AspCronService {
  constructor(
    private readonly catsActionLogService: CatsActionLogService,
    private readonly catsClickLogService: CatsClickLogService,
    private readonly finebirdActionLogService: FinebirdActionLogService,
    private readonly finebirdClickLogService: FinebirdClickLogService,
    private readonly LadActionLogService: LadActionLogService,
    private readonly LadClickLogService: LadClickLogService,
    private readonly MetronActionLogService: MetronActionLogService,
    private readonly MetronClickLogService: MetronClickLogService,
    private readonly monkeyActionLogService: MonkeyActionLogService,
    private readonly monkeyClickLogService: MonkeyClickLogService,
    private readonly RentracksActionLogService: RentracksActionLogService,
    private readonly RentracksClickLogService: RentracksClickLogService,
    private readonly sampleAffiliateActionLogService: SampleAffiliateActionLogService,
    private readonly sampleAffiliateClickLogService: SampleAffiliateClickLogService,
    private readonly tryActionLogService: TryActionLogService,
    private readonly tryClickLogService: TryClickLogService,
  ) {}

  // 1分おきに実行される定期処理（各ASPのログ取得）
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAspDataCollection() {
    console.log("🕐 Cron開始: ASPデータ取得");

    // 各ASPを並列実行、失敗しても止めないように allSettled
    await Promise.allSettled([
      this.executeWithErrorHandling("Cats", async () => {
        const a = await this.catsActionLogService.fetchAndInsertLogs();
        const c = await this.catsClickLogService.fetchAndInsertLogs();
        console.log(`✅ Cats: Action=${a}, Click=${c}`);
      }),

      this.executeWithErrorHandling("Finebird", async () => {
        const a = await this.finebirdActionLogService.fetchAndInsertLogs();
        const c = await this.finebirdClickLogService.fetchAndInsertLogs();
        console.log(`✅ Finebird: Action=${a}, Click=${c}`);
      }),

      this.executeWithErrorHandling("Hanikamu-Try", async () => {
        const a = await this.tryActionLogService.fetchAndInsertLogs();
        const c = await this.tryClickLogService.fetchAndInsertLogs();
        console.log(`✅ Hanikamu-Try: Action=${a}, Click=${c}`);
      }),

      this.executeWithErrorHandling("Lad", async () => {
        const a = await this.LadActionLogService.fetchAndInsertLogs();
        const c = await this.LadClickLogService.fetchAndInsertLogs();
        console.log(`✅ Lad: Action=${a}, Click=${c}`);
      }),

      this.executeWithErrorHandling("Metron", async () => {
        const a = await this.MetronActionLogService.fetchAndInsertLogs();
        const c = await this.MetronClickLogService.fetchAndInsertLogs();
        console.log(`✅ Metron: Action=${a}, Click=${c}`);
      }),

      this.executeWithErrorHandling("Monkey", async () => {
        const a = await this.monkeyActionLogService.fetchAndInsertLogs();
        const c = await this.monkeyClickLogService.fetchAndInsertLogs();
        console.log(`✅ Monkey: Action=${a}, Click=${c}`);
      }),

      this.executeWithErrorHandling("Rentracks", async () => {
        const a = await this.RentracksActionLogService.fetchAndInsertLogs();
        const c = await this.RentracksClickLogService.fetchAndInsertLogs();
        console.log(`✅ Rentracks: Action=${a}, Click=${c}`);
      }),

      this.executeWithErrorHandling("SampleAffiliate", async () => {
        const a =
          await this.sampleAffiliateActionLogService.fetchAndInsertLogs();
        const c =
          await this.sampleAffiliateClickLogService.fetchAndInsertLogs();
        console.log(`✅ SampleAffiliate: Action=${a}, Click=${c}`);
      }),
    ]);

    console.log("✅ Cron完了: ASPデータ取得");
  }

  // 個別ASPの処理 + エラーを潰す共通ハンドラ
  private async executeWithErrorHandling(
    aspName: string,
    action: () => Promise<void>,
  ) {
    try {
      await action();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`❌ ${aspName}: エラー発生 → ${error.message}`);
      } else {
        console.error(`❌ ${aspName}: 不明なエラー`);
      }
    }
  }
}
