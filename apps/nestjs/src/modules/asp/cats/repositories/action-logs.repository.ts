import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

interface RawCatsData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  遷移広告URL名?: string;
}

interface FormattedCatsData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class CatsActionLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.CATS);
  }

  processCsvAndSave(downloadPath: string): number | PromiseLike<number> {
    throw new Error("Method not implemented.");
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      this.logger.warn(`Invalid date format: ${value}`);
      return null;
    }
    return date;
  }

  private getValue(item: RawCatsData, key: keyof RawCatsData): string | null {
    return item[key] ?? null;
  }

  private formatData(item: RawCatsData): FormattedCatsData {
    const now = getNowJst();
    return {
      actionDateTime: parseToJst(this.getValue(item, "成果日時")),
      affiliateLinkName: this.getValue(item, "遷移広告URL名"),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawCatsData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspActionLog", {
        actionDateTime: formatted[0]?.actionDateTime,
      });
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
