import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

// LAD固有のカラム名を持つインターフェース
interface RawLadData {
  クリック日時?: string;
  広告名?: string;
  リファラ?: string;
}

@Injectable()
export class LadClickLogRepository extends BaseAspRepository {
  protected readonly format = "individual" as const;

  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.LAD);
  }

  private formatData(item: RawLadData) {
    const clickDateTime = parseToJst(item["クリック日時"]);
    if (!clickDateTime) {
      throw new Error("クリック日時が必須です");
    }

    const affiliateLinkName = item["広告名"];
    if (!affiliateLinkName) {
      throw new Error("広告名が必須です");
    }

    return {
      clickDateTime,
      affiliateLinkName,
      referrerUrl: item["リファラ"] || null,
    };
  }

  async save(logs: RawLadData[]): Promise<number> {
    try {
      const formatted = logs.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving lad click logs:", error);
      throw error;
    }
  }
}
