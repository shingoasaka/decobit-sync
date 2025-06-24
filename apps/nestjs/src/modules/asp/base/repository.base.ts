import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType, Prisma } from "@operate-ad/prisma";
import { getNowJstForDB } from "src/libs/date-utils";
import { startOfDay } from "date-fns";

/**
 * ASPのリポジトリの基底クラス
 *
 * 責務:
 * - クリックログとアクションログのDB保存
 * - スナップショット管理（クリック数の差分計算用）
 * - トランザクション処理
 */

// 共通のデータベース保存形式
interface IndividualClickLog {
  clickDateTime: Date;
  affiliate_link_id: number;
  referrer_link_id?: number | null;
  referrer_url?: string | null;
}

interface TotalClickLog {
  affiliate_link_id: number;
  current_total_clicks: number;
  referrer_link_id?: number | null;
  referrer_url?: string | null;
}

interface ActionLog {
  actionDateTime: Date;
  affiliate_link_id: number;
  referrer_link_id?: number | null;
  referrer_url?: string | null;
  uid?: string | null;
}

/**
 * UTMパラメータからクリエイティブ値を抽出
 * @param referrer_url リファラURL
 * @returns utm_creativeパラメータの値、またはnull
 */
export function extractUtmCreative(referrer_url: string | null): string | null {
  if (!referrer_url) return null;
  try {
    const url = new URL(referrer_url);
    const utmCreative = url.searchParams.get("utm_creative");
    return utmCreative || null;
  } catch (error) {
    // URLのパースに失敗した場合はnullを返す
    return null;
  }
}

/**
 * リファラリンクの処理
 * - 既存のリファラリンクを検索
 * - 存在しない場合は新規作成
 * - 競合発生時は再検索
 */
export async function processReferrerLink(
  prisma: PrismaService,
  logger: Logger,
  referrer_url: string | null,
): Promise<{ referrerLinkId: number | null; referrer_url: string | null }> {
  if (!referrer_url) {
    return { referrerLinkId: null, referrer_url: null };
  }

  const creativeValue = extractUtmCreative(referrer_url);
  if (!creativeValue) {
    return { referrerLinkId: null, referrer_url };
  }

  try {
    const link = await prisma.referrerLink.upsert({
      where: {
        creative_value: creativeValue,
      },
      create: {
        creative_value: creativeValue,
      },
      update: {}, // 既存のレコードは更新不要
    });

    return { referrerLinkId: link.id, referrer_url };
  } catch (error) {
    logger.warn(
      `Failed to process referrer link for creative value: ${creativeValue}`,
      error,
    );
    return { referrerLinkId: null, referrer_url };
  }
}

@Injectable()
export abstract class BaseActionLogRepository {
  protected readonly logger: Logger;
  protected readonly format = "individual" as const;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly aspType: AspType,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async processReferrerLink(
    referrer_url: string | null,
  ): Promise<{ referrerLinkId: number | null; referrer_url: string | null }> {
    if (!referrer_url) {
      return { referrerLinkId: null, referrer_url: null };
    }

    const creativeValue = this.extractUtmCreative(referrer_url);
    if (!creativeValue) {
      return { referrerLinkId: null, referrer_url };
    }

    try {
      const link = await this.prisma.referrerLink.upsert({
        where: {
          creative_value: creativeValue,
        },
        create: {
          creative_value: creativeValue,
        },
        update: {}, // 既存のレコードは更新不要
      });

      return { referrerLinkId: link.id, referrer_url };
    } catch (error) {
      this.logger.warn(
        `Failed to process referrer link for creative value: ${creativeValue}`,
        error,
      );
      return { referrerLinkId: null, referrer_url };
    }
  }

  protected extractUtmCreative(referrer_url: string): string | null {
    try {
      const url = new URL(referrer_url);
      const utmCreative = url.searchParams.get("utm_creative");
      return utmCreative || null;
    } catch (error) {
      return null;
    }
  }

  protected async saveToCommonTable(data: ActionLog[]): Promise<number> {
    const now = getNowJstForDB();
    const actionLogs = data.map((item) => ({
      asp_type: this.aspType,
      action_date_time: item.actionDateTime,
      affiliate_link_id: item.affiliate_link_id,
      referrer_link_id: item.referrer_link_id ?? null,
      referrer_url: item.referrer_url ?? null,
      uid: item.uid ?? null,
      created_at: now,
      updated_at: now,
    }));

    const result = await this.prisma.aspActionLog.createMany({
      data: actionLogs,
      skipDuplicates: true,
    });

    this.logger.log(`Saved ${result.count} action logs`);
    return result.count;
  }
}

