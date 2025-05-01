import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";
import { getNowJst } from "src/libs/date-utils";

interface RawLadData {
  成果日時?: string;
  遷移広告URL名?: string;
  "リファラ(クリック)"?: string;
}

interface FormattedLadData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  referrerUrl: string | null;
  createdAt:Date | null;
  updatedAt:Date | null;
}

@Injectable()
export class LadActionLogRepository {
  private readonly logger = new Logger(LadActionLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RawLadData): FormattedLadData {
    const now = getNowJst();
    return {
      actionDateTime: toValidDate(item["成果日時"]),
      affiliateLinkName: item["遷移広告URL名"] || null,
      referrerUrl: item["リファラ(クリック)"] || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(logs: RawLadData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));

      const result = await this.prisma.ladActionLog.createMany({
        data: formatted,
        skipDuplicates: true,
      });

      this.logger.log(`Successfully inserted ${result.count} records`);
      return result.count;
    } catch (error) {
      this.logger.error("Error saving LAD action logs:", error);
      throw error;
    }
  }
}

function toValidDate(value?: string): Date | null {
  if (!value || value === "0000-00-00 00:00:00") return null;
  const isoLike = value.replace(" ", "T");
  const date = new Date(isoLike);
  return isNaN(date.getTime()) ? null : date;
}
