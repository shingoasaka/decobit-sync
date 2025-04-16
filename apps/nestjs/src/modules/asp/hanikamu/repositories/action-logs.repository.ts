import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface HanikamuRawData {
  成果発生日: string;
  ランディングページ?: string;
}

interface HanikamuFormattedData {
  actionDateTime: Date;
  landingPageName: string | null;
}

@Injectable()
export class HanikamuActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: HanikamuRawData): HanikamuFormattedData {
    return {
      actionDateTime: new Date(item["成果発生日"]),
      landingPageName: item["ランディングページ"] || null,
    };
  }

  async save(conversionData: HanikamuRawData[]): Promise<void> {
    for (const item of conversionData) {
      const formattedData = this.formatData(item);
      await this.prisma.hanikamuActionLog.create({
        data: formattedData,
      });
    }
  }
}
