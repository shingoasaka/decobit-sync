import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@prisma/client";

interface RawRentracksData {
  売上日時?: string;
  備考?: string;
}

interface FormattedRentracksData {
  salesDateTime: Date | null;
  remarks: string | null;
}

@Injectable()
export class RentracksActionLogRepository {
  private readonly logger = new Logger(RentracksActionLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private formatData(item: RawRentracksData): FormattedRentracksData {
    return {
      salesDateTime: item["売上日時"]
        ? new Date(item["売上日時"].replace(/（.*?）/, ""))
        : null,
      remarks: item["備考"] || null,
    };
  }

  async save(conversionData: RawRentracksData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.rentracksActionLog.createMany({
        data: formatted,
        skipDuplicates: true,
      });

      this.logger.log(
        `Successfully inserted ${result.count} rentracksActionLog records`,
      );
      return result.count;
    } catch (error) {
      this.logger.error("Error saving rentracks action logs:", error);
      throw error;
    }
  }
}
