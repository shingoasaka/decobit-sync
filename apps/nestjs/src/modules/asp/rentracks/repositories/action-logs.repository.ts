import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

interface RentracksRawData {
  売上日時?: string;
  備考?: string;
}

interface RentracksFormattedData {
  salesDateTime: Date | null;
  remarks: string | null;
}

@Injectable()
export class RentracksActionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RentracksRawData): RentracksFormattedData {
    return {
      salesDateTime: item["売上日時"]
        ? new Date(item["売上日時"].replace(/（.*?）/, ""))
        : null,
      remarks: item["備考"] || null,
    };
  }

  async save(conversionData: RentracksRawData[]): Promise<void> {
    for (const item of conversionData) {
      const formattedData = this.formatData(item);
      await this.prisma.rentracksActionLog.create({
        data: formattedData,
      });
    }
  }
}
