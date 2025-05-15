import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawLadData {
  成果日時?: string;
  遷移広告URL名?: string;
  "リファラ(クリック)"?: string;
}

@Injectable()
export class LadActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.LAD);
  }

  private formatData(item: RawLadData) {
    const actionDateTime = parseToJst(item["成果日時"]);
    if (!actionDateTime) {
      throw new Error("成果日時が必須です");
    }

    const affiliateLinkName = item["遷移広告URL名"];
    if (!affiliateLinkName) {
      throw new Error("遷移広告URL名が必須です");
    }

    return {
      actionDateTime,
      affiliateLinkName,
      referrerUrl: item["リファラ(クリック)"] || null,
    };
  }

  async save(logs: RawLadData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving LAD action logs:", error);
      throw error;
    }
  }
}
