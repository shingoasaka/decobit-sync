import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawMonkeyData {
  [key: string]: string | null | undefined;
  成果日時?: string;
  タグ?: string;
  リファラ?: string;
}

// 変換後のデータの型定義
interface FormattedMonkeyData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  referrerUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class MonkeyActionLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.MONKEY);
  }

  private getValue(item: RawMonkeyData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(item: RawMonkeyData): FormattedMonkeyData {
    const now = getNowJst();
    return {
      actionDateTime: parseToJst(this.getValue(item, "成果日時")),
      affiliateLinkName: this.getValue(item, "タグ"),
      referrerUrl: this.getValue(item, "リファラ"),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawMonkeyData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspActionLog", {
        actionDateTime: formatted[0]?.actionDateTime,
        referrerUrl: formatted[0]?.referrerUrl,
      });
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
