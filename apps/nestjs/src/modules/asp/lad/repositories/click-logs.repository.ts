import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";
import { getNowJst } from "src/libs/date-utils";

interface RawLadData {
  クリック日時?: string;
  広告名?: string;
  リファラ?: string;
}

interface FormattedLadData {
  clickDateTime: Date | null;
  affiliateLinkName: string | null;
  referrerUrl: string | null;
  createdAt:Date | null;
  updatedAt:Date | null;
}

@Injectable()
export class LadClickLogRepository {
  private readonly logger = new Logger(LadClickLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RawLadData): FormattedLadData {
    const now = getNowJst();
    return {
      clickDateTime: toValidDate(item["クリック日時"]),
      affiliateLinkName: item["広告名"] || null,
      referrerUrl: item["リファラ"] || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(logs: RawLadData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));

      const result = await this.prisma.ladClickLog.createMany({
        data: formatted,
        skipDuplicates: true,
      });

      this.logger.log(
        `Successfully inserted ${result.count} ladClickLog records`,
      );
      return result.count;
    } catch (error) {
      this.logger.error("Error saving lad click logs:", error);
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
