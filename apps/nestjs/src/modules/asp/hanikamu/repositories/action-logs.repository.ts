import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

interface RawHanikamuData {
  成果発生日: string;
  ランディングページ?: string;
}

interface FormattedHanikamuData {
  actionDateTime: Date;
  landingPageName: string | null;
}

@Injectable()
export class HanikamuActionLogRepository {
  private readonly logger = new Logger(HanikamuActionLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RawHanikamuData): FormattedHanikamuData {
    return {
      actionDateTime: new Date(item["成果発生日"]),
      landingPageName: item["ランディングページ"] || null,
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
