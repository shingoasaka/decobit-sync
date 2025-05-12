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
  ): Promise<{ currentClicks: number; snapshotDate: Date } | null> {
    const now = getNowJst();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        aspType: this.aspType,
        affiliateLinkName,
        snapshotDate: today,
      },
      select: { currentClicks: true, snapshotDate: true },
    });

    this.logger.debug(
      `Last snapshot for ${this.aspType}/${affiliateLinkName}: ${snapshot?.currentClicks ?? "none"}`,
    );
    return snapshot;
  }

  protected async getSnapshotForDate(
    affiliateLinkName: string,
    date: Date,
  ): Promise<{ currentClicks: number } | null> {
    const targetDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    const snapshot = await this.prisma.clickLogSnapshot.findFirst({
      where: {
        aspType: this.aspType,
        affiliateLinkName,
        snapshotDate: targetDate,
      },
      select: { currentClicks: true },
    });

    this.logger.debug(
      `Snapshot for ${this.aspType}/${affiliateLinkName} on ${targetDate.toISOString()}: ${snapshot?.currentClicks ?? "none"}`,
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
    currentClicks: number;
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
      `Saved new snapshot for ${this.aspType}/${data.affiliateLinkName}: ${data.currentClicks} at ${today.toISOString()}`,
    );
  }

  protected async saveToCommonTable(
    data: any[],
    tableName: "aspClickLog" | "aspActionLog",
    options: {
      clickDateTime?: Date | null;
      actionDateTime?: Date | null;
      currentTotalClicks?: number;
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
          if (!options.clickDateTime) {
            throw new Error(
              "clickDateTime is required for individual format ASPs",
            );
          }
          return await this.processIndividualClickLogs(data, {
            clickDateTime: options.clickDateTime,
            referrerUrl: options.referrerUrl,
            uid: options.uid,
          });
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
    currentClicks: number,
    referrerUrl?: string | null,
  ): Promise<number> {
    try {
      const now = getNowJst();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 今日のスナップショットを取得
      const todaySnapshot = await this.getSnapshotForDate(
        affiliateLinkName,
        today,
      );
      const todayLastClicks = todaySnapshot?.currentClicks ?? 0;

      // 今日の差分を計算
      const diff = currentClicks - todayLastClicks;

      if (diff <= 0) {
        this.logger.debug(`No new clicks to process for ${affiliateLinkName}`);
        return 0;
      }

      // トランザクションで処理
      return await this.prisma.$transaction(async (tx) => {
        // クリックログの重複を防ぐため、既存のクリック数を確認
        const existingClicks = await tx.aspClickLog.count({
          where: {
            aspType: this.aspType,
            affiliateLinkName,
            clickDateTime: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        });

        // 既存のクリック数と新しいクリック数の合計が現在の総クリック数を超えないようにする
        if (existingClicks + diff > currentClicks) {
          this.logger.warn(
            `Click count mismatch for ${affiliateLinkName}: existing=${existingClicks}, new=${diff}, total=${currentClicks}`,
          );
          return 0;
        }

        // クリックログの生成処理
        const newClicks = Array(diff)
          .fill(null)
          .map(() => {
            const randomHours = Math.random() * 24;
            const clickTime = new Date(
              today.getTime() + randomHours * 60 * 60 * 1000,
            );
            return {
              aspType: this.aspType,
              clickDateTime: clickTime,
              affiliateLinkName,
              referrerUrl,
              createdAt: clickTime,
              updatedAt: clickTime,
            };
          });

        // クリックログの保存
        await tx.aspClickLog.createMany({
          data: newClicks,
          skipDuplicates: true,
        });

        // スナップショットの更新
        await tx.clickLogSnapshot.upsert({
          where: {
            aspType_affiliateLinkName: {
              aspType: this.aspType,
              affiliateLinkName,
            },
          },
          create: {
            aspType: this.aspType,
            affiliateLinkName,
            currentClicks,
            snapshotDate: today,
            createdAt: now,
            updatedAt: now,
          },
          update: {
            currentClicks,
            updatedAt: now,
          },
        });

        return diff;
      });
    } catch (error) {
      this.logger.error(
        `Error processing total click log for ${affiliateLinkName}:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  private async processIndividualClickLogs(
    data: Array<{ affiliateLinkName: string }>,
    options: {
      clickDateTime: Date;
      referrerUrl?: string | null;
      uid?: string | null;
    },
  ): Promise<number> {
    try {
      const now = getNowJst();
      const clickLogs = data.map((item) => {
        if (!item.affiliateLinkName) {
          throw new Error(
            "affiliateLinkName is required for individual format ASPs",
          );
        }
        return {
          aspType: this.aspType,
          clickDateTime: options.clickDateTime,
          affiliateLinkName: item.affiliateLinkName,
          referrerUrl: options.referrerUrl,
          createdAt: now,
          updatedAt: now,
        };
      });

      // トランザクションで処理
      return await this.prisma.$transaction(async (tx) => {
        const result = await tx.aspClickLog.createMany({
          data: clickLogs as Prisma.AspClickLogCreateManyInput[],
          skipDuplicates: true,
        });

        this.logger.log(`Saved ${result.count} individual click logs`);
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
