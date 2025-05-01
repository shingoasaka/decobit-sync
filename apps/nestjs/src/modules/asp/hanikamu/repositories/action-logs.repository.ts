import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";
import { getNowJst } from "src/libs/date-utils";

interface RawHanikamuData {
  成果発生日: string;
  ランディングページ?: string;
}

interface FormattedHanikamuData {
  actionDateTime: Date;
  affiliateLinkName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class HanikamuActionLogRepository {
  private readonly logger = new Logger(HanikamuActionLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RawHanikamuData): FormattedHanikamuData {
    const now = getNowJst();
    return {
      actionDateTime: new Date(item["成果発生日"]),
      affiliateLinkName: item["ランディングページ"] || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(conversionData: RawHanikamuData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.hanikamuActionLog.createMany({
        data: formattedData,
        skipDuplicates: true,
      });

      this.logger.log(`Successfully inserted ${result.count} records`);
      return result.count;
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
