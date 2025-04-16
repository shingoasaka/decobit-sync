import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface HanikamuRawData {
  ランディングページ: string;
  Click数: string;
}

interface HanikamuFormattedData {
  landingPageName: string | null;
  click: number | null;
}

@Injectable()
export class HanikamuClickLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: HanikamuRawData): HanikamuFormattedData {
    return {
      landingPageName: item["ランディングページ"] || null,
      click: item["Click数"] ? parseInt(item["Click数"], 10) : null,
    };
  }

  async save(conversionData: HanikamuRawData[]): Promise<void> {
    for (const item of conversionData) {
      const formattedData = this.formatData(item);
      await this.prisma.hanikamuClickLog.create({
        data: formattedData,
      });
    }
  }
}
