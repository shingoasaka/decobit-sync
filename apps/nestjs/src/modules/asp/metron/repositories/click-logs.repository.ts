import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

interface RawMetronData {
  clickDateTime?: string;
  siteName?: string;
  referrer?: string;
  sessionId?: string;
}

interface FormattedMetronData {
  clickDateTime: Date | null;
  affiliateLinkName: string | null;
  referrerUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class MetronClickLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.METRON);
  }

  private formatData(item: RawMetronData): FormattedMetronData {
    const now = getNowJst();
    return {
      clickDateTime: parseToJst(item.clickDateTime),
      affiliateLinkName: item.siteName || null,
      referrerUrl: item.referrer || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(logs: RawMetronData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspClickLog", {
        clickDateTime: formatted[0]?.clickDateTime,
        referrerUrl: formatted[0]?.referrerUrl,
      });
    } catch (error) {
      this.logger.error("Error saving Metron click logs:", error);
      throw error;
    }
  }
}
