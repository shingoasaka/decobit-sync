import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseActionLogRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawSampleAffiliateData {
  [key: string]: string | null | undefined;
  メディア?: string;
  発生日時?: string;
}

@Injectable()
export class SampleAffiliateActionLogRepository extends BaseActionLogRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.SAMPLE_AFFILIATE);
  }

  private toDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      this.logger.warn(`Invalid date format: ${dateStr}`);
      return null;
    }
  }

  private getValue(item: RawSampleAffiliateData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(item: RawSampleAffiliateData) {
    const affiliateLinkName = this.getValue(item, "メディア");
    if (!affiliateLinkName) {
      throw new Error("メディアが必須です");
    }

    const actionDateTime = parseToJst(this.getValue(item, "発生日時"));
    if (!actionDateTime) {
      throw new Error("発生日時が必須です");
    }

    return {
      actionDateTime,
      affiliateLinkName,
      referrerUrl: null,
    };
  }

  async save(conversionData: RawSampleAffiliateData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));
      return await this.saveToCommonTable(formatted);
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
