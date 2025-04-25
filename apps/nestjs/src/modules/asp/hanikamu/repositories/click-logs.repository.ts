import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";

interface RawHanikamuData {
  ランディングページ: string;
  Click数: string;
}

interface FormattedHanikamuData {
  affiliateLinkName: string | null;
  clickData: number | null;
}

@Injectable()
export class HanikamuClickLogRepository {
  private readonly logger = new Logger(HanikamuClickLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RawHanikamuData): FormattedHanikamuData {
    return {
      affiliateLinkName: item["ランディングページ"] || null,
      clickData: item["Click数"] ? parseInt(item["Click数"], 10) : null,
    };
  }

  async save(conversionData: RawHanikamuData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.hanikamuClickLog.createMany({
        data: formattedData,
        skipDuplicates: true,
      });

      this.logger.log(`Successfully inserted ${result.count} records`);
      return result.count;
    } catch (error) {
      this.logger.error("Error saving click data:", error);
      throw error;
    }
  }
}