@Injectable()
export abstract class BaseAspRepository {
  protected readonly logger: Logger;
  protected abstract readonly format: "individual" | "total";

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly aspType: AspType,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  protected extractUtmCreative(referrer_url: string): string | null {
    try {
      const url = new URL(referrer_url);
      const utmCreative = url.searchParams.get("utm_creative");
      return utmCreative || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 最新のスナップショットを取得
   * 日次でのクリック数推移を記録するために使用
   */
  protected async getLastSnapshot(
    affiliateLinkId: number,
  ): Promise<{ current_total_clicks: number; snapshotDate: Date } | null> {
    const now = getNowJstForDB();
    const today = startOfDay(now);

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        asp_type: this.aspType,
        affiliate_link_id: affiliateLinkId,
        snapshot_date: today,
      },
      select: { current_total_clicks: true, snapshot_date: true },
    });

    this.logger.debug(
      `Last snapshot for ${this.aspType}/${affiliateLinkId}: ${snapshot?.current_total_clicks ?? "none"}`,
    );
    return snapshot
      ? {
          current_total_clicks: snapshot.current_total_clicks,
          snapshotDate: snapshot.snapshot_date,
        }
      : null;
  }

  /**
   * 指定日付のスナップショットを取得
   * 差分計算時に使用
   */
  protected async getSnapshotForDate(
    affiliateLinkId: number,
    date: Date,
  ): Promise<{ current_total_clicks: number } | null> {
    const targetDate = startOfDay(date);

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        asp_type: this.aspType,
        affiliate_link_id: affiliateLinkId,
        snapshot_date: targetDate,
      },
      select: { current_total_clicks: true },
    });

    this.logger.debug(
      `Snapshot for ${this.aspType}/${affiliateLinkId} on ${targetDate.toISOString()}: ${snapshot?.current_total_clicks ?? "none"}`,
    );
    return snapshot;
  }

  /**
   * 現在のクリック数を取得
   * スナップショット更新時に使用
   */
  protected async getCurrentClickCount(
    affiliateLinkId: number,
  ): Promise<number> {
    const count = await this.prisma.aspClickLog.count({
      where: {
        asp_type: this.aspType,
        affiliate_link_id: affiliateLinkId,
      },
    });
    return count;
  }

  /**
   * スナップショットを保存
   * 日次でのクリック数推移を記録
   */
  private async saveSnapshot(data: {
    affiliate_link_id: number;
    current_total_clicks: number;
  }): Promise<void> {
    const now = getNowJstForDB();
    const today = startOfDay(now);

    await this.prisma.clickLogSnapshot.upsert({
      where: {
        asp_type_affiliate_link_id_snapshot_date: {
          asp_type: this.aspType,
          affiliate_link_id: data.affiliate_link_id,
          snapshot_date: today,
        },
      },
      create: {
        asp_type: this.aspType,
        affiliate_link_id: data.affiliate_link_id,
        current_total_clicks: data.current_total_clicks,
        snapshot_date: today,
        created_at: now,
        updated_at: now,
      },
      update: {
        current_total_clicks: data.current_total_clicks,
        updated_at: now,
      },
    });

    this.logger.debug(
      `Saved new snapshot for ${this.aspType}/${data.affiliate_link_id}: ${data.current_total_clicks} at ${today.toISOString()}`,
    );
  }

  /**
   * 共通テーブルにデータを保存
   * - アクションログ: 直接保存
   * - クリックログ: 個別/総クリックに応じて処理
   */
  protected async saveToCommonTable(
    data: ActionLog[] | IndividualClickLog[] | TotalClickLog[],
  ): Promise<number> {
    try {
      const now = getNowJstForDB();
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        "actionDateTime" in data[0]
      ) {
        // ActionLog
        const actionLogs = (data as ActionLog[]).map((item) => ({
          asp_type: this.aspType,
          action_date_time: item.actionDateTime,
          affiliate_link_id: item.affiliate_link_id,
          referrer_url: item.referrer_url,
          referrer_link_id: item.referrer_link_id ?? null,
          uid: item.uid ?? null,
          created_at: now,
          updated_at: now,
        }));
        const result = await this.prisma.aspActionLog.createMany({
          data: actionLogs,
          skipDuplicates: true,
        });
        this.logger.log(`Saved ${result.count} action logs`);
        return result.count;
      } else if (this.format === "individual") {
        // IndividualClickLog
        return this.processIndividualClickLogs(data as IndividualClickLog[]);
      } else {
        // TotalClickLog
        return this.processTotalClickLog(data as TotalClickLog[]);
      }
    } catch (error) {
      this.logger.error(
        `Error saving to aspClickLog for ${this.aspType}:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  /**
   * 個別クリックログの処理
   * - クリックログを直接保存
   * - スナップショットを更新
   */
  private async processIndividualClickLogs(
    data: IndividualClickLog[],
  ): Promise<number> {
    try {
      const now = getNowJstForDB();
      const clickLogs = data
        .filter((item) => item.clickDateTime !== undefined)
        .map((item) => ({
          asp_type: this.aspType,
          click_date_time: item.clickDateTime,
          affiliate_link_id: item.affiliate_link_id,
          referrer_url: item.referrer_url ?? null,
          created_at: now,
          updated_at: now,
        }));
      return await this.prisma.$transaction(async (tx) => {
        const result = await tx.aspClickLog.createMany({
          data: clickLogs,
          skipDuplicates: true,
        });
        // スナップショットの更新
        if (result.count > 0 && clickLogs[0]?.affiliate_link_id) {
          const currentTotal = await this.getCurrentClickCount(
            clickLogs[0].affiliate_link_id,
          );
          await this.saveSnapshot({
            affiliate_link_id: clickLogs[0].affiliate_link_id,
            current_total_clicks: currentTotal,
          });
        }
        return result.count;
      });
    } catch (error) {
      this.logger.error(
        `Error processing individual click logs:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  /**
   * 総クリックログの処理
   * - 差分を計算
   * - クリックログを保存
   * - スナップショットを更新
   */
  private async processTotalClickLog(data: TotalClickLog[]): Promise<number> {
    try {
      const now = getNowJstForDB();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      today.setHours(0, 0, 0, 0);

      // スナップショットを取得
      const snapshots = await this.prisma.clickLogSnapshot.findMany({
        where: {
          asp_type: this.aspType,
          snapshot_date: today,
          affiliate_link_id: {
            in: data.map((item) => item.affiliate_link_id),
          },
        },
      });

      let totalSaved = 0;
      for (const item of data) {
        try {
          const snapshot = snapshots.find(
            (s) => s.affiliate_link_id === item.affiliate_link_id,
          );
          const todayLastClicks = snapshot?.current_total_clicks ?? 0;
          const diff = item.current_total_clicks - todayLastClicks;

          if (diff <= 0) {
            this.logger.debug(
              `Skipping ${this.aspType}/${item.affiliate_link_id}: current=${item.current_total_clicks}, last=${todayLastClicks}, diff=${diff}`,
            );
            // スナップショットが存在しない場合のみ作成
            if (!snapshot) {
              await this.updateSnapshot(item, today, now);
            }
            continue;
          }

          // クリックログの保存
          await this.saveClickLogs(item, diff, today, now);

          // クリックログ保存成功後にスナップショットを更新
          await this.updateSnapshot(item, today, now);

          totalSaved += diff;
          this.logger.debug(
            `Processed ${this.aspType}/${item.affiliate_link_id}: current=${item.current_total_clicks}, last=${todayLastClicks}, diff=${diff}, saved=${totalSaved}`,
          );
        } catch (itemError) {
          this.logger.error(
            `Error processing item ${item.affiliate_link_id}:`,
            itemError instanceof Error ? itemError.stack : itemError,
          );
          continue;
        }
      }
      return totalSaved;
    } catch (error) {
      this.logger.error(
        `Error processing total click log:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  // スナップショット更新の共通処理
  private async updateSnapshot(
    item: TotalClickLog,
    today: Date,
    now: Date,
  ): Promise<void> {
    // スナップショットが存在する場合は、値が変更された場合のみ更新
    const existingSnapshot = await this.prisma.clickLogSnapshot.findUnique({
      where: {
        asp_type_affiliate_link_id_snapshot_date: {
          asp_type: this.aspType,
          affiliate_link_id: item.affiliate_link_id,
          snapshot_date: today,
        },
      },
    });

    if (
      existingSnapshot &&
      existingSnapshot.current_total_clicks === item.current_total_clicks
    ) {
      this.logger.debug(
        `Skipping snapshot update for ${this.aspType}/${item.affiliate_link_id}: value unchanged (${item.current_total_clicks})`,
      );
      return;
    }

    await this.prisma.clickLogSnapshot.upsert({
      where: {
        asp_type_affiliate_link_id_snapshot_date: {
          asp_type: this.aspType,
          affiliate_link_id: item.affiliate_link_id,
          snapshot_date: today,
        },
      },
      create: {
        asp_type: this.aspType,
        affiliate_link_id: item.affiliate_link_id,
        current_total_clicks: item.current_total_clicks,
        snapshot_date: today,
        created_at: now,
        updated_at: now,
      },
      update: {
        current_total_clicks: item.current_total_clicks,
        updated_at: now,
      },
    });

    this.logger.debug(
      `Updated snapshot for ${this.aspType}/${item.affiliate_link_id}: ${item.current_total_clicks}`,
    );
  }

  // クリックログ保存の共通処理
  private async saveClickLogs(
    item: TotalClickLog,
    diff: number,
    today: Date,
    now: Date,
  ): Promise<void> {
    const batchSize = 1000;
    const newClicks = Array.from({ length: diff }, (_, i) => {
      const clickDateTime = new Date(now.getTime());
      const interval = (3 * 60 * 1000) / diff;
      clickDateTime.setMilliseconds(now.getMilliseconds() + i * interval);
      return {
        asp_type: this.aspType,
        click_date_time: clickDateTime,
        affiliate_link_id: item.affiliate_link_id,
        referrer_url: item.referrer_url ?? null,
        created_at: now,
        updated_at: now,
      };
    });

    for (let i = 0; i < newClicks.length; i += batchSize) {
      const batch = newClicks.slice(i, i + batchSize);
      await this.prisma.aspClickLog.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
  }
}
