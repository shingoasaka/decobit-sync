import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawRentracksData {
  成果日時?: string;
  サイト名?: string;
}

@Injectable()
export class RentracksActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.RENTRACKS);
  }

  private formatData(item: RawRentracksData) {
    const actionDateTime = parseToJst(item["成果日時"]);
    if (!actionDateTime) {
      throw new Error("成果日時が必須です");
    }

    const affiliateLinkName = item["サイト名"];
    if (!affiliateLinkName) {
      throw new Error("サイト名が必須です");
    }

    return {
      actionDateTime,
      affiliateLinkName,
      referrerUrl: null,
    };
  }

  async save(logs: RawRentracksData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving Rentracks action logs:", error);
      throw error;
    }
  }
}
