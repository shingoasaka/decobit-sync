import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface RentracksClickRawData {
  備考?: string;
  クリック数?: string;
}

interface RentracksClickFormattedData {
  remarks: string | null;
  click: number;
}

@Injectable()
export class RentracksClickLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RentracksClickRawData): RentracksClickFormattedData {
    return {
      remarks: item["備考"] || null,
      click: item["クリック数"] ? parseInt(item["クリック数"], 10) : 0,
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
