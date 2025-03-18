import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface QuorizaRawData {
  広告種別: string;
  Click数: string;
  発生数: string;
  CVR: string;
  承認数: string;
  承認率: string;
  未承認数: string;
  却下数: string;
}

interface QuorizaFormattedData {
  adCategory: string | null;
  click: number | null;
  actionData: number | null;
  cvr: number | null;
  approvedCount: number | null;
  approvalRate: number | null;
  unapprovedCount: number | null;
  rejectionsCount: number | null;
}

@Injectable()
export class QuorizaClickLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: QuorizaRawData): QuorizaFormattedData {
    return {
      adCategory: item["広告種別"] || null,
      click: item["Click数"] ? parseInt(item["Click数"], 10) : null,
      actionData: item["発生数"] ? parseInt(item["発生数"], 10) : null,
      cvr: item["CVR"] ? parseFloat(item["CVR"]) : null,
      approvedCount: item["承認数"] ? parseInt(item["承認数"], 10) : null,
      approvalRate: item["承認率"] ? parseFloat(item["承認率"]) : null,
      unapprovedCount: item["未承認数"] ? parseInt(item["未承認数"], 10) : null,
      rejectionsCount: item["却下数"] ? parseInt(item["却下数"], 10) : null,
    };
  }

  async save(conversionData: QuorizaRawData[]): Promise<void> {
    for (const item of conversionData) {
      const formattedData = this.formatData(item);
      await this.prisma.quorizaClickLog.create({
        data: formattedData,
      });
    }
  }
}
