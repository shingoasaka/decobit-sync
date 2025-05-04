import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

interface RawMetronData {
  actionDateTime?: string;
  siteName?: string;
  actionReferrer?: string;
  sessionId?: string;
  clientInfo?: string;
}

interface FormattedMetronData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  referrerUrl: string | null;
  uid: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class MetronActionLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.METRON);
  }

  private formatData(item: RawMetronData): FormattedMetronData {
    const now = getNowJst();
    let uid: string | null = null;
    try {
      const parsed = JSON.parse(item.clientInfo || "{}");
      uid = parsed.userId1 || null;
    } catch {
      uid = null;
    }

    return {
      actionDateTime: parseToJst(item.actionDateTime),
      affiliateLinkName: item.siteName || null,
      referrerUrl: item.actionReferrer || null,
      uid,
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(logs: RawMetronData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspActionLog", {
        actionDateTime: formatted[0]?.actionDateTime,
        referrerUrl: formatted[0]?.referrerUrl,
        uid: formatted[0]?.uid,
      });
    } catch (error) {
      this.logger.error("Error saving Metron action logs:", error);
      throw error;
    }
  }
}
