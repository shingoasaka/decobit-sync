import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface RentracksClickRawData {
  備考?: string;
  クリック数?: string;
  売上件数?: string;
  "O/C率"?: string;
  承認済件数?: string;
  承認済報酬?: string;
}

interface RentracksClickFormattedData {
  remarks: string | null;
  click: number;
  selesNumber: number;
  ocRate: number;
  approvedNnumber: number;
  approvedRewardAmount: number;
}

@Injectable()
export class RentracksClickLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RentracksClickRawData): RentracksClickFormattedData {
    return {
      remarks: item["備考"] || null,
      click: item["クリック数"] ? parseInt(item["クリック数"], 10) : 0,
      selesNumber: item["売上件数"] ? parseInt(item["売上件数"], 10) : 0,
      ocRate: item["O/C率"] ? parseFloat(item["O/C率"].replace("%", "")) : 0,
      approvedNnumber: item["承認済件数"]
        ? parseInt(item["承認済件数"], 10)
        : 0,
      approvedRewardAmount: item["承認済報酬"]
        ? parseInt(item["承認済報酬"].replace("\\", ""), 10)
        : 0,
    };
  }

  async save(conversionData: RentracksClickRawData[]): Promise<void> {
    for (const item of conversionData) {
      const formattedData = this.formatData(item);
      await this.prisma.rentracksClickLog.create({
        data: formattedData,
      });
    }
  }
}
