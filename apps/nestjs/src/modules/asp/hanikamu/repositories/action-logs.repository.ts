import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawHanikamuData {
  成果発生日?: string;
  ランディングページ?: string;
}

@Injectable()
export class HanikamuActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.HANIKAMU);
  }

  private formatData(item: RawHanikamuData) {
    const actionDateTime = parseToJst(item["成果発生日"]);
    if (!actionDateTime) {
      throw new Error("成果日時が必須です");
    }

    const affiliateLinkName = item["ランディングページ"];
    if (!affiliateLinkName) {
      throw new Error("ランディングページが必須です");
    }

    return {
      actionDateTime,
      affiliateLinkName,
      referrerUrl: null,
    };
  }

  async save(logs: RawHanikamuData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving Hanikamu action logs:", error);
      throw error;
    }
  }
}
