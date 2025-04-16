import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface RawWebantennaActionData {
  [key: string]: string | null | undefined;
  流入種別?: string;
  クリエイティブ名?: string;
  CV時刻?: string;
  "受付No."?: string;
}

interface FormattedWebantennaActionData {
  utmSourceIdentifier: string | null;
  creativeName: string | null;
  cvDate: Date | null;
  cvIdentifierId: string | null;
}

@Injectable()
export class WebantennaActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  private formatData(
    item: RawWebantennaActionData,
  ): FormattedWebantennaActionData {
    return {
      utmSourceIdentifier: item["流入種別"] || null,
      creativeName: item["クリエイティブ名"] || null,
      cvDate: this.toDate(item["CV時刻"]),
      cvIdentifierId: item["受付No."] || null,
    };
  }

  async save(conversionData: RawWebantennaActionData[]) {
    for (const item of conversionData) {
      const formatted = this.formatData(item);
      await this.prisma.webantennaActionLog.create({
        data: formatted,
      });
    }
  }
}
