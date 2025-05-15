import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawFinebirdData {
  注文日時?: string;
  サイト名?: string;
  リファラ?: string;
}

@Injectable()
export class FinebirdActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.FINEBIRD);
  }

  private formatData(item: RawFinebirdData) {
    const actionDateTime = parseToJst(item["注文日時"]);
    if (!actionDateTime) {
      throw new Error("注文日時が必須です");
    }

    const affiliateLinkName = item["サイト名"];
    if (!affiliateLinkName) {
      throw new Error("サイト名が必須です");
    }

    return {
      actionDateTime,
      affiliateLinkName,
      referrerUrl: item["リファラ"] || null,
    };
  }

  async save(logs: RawFinebirdData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving Finebird action logs:", error);
      throw error;
    }
  }
}
