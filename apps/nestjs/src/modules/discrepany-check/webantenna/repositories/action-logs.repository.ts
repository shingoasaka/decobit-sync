import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

interface RawWebantennaData {
  [key: string]: string | null | undefined;
  流入種別?: string;
  クリエイティブ名?: string;
  CV時刻?: string;
  "受付No."?: string;
}

interface FormattedWebantennaData {
  utmSourceIdentifier: string | null;
  creativeName: string | null;
  cvDate: Date | null;
  cvIdentifierId: string | null;
}

@Injectable()
export class WebantennaActionLogRepository {
  private readonly logger = new Logger(WebantennaActionLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private toDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  private formatData(item: RawWebantennaData): FormattedWebantennaData {
    return {
      utmSourceIdentifier: item["流入種別"] || null,
      creativeName: item["クリエイティブ名"] || null,
      cvDate: this.toDate(item["CV時刻"]),
      cvIdentifierId: item["受付No."] || null,
    };
  }

  async save(conversionData: RawWebantennaData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.webantennaActionLog.createMany({
        data: formatted,
        skipDuplicates: true,
      });

      this.logger.log(
        `Successfully inserted ${result.count} webantennaActionLog records`,
      );
      return result.count;
    } catch (error) {
      this.logger.error("Error saving webantenna action logs:", error);
      throw error;
    }
  }
}
