import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

interface RawRentracksData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  サイト名?: string;
  リファラ?: string;
}

interface FormattedRentracksData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  referrerUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class RentracksActionLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.RENTRACKS);
  }

  private getValue(item: RawRentracksData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(item: RawRentracksData): FormattedRentracksData {
    const now = getNowJst();
    return {
      actionDateTime: parseToJst(this.getValue(item, "成果日時")),
      affiliateLinkName: this.getValue(item, "サイト名"),
      referrerUrl: this.getValue(item, "リファラ"),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawRentracksData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspActionLog", {
        actionDateTime: formatted[0]?.actionDateTime,
        referrerUrl: formatted[0]?.referrerUrl,
      });
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
