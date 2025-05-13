import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { parseToJst } from "src/libs/date-utils";

interface RawCatsData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  遷移広告URL名?: string;
}

@Injectable()
export class CatsActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.CATS);
  }

  processCsvAndSave(downloadPath: string): number | PromiseLike<number> {
    throw new Error("Method not implemented.");
  }

  private getValue(item: RawCatsData, key: keyof RawCatsData): string | null {
    return item[key] ?? null;
  }

  private formatData(item: RawCatsData) {
    const actionDateTime = parseToJst(this.getValue(item, "成果日時"));
    if (!actionDateTime) {
      throw new Error("成果日時が必須です");
    }

    const affiliateLinkName = this.getValue(item, "遷移広告URL名");
    if (!affiliateLinkName) {
      throw new Error("遷移広告URL名が必須です");
    }

    return {
      actionDateTime,
      affiliateLinkName,
      referrerUrl: null,
    };
  }

  async save(conversionData: RawCatsData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
