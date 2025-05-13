import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawMetronData {
  actionDateTime?: string;
  siteName?: string;
  actionReferrer?: string;
  sessionId?: string;
  clientInfo?: string;
}

@Injectable()
export class MetronActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.METRON);
  }

  private formatData(item: RawMetronData) {
    const actionDateTime = parseToJst(item.actionDateTime);
    if (!actionDateTime) {
      throw new Error("actionDateTime is required");
    }

    const affiliateLinkName = item.siteName;
    if (!affiliateLinkName) {
      throw new Error("siteName is required");
    }

    let uid: string | null = null;
    try {
      const parsed = JSON.parse(item.clientInfo || "{}");
      uid = parsed.userId1 || null;
    } catch {
      uid = null;
    }

    return {
      actionDateTime,
      affiliateLinkName,
      referrerUrl: item.actionReferrer || null,
      uid,
    };
  }

  async save(logs: RawMetronData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving Metron action logs:", error);
      throw error;
    }
  }
}
