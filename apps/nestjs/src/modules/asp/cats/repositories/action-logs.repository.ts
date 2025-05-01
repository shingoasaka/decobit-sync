import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";
import { getNowJst } from "src/libs/date-utils";

interface RawCatsData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  遷移広告URL名?: string;
}

interface FormattedCatsData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  createdAt:Date | null;
  updatedAt:Date | null;
}

@Injectable()
export class CatsActionLogRepository {
  private readonly logger = new Logger(CatsActionLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

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
      actionDateTime: this.parseDate(this.getValue(item, "成果日時")),
      affiliateLinkName: this.getValue(item, "遷移広告URL名"),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawCatsData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.catsActionLog.createMany({
        data: formattedData,
        skipDuplicates: true,
      });

      this.logger.log(`Successfully inserted ${result.count} records`);
      return result.count;
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
