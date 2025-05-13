import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType, Prisma } from "@operate-ad/prisma";
import { getNowJst } from "src/libs/date-utils";

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
      const now = getNowJst();
      const actionLogs = data.map((item) => ({
        aspType: this.aspType,
        actionDateTime: item.actionDateTime,
        affiliateLinkName: item.affiliateLinkName,
        referrerUrl: item.referrerUrl,
        uid: item.uid,
        createdAt: now,
        updatedAt: now,
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
    data: IndividualClickLog[] | TotalClickLog[],
  ): Promise<number> {
    try {
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
      const now = getNowJst();
      const clickLogs = data.map((item) => ({
        aspType: this.aspType,
        clickDateTime: item.clickDateTime,
        affiliateLinkName: item.affiliateLinkName,
        referrerUrl: item.referrerUrl,
        createdAt: now,
        updatedAt: now,
      }));

      return await this.prisma.$transaction(async (tx) => {
        const result = await tx.aspClickLog.createMany({
          data: clickLogs,
          skipDuplicates: true,
        });
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
      const now = getNowJst();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      return await this.prisma.$transaction(async (tx) => {
        let totalSaved = 0;
        for (const item of data) {
          const todaySnapshot = await this.getSnapshotForDate(
            item.affiliateLinkName,
            today,
          );
          const todayLastClicks = todaySnapshot?.currentClicks ?? 0;
          const diff = item.currentTotalClicks - todayLastClicks;

          if (diff <= 0) continue;

          const baseMillis = now.getTime();
          const newClicks = Array.from({ length: diff }, (_, i) => ({
            aspType: this.aspType,
            clickDateTime: new Date(baseMillis + i),
            affiliateLinkName: item.affiliateLinkName,
            referrerUrl: item.referrerUrl,
            createdAt: now,
            updatedAt: now,
          }));

          await tx.aspClickLog.createMany({
            data: newClicks,
            skipDuplicates: true,
          });

          await tx.clickLogSnapshot.upsert({
            where: {
              aspType_affiliateLinkName_snapshotDate: {
                aspType: this.aspType,
                affiliateLinkName: item.affiliateLinkName,
                snapshotDate: today,
              },
            },
            create: {
              aspType: this.aspType,
              affiliateLinkName: item.affiliateLinkName,
              currentClicks: item.currentTotalClicks,
              snapshotDate: today,
              createdAt: now,
              updatedAt: now,
            },
            update: {
              currentClicks: item.currentTotalClicks,
              updatedAt: now,
            },
          });

          totalSaved += diff;
        }
        return totalSaved;
      });
    } catch (error) {
      this.logger.error(
        `Error processing total click log:`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
