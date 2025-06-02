import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType, Prisma } from "@operate-ad/prisma";
import { getNowJstForDB } from "src/libs/date-utils";
import { startOfDay } from "date-fns";
// 共通のデータベース保存形式
interface IndividualClickLog {
  clickDateTime: Date;
  affiliateLinkName: string;
  referrerUrl?: string | null;
}

interface TotalClickLog {
  affiliateLinkName: string;
  currentTotalClicks: number;
  referrerUrl?: string | null;
}

interface ActionLog {
  actionDateTime: Date | null;
  affiliateLinkName: string;
  referrerUrl?: string | null;
  uid?: string | null;
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
    try {
      const now = getNowJstForDB();
      const actionLogs = data.map((item) => ({
        asp_type: this.aspType,
        action_date_time: item.actionDateTime,
        affiliate_link_id: item.affiliateLinkName,
        referrer_url: item.referrerUrl,
        uid: item.uid,
        created_at: now,
        updated_at: now,
      }));

      const result = await this.prisma.aspActionLog.createMany({
        data: actionLogs as Prisma.AspActionLogCreateManyInput[],
        skipDuplicates: true,
      });

      this.logger.log(`Saved ${result.count} action logs`);
      return result.count;
    } catch (error) {
      this.logger.error(
        `Error saving action logs:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
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
    affiliateLinkName: string,
  ): Promise<{ currentTotalClicks: number; snapshotDate: Date } | null> {
    const now = getNowJstForDB();
    const today = startOfDay(now);

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        asp_type: this.aspType,
        affiliate_link_id: affiliateLinkName,
        snapshot_date: today,
      },
      select: { current_total_clicks: true, snapshot_date: true },
    });

    this.logger.debug(
      `Last snapshot for ${this.aspType}/${affiliateLinkName}: ${snapshot?.currentTotalClicks ?? "none"}`,
    );
    return snapshot;
  }

  protected async getSnapshotForDate(
    affiliateLinkName: string,
    date: Date,
  ): Promise<{ currentTotalClicks: number } | null> {
    const targetDate = startOfDay(date);

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        asp_type: this.aspType,
        affiliate_link_id: affiliateLinkName,
        snapshot_date: targetDate,
      },
      select: { currentTotalClicks: true },
    });

    this.logger.debug(
      `Snapshot for ${this.aspType}/${affiliateLinkName} on ${targetDate.toISOString()}: ${snapshot?.currentTotalClicks ?? "none"}`,
    );
    return snapshot;
  }

  protected async getCurrentClickCount(
    affiliateLinkName: string,
  ): Promise<number> {
    const count = await this.prisma.aspClickLog.count({
      where: {
        asp_type: this.aspType,
        affiliate_link_id: affiliateLinkName,
      },
    });
    return count;
  }

  private async saveSnapshot(data: {
    affiliateLinkName: string;
    currentTotalClicks: number;
  }): Promise<void> {
    const now = getNowJstForDB();
    const today = startOfDay(now);

    await this.prisma.clickLogSnapshot.upsert({
      where: {
        asp_type_affiliate_link_id_snapshot_date: {
          asp_type: this.aspType,
          affiliate_link_id: data.affiliateLinkName,
          snapshot_date: today,
        },
      },
      create: {
        asp_type: this.aspType,
        affiliate_link_id: data.affiliateLinkName,
        current_total_clicks: data.currentTotalClicks,
        snapshot_date: today,
        created_at: now,
        updated_at: now,
      },
      update: {
        current_total_clicks: data.currentTotalClicks,
        updated_at: now,
      },
    });

    this.logger.debug(
      `Saved new snapshot for ${this.aspType}/${data.affiliateLinkName}: ${data.currentTotalClicks} at ${today.toISOString()}`,
    );
  }

  protected async saveToCommonTable(
    data: IndividualClickLog[] | TotalClickLog[],
  ): Promise<number> {
    try {
      const now = getNowJstForDB();
      return this.format === "individual"
        ? this.processIndividualClickLogs(data as IndividualClickLog[])
        : this.processTotalClickLog(data as TotalClickLog[]);
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
      const clickLogs = data.map((item) => ({
        asp_type: this.aspType,
        click_date_time: item.clickDateTime,
        affiliate_link_id: item.affiliateLinkName,
        referrer_url: item.referrerUrl,
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
              `Skipping ${this.aspType}/${item.affiliateLinkName}: current=${item.currentTotalClicks}, last=${todayLastClicks}, diff=${diff}`,
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
        `Skipping snapshot update for ${this.aspType}/${item.affiliateLinkName}: value unchanged (${item.currentTotalClicks})`,
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
        referrer_url: item.referrerUrl,
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
