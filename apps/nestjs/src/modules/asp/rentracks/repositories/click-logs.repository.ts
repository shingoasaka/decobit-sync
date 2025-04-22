import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";

interface RawRentracksData {
  備考?: string;
  クリック数?: string;
}

interface FormattedRentracksData {
  remarks: string | null;
  click: number;
}

@Injectable()
export class RentracksClickLogRepository {
  private readonly logger = new Logger(RentracksClickLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RawRentracksData): FormattedRentracksData {
    return {
      remarks: item["備考"] || null,
      click: item["クリック数"] ? parseInt(item["クリック数"], 10) : 0,
    };
  }

  async save(conversionData: RawRentracksData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.rentracksClickLog.createMany({
        data: formatted,
        skipDuplicates: true,
      });

      this.logger.log(
        `Successfully inserted ${result.count} rentracksClickLog records`,
      );
      return result.count;
    } catch (error) {
      this.logger.error("Error saving rentracks click logs:", error);
      throw error;
    }
  }
}
