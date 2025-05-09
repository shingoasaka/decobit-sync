import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType, Prisma } from "@operate-ad/prisma";
import { getNowJst } from "src/libs/date-utils";

@Injectable()
export abstract class BaseAspRepository {
  protected readonly logger: Logger;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly aspType: AspType,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  protected async getLastSnapshot(
    affiliateLinkName: string,
  ): Promise<{ totalClicks: number } | null> {
    const now = getNowJst();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        aspType: this.aspType,
        affiliateLinkName,
        snapshotDate: { lt: today },
      },
      orderBy: { snapshotDate: "desc" },
      select: { totalClicks: true },
    });

    this.logger.debug(
      `Last snapshot for ${this.aspType}/${affiliateLinkName}: ${snapshot?.totalClicks ?? "none"}`,
    );
    return snapshot;
  }

  protected async getSnapshotForDate(
    affiliateLinkName: string,
    date: Date,
  ): Promise<{ totalClicks: number } | null> {
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        aspType: this.aspType,
        affiliateLinkName,
        snapshotDate: targetDate,
      },
      select: { totalClicks: true },
    });

    this.logger.debug(
      `Snapshot for ${this.aspType}/${affiliateLinkName} on ${targetDate.toISOString()}: ${snapshot?.totalClicks ?? "none"}`,
    );
    return snapshot;
  }

  protected async getCurrentClickCount(
    affiliateLinkName: string,
  ): Promise<number> {
    const count = await this.prisma.aspClickLog.count({
      where: {
        aspType: this.aspType,
        affiliateLinkName,
      },
    });
    return count;
  }

  protected async saveSnapshot(data: {
    affiliateLinkName: string;
    totalClicks: number;
  }): Promise<void> {
    const now = getNowJst();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    await this.prisma.clickLogSnapshot.create({
      data: {
        aspType: this.aspType,
        ...data,
        snapshotDate: today,
        createdAt: now,
        updatedAt: now,
      },
    });

    this.logger.debug(
      `Saved new snapshot for ${this.aspType}/${data.affiliateLinkName}: ${data.totalClicks} at ${today.toISOString()}`,
    );
  }

  protected async saveToCommonTable(
    data: any[],
    tableName: "aspClickLog" | "aspActionLog",
    options: {
      clickDateTime?: Date | null;
      actionDateTime?: Date | null;
      currentTotalClicks?: number; // 合計値形式ASPの場合の現在の総クリック数
      referrerUrl?: string | null;
      uid?: string | null;
    } = {},
  ): Promise<number> {
    try {
      const now = getNowJst();

      if (tableName === "aspClickLog") {
        if (
          typeof options.currentTotalClicks === "number" &&
          data[0]?.affiliateLinkName
        ) {
          // 合計値形式のクリックログ処理
          return await this.processTotalClickLog(
            data[0].affiliateLinkName,
            options.currentTotalClicks,
            options.referrerUrl,
          );
        } else {
          // 個別クリックログ処理
          return await this.processIndividualClickLogs(data, options);
        }
      } else {
        // アクションログの処理
        return await this.processActionLogs(data, options);
      }
    } catch (error) {
      this.logger.error(
        `Error saving to ${tableName} for ${this.aspType}:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  private async processTotalClickLog(
    affiliateLinkName: string,
    currentTotalClicks: number,
    referrerUrl?: string | null,
  ): Promise<number> {
    const now = getNowJst();

    // 最後のスナップショットを取得
    const lastSnapshot = await this.getLastSnapshot(affiliateLinkName);
    const lastTotalClicks = lastSnapshot?.totalClicks ?? 0;

    // 前回のスナップショットからの差分を計算
    const diff = currentTotalClicks - lastTotalClicks;

    if (diff > 0) {
      // 時間を分散させてレコードを作成
      const newClicks = Array(diff)
        .fill(null)
        .map((_, index) => {
          const randomHours = Math.random() * 24;
          const clickTime = new Date(
            now.getTime() - randomHours * 60 * 60 * 1000,
          );

          return {
            aspType: this.aspType,
            clickDateTime: clickTime,
            affiliateLinkName,
            referrerUrl,
            createdAt: now,
            updatedAt: now,
          };
        });

      await this.prisma.aspClickLog.createMany({
        data: newClicks,
        skipDuplicates: true,
      });

      this.logger.debug(
        `Created ${diff} new click records for ${affiliateLinkName} (previous: ${lastTotalClicks}, current: ${currentTotalClicks})`,
      );

      // スナップショットを更新
      await this.saveSnapshot({
        affiliateLinkName,
        totalClicks: currentTotalClicks,
      });
    }

    return diff > 0 ? diff : 0;
  }

  private async processIndividualClickLogs(
    data: any[],
    options: {
      clickDateTime?: Date | null;
      referrerUrl?: string | null;
      uid?: string | null;
    },
  ): Promise<number> {
    const now = getNowJst();
    const clickLogs = data.map((item) => ({
      aspType: this.aspType,
      clickDateTime: options.clickDateTime,
      affiliateLinkName: item.affiliateLinkName,
      referrerUrl: options.referrerUrl,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await this.prisma.aspClickLog.createMany({
      data: clickLogs as Prisma.AspClickLogCreateManyInput[],
      skipDuplicates: true,
    });

    // スナップショットの更新
    if (result.count > 0 && clickLogs[0]?.affiliateLinkName) {
      const currentTotal = await this.getCurrentClickCount(
        clickLogs[0].affiliateLinkName,
      );
      await this.saveSnapshot({
        affiliateLinkName: clickLogs[0].affiliateLinkName,
        totalClicks: currentTotal,
      });
    }

    this.logger.log(`Saved ${result.count} individual click logs`);
    return result.count;
  }

  private async processActionLogs(
    data: any[],
    options: {
      actionDateTime?: Date | null;
      referrerUrl?: string | null;
      uid?: string | null;
    },
  ): Promise<number> {
    const now = getNowJst();
    const actionLogs = data.map((item) => ({
      aspType: this.aspType,
      actionDateTime: options.actionDateTime,
      affiliateLinkName: item.affiliateLinkName,
      referrerUrl: options.referrerUrl,
      uid: options.uid,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await this.prisma.aspActionLog.createMany({
      data: actionLogs as Prisma.AspActionLogCreateManyInput[],
      skipDuplicates: true,
    });

    this.logger.log(`Saved ${result.count} action logs`);
    return result.count;
  }
}
