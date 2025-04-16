import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

interface RawLadData {
  クリック日時?: string;
  広告名?: string;
  リファラ?: string;
}

interface FormattedLadData {
  clickDate: Date | null;
  adName: string | null;
  referrer: string | null;
}

@Injectable()
export class LadClickLogRepository {
  private readonly logger = new Logger(LadClickLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RawLadData): FormattedLadData {
    return {
      clickDate: toValidDate(item["クリック日時"]),
      adName: item["広告名"] || null,
      referrer: item["リファラ"] || null,
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
