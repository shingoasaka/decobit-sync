import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawFinebirdData {
  [key: string]: string | null | undefined;
  注文日時?: string;
  サイト名?: string;
  リファラ?: string;
}

// 変換後のデータの型定義
interface FormattedFinebirdData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  referrerUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class FinebirdActionLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.FINEBIRD);
  }

  private getValue(item: RawFinebirdData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(item: RawFinebirdData): FormattedFinebirdData {
    const now = getNowJst();
    return {
      actionDateTime: parseToJst(this.getValue(item, "注文日時")),
      affiliateLinkName: this.getValue(item, "サイト名"),
      referrerUrl: this.getValue(item, "リファラ"),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawFinebirdData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspActionLog", {
        actionDateTime: formatted[0]?.actionDateTime,
      });
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
