import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawMonkeyData {
  成果日時?: string;
  タグ?: string;
  リファラ?: string;
}

@Injectable()
export class MonkeyActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.MONKEY);
  }

  private formatData(item: RawMonkeyData) {
    const actionDateTime = parseToJst(item["成果日時"]);
    if (!actionDateTime) {
      throw new Error("成果日時が必須です");
    }

    const affiliateLinkName = item["タグ"];
    if (!affiliateLinkName) {
      throw new Error("タグ名が必須です");
    }

    return {
      actionDateTime,
      affiliateLinkName,
      referrerUrl: item["リファラ"] || null,
    };
  }

  async save(logs: RawMonkeyData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving Monkey action logs:", error);
      throw error;
    }
  }
}
