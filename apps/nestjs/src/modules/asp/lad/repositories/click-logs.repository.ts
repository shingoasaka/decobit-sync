import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface LadRawClickData {
  クリック日時?: string;
  広告名?: string;
  リファラ?: string;
}

interface LadClickFormattedData {
  clickDate: Date | null;
  adName: string | null;
  referrer: string | null;
}

@Injectable()
export class LadClickLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: LadRawClickData): LadClickFormattedData {
    return {
      clickDate: toValidDate(item["クリック日時"]),
      adName: item["広告名"] || null,
      referrer: item["リファラ"] || null,
    };
  }

  async save(logs: LadRawClickData[]): Promise<void> {
    for (const item of logs) {
      const formatted = this.formatData(item);
      await this.prisma.ladClickLog.create({
        data: formatted,
      });
    }
  }
}

function toValidDate(value?: string): Date | null {
  if (!value || value === "0000-00-00 00:00:00") return null;
  const isoLike = value.replace(" ", "T");
  const date = new Date(isoLike);
  return isNaN(date.getTime()) ? null : date;
}
