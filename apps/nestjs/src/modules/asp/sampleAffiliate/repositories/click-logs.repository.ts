import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

// 入力データの型定義
interface RawSampleAffiliateData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  広告名?: string;
}

// 変換後のデータの型定義
interface FormattedSampleAffiliateData {
  clickDateTime: Date | null;
  affiliateLinkName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class SampleAffiliateClickLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.SAMPLE_AFFILIATE);
  }

  private getValue(item: RawSampleAffiliateData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(
    item: RawSampleAffiliateData,
  ): FormattedSampleAffiliateData {
    const now = getNowJst();
    return {
      clickDateTime: parseToJst(this.getValue(item, "クリック日時")),
      affiliateLinkName: this.getValue(item, "広告名"),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawSampleAffiliateData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspClickLog", {
        clickDateTime: formatted[0]?.clickDateTime,
      });
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
