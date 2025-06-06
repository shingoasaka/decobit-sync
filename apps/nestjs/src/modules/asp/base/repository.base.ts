import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType, Prisma } from "@operate-ad/prisma";
import { getNowJstForDB } from "src/libs/date-utils";
import { startOfDay } from "date-fns";
// 共通のデータベース保存形式
interface IndividualClickLog {
  clickDateTime: Date;
  affiliate_link_id: number;
  referrer_link_id?: number | null;
  referrerUrl?: string | null;
}

interface TotalClickLog {
  affiliate_link_id: number;
  currentTotalClicks: number;
  referrer_link_id?: number | null;
  referrerUrl?: string | null;
}

interface ActionLog {
  actionDateTime: Date | null;
  affiliate_link_id: number;
  referrer_link_id?: number | null;
  referrerUrl?: string | null;
  uid?: string | null;
}

export function extractUtmCreative(referrerUrl: string | null): string | null {
  if (!referrerUrl) return null;
  try {
    const url = new URL(referrerUrl);
    const utmCreative = url.searchParams.get("utm_creative");
    return utmCreative || null;
  } catch (error) {
    // URLのパースに失敗した場合はnullを返す
    return null;
  }
}

export async function processReferrerLink(
  prisma: PrismaService,
  logger: Logger,
  referrerUrl: string | null,
): Promise<{ referrerLinkId: number | null; referrerUrl: string | null }> {
  if (!referrerUrl) {
    return { referrerLinkId: null, referrerUrl: null };
  }

  const creativeValue = extractUtmCreative(referrerUrl);
  if (!creativeValue) {
    return { referrerLinkId: null, referrerUrl };
  }

  try {
    // まず既存のレコードを検索
    const existingLink = await prisma.referrerLink.findUnique({
      where: {
        creative_value: creativeValue,
      },
    });

    if (existingLink) {
      return { referrerLinkId: existingLink.id, referrerUrl };
    }

    // 存在しない場合のみ新規作成
    const newLink = await prisma.referrerLink.create({
      data: {
        creative_value: creativeValue,
      },
    });

    return { referrerLinkId: newLink.id, referrerUrl };
  } catch (error: any) {
    // 作成時に競合が発生した場合（他のプロセスが同時に作成した場合）
    if (error.code === "P2002") {
      // 再度検索して既存のレコードを取得
      const existingLink = await prisma.referrerLink.findUnique({
        where: {
          creative_value: creativeValue,
        },
      });
      if (existingLink) {
        return { referrerLinkId: existingLink.id, referrerUrl };
      }
    }
    logger.warn(
      `Failed to process referrer link for creative value: ${creativeValue}`,
      error,
    );
    return { referrerLinkId: null, referrerUrl };
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

  protected async saveToCommonTable(data: ActionLog[]): Promise<number> {
    const now = getNowJstForDB();
    const actionLogs = data.map((item) => ({
      asp_type: this.aspType,
      action_date_time: item.actionDateTime,
      affiliate_link_id: item.affiliate_link_id,
      referrer_link_id: item.referrer_link_id ?? null,
      referrer_url: item.referrerUrl ?? null,
      uid: item.uid ?? null,
      created_at: now,
      updated_at: now,
    }));

    const result = await this.prisma.aspActionLog.createMany({
      data: actionLogs as Prisma.AspActionLogCreateManyInput[],
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

  protected async getLastSnapshot(
    affiliateLinkId: number,
  ): Promise<{ currentTotalClicks: number; snapshotDate: Date } | null> {
    const now = getNowJstForDB();
    const today = startOfDay(now);

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        asp_type: this.aspType,
        affiliate_link_id: affiliateLinkId,
        snapshot_date: today,
      },
      select: { currentTotalClicks: true, snapshot_date: true },
    });

    this.logger.debug(
      `Last snapshot for ${this.aspType}/${affiliateLinkId}: ${snapshot?.currentTotalClicks ?? "none"}`,
    );
    return snapshot
      ? {
          currentTotalClicks: snapshot.currentTotalClicks,
          snapshotDate: snapshot.snapshot_date,
        }
      : null;
  }

  protected async getSnapshotForDate(
    affiliateLinkId: number,
    date: Date,
  ): Promise<{ currentTotalClicks: number } | null> {
    const targetDate = startOfDay(date);

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        asp_type: this.aspType,
        affiliate_link_id: affiliateLinkId,
        snapshot_date: targetDate,
      },
      select: { currentTotalClicks: true },
    });

    this.logger.debug(
      `Snapshot for ${this.aspType}/${affiliateLinkId} on ${targetDate.toISOString()}: ${snapshot?.currentTotalClicks ?? "none"}`,
    );
    return snapshot;
  }

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

  private async saveSnapshot(data: {
    affiliate_link_id: number;
    currentTotalClicks: number;
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
        currentTotalClicks: data.currentTotalClicks,
        snapshot_date: today,
        created_at: now,
        updated_at: now,
      },
      update: {
        currentTotalClicks: data.currentTotalClicks,
        updated_at: now,
      },
    });

    this.logger.debug(
      `Saved new snapshot for ${this.aspType}/${data.affiliate_link_id}: ${data.currentTotalClicks} at ${today.toISOString()}`,
    );
  }

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
          referrer_url: item.referrerUrl,
          referrer_link_id: item.referrer_link_id ?? null,
          uid: item.uid ?? null,
          created_at: now,
          updated_at: now,
        }));
        const result = await this.prisma.aspActionLog.createMany({
          data: actionLogs as Prisma.AspActionLogCreateManyInput[],
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
          referrer_url: item.referrerUrl ?? null,
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
            currentTotalClicks: currentTotal,
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
          const todayLastClicks = snapshot?.currentTotalClicks ?? 0;
          const diff = item.currentTotalClicks - todayLastClicks;

          if (diff <= 0) {
            this.logger.debug(
              `Skipping ${this.aspType}/${item.affiliate_link_id}: current=${item.currentTotalClicks}, last=${todayLastClicks}, diff=${diff}`,
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
            `Processed ${this.aspType}/${item.affiliate_link_id}: current=${item.currentTotalClicks}, last=${todayLastClicks}, diff=${diff}, saved=${totalSaved}`,
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
      existingSnapshot.currentTotalClicks === item.currentTotalClicks
    ) {
      this.logger.debug(
        `Skipping snapshot update for ${this.aspType}/${item.affiliate_link_id}: value unchanged (${item.currentTotalClicks})`,
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
        currentTotalClicks: item.currentTotalClicks,
        snapshot_date: today,
        created_at: now,
        updated_at: now,
      },
      update: {
        currentTotalClicks: item.currentTotalClicks,
        updated_at: now,
      },
    });

    this.logger.debug(
      `Updated snapshot for ${this.aspType}/${item.affiliate_link_id}: ${item.currentTotalClicks}`,
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
        referrer_url: item.referrerUrl ?? null,
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
