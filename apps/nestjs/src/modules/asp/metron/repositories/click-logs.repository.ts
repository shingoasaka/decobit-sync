import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

// Metron固有のカラム名を持つインターフェース
interface RawMetronData {
  clickDateTime?: string;
  siteName?: string;
  referrer?: string;
  sessionId?: string;
}

@Injectable()
export class MetronClickLogRepository extends BaseAspRepository {
  protected readonly format = "individual" as const;

  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.METRON);
  }

  private formatData(item: RawMetronData) {
    const clickDateTime = parseToJst(item.clickDateTime);
    if (!clickDateTime) {
      throw new Error("clickDateTime is required");
    }

    const affiliateLinkName = item.siteName;
    if (!affiliateLinkName) {
      throw new Error("siteName is required");
    }

    return {
      clickDateTime,
      affiliateLinkName,
      referrerUrl: item.referrer || null,
    };
  }

  async save(logs: RawMetronData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving metron click logs:", error);
      throw error;
    }
  }
}
