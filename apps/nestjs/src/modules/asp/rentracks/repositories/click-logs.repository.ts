import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

interface RawRentracksData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  サイト名?: string;
  リファラ?: string;
}

interface FormattedRentracksData {
  clickDateTime: Date | null;
  affiliateLinkName: string | null;
  referrerUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class RentracksClickLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.RENTRACKS);
  }

  private getValue(item: RawRentracksData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(item: RawRentracksData): FormattedRentracksData {
    const now = getNowJst();
    return {
      clickDateTime: parseToJst(this.getValue(item, "クリック日時")),
      affiliateLinkName: this.getValue(item, "サイト名"),
      referrerUrl: this.getValue(item, "リファラ"),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(clickData: RawRentracksData[]): Promise<number> {
    try {
      const formatted = clickData.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspClickLog", {
        clickDateTime: formatted[0]?.clickDateTime,
        referrerUrl: formatted[0]?.referrerUrl,
      });
    } catch (error) {
      this.logger.error("Error saving click data:", error);
      throw error;
    }
  }
}
