import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface LadRawData {
  成果日時?: string;
  遷移広告URL名?: string;
  "リファラ(クリック)"?: string;
}

interface LadFormattedData {
  actionDate: Date | null;
  redirectAdUrlName: string | null;
  referrerClickUrl: string | null;
}

@Injectable()
export class LadActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: LadRawData): LadFormattedData {
    return {
      actionDate: toValidDate(item["成果日時"]),
      redirectAdUrlName: item["遷移広告URL名"] || null,
      referrerClickUrl: item["リファラ(クリック)"] || null,
    };
  }

  async save(logs: LadRawData[]): Promise<void> {
    for (const item of logs) {
      const formatted = this.formatData(item);
      await this.prisma.ladActionLog.create({
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