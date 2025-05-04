import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

interface RawHanikamuData {
  [key: string]: string | null | undefined;
  クリック日時?: string;
  ランディングページ?: string;
}

interface FormattedHanikamuData {
  clickDateTime: Date | null;
  affiliateLinkName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class HanikamuClickLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.HANIKAMU);
  }

  private getValue(item: RawHanikamuData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(item: RawHanikamuData): FormattedHanikamuData {
    const now = getNowJst();
    return {
      clickDateTime: parseToJst(this.getValue(item, "クリック日時")),
      affiliateLinkName: this.getValue(item, "ランディングページ"),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawHanikamuData[]): Promise<number> {
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
