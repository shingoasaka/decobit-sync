import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawRentracksData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  備考?: string;
  クリック数?: string;
}

@Injectable()
export class RentracksClickLogRepository extends BaseAspRepository {
  protected readonly format = "total" as const;

  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.RENTRACKS);
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

  private formatData(item: RawRentracksData) {
    const affiliateLinkName = item.備考?.trim();
    if (!affiliateLinkName) {
      throw new Error("備考が必須です");
    }

    const currentTotalClicks = this.toInt(item.クリック数);
    if (currentTotalClicks === 0) {
      throw new Error("クリック数が0です");
    }

    return {
      affiliateLinkName,
      currentTotalClicks,
      referrerUrl: null,
    };
  }

  async save(clickData: RawRentracksData[]): Promise<number> {
    try {
      const formatted = clickData.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving Rentracks click data:", error);
      throw error;
    }
  }
}
