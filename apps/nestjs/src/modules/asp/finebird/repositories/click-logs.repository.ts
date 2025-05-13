import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst } from "src/libs/date-utils";

// Finebird固有のカラム名を持つインターフェース
interface RawFinebirdData {
  サイト名?: string;
  総クリック?: string;
}

@Injectable()
export class FinebirdClickLogRepository extends BaseAspRepository {
  protected readonly format = "total" as const;

  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.FINEBIRD);
  }

  private toInt(value: string | null | undefined): number {
    if (!value) return 0;
    try {
      const cleanValue = value.replace(/[,¥]/g, "");
      const num = parseInt(cleanValue, 10);
      return isNaN(num) ? 0 : num;
    } catch (error) {
      this.logger.warn(`Invalid number format: ${value}`);
      return 0;
    }
  }

  private formatData(item: RawFinebirdData) {
    const affiliateLinkName = item["サイト名"]?.trim();
    if (!affiliateLinkName) {
      throw new Error("サイト名が必須です");
    }

    const currentTotalClicks = this.toInt(item["総クリック"]);
    if (currentTotalClicks === 0) {
      throw new Error("総クリック数が0です");
    }

    return {
      affiliateLinkName,
      currentTotalClicks,
      referrerUrl: null,
    };
  }

  async save(clickData: RawFinebirdData[]): Promise<number> {
    try {
      const formatted = clickData.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving Finebird click data:", error);
      throw error;
    }
  }

  protected async saveSnapshot(data: {
    affiliateLinkName: string;
    currentClicks: number;
  }): Promise<void> {
    const now = getNowJst();

    // 単純にスナップショットを作成
    await this.prisma.clickLogSnapshot.create({
      data: {
        aspType: this.aspType,
        ...data,
        snapshotDate: now,
        createdAt: now,
        updatedAt: now,
      },
    });

    this.logger.debug(
      `Saved new snapshot for ${this.aspType}/${data.affiliateLinkName}: ${data.currentClicks} at ${now.toISOString()}`,
    );
  }
}
