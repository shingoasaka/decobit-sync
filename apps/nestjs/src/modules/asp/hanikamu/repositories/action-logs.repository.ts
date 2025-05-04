import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType } from "@operate-ad/prisma";
import { BaseAspRepository } from "../../base/repository.base";
import { getNowJst, parseToJst } from "src/libs/date-utils";

interface RawHanikamuData {
  [key: string]: string | null | undefined;
  成果発生日?: string;
  ランディングページ?: string;
}

interface FormattedHanikamuData {
  actionDateTime: Date | null;
  affiliateLinkName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class HanikamuActionLogRepository extends BaseAspRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.HANIKAMU);
  }

  private getValue(item: RawHanikamuData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(item: RawHanikamuData): FormattedHanikamuData {
    const now = getNowJst();
    return {
      actionDateTime: parseToJst(this.getValue(item, "成果発生日")),
      affiliateLinkName: this.getValue(item, "ランディングページ"),
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawHanikamuData[]): Promise<number> {
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
