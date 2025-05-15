import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class DimAdgroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    adgroups: {
      adgroup_id: string;
      adgroup_name: string;
      advertiser_id: string;
      campaign_id: string;
    }[],
  ): Promise<void> {
    await this.prisma.tiktokDimensionAdgroup.createMany({
      data: adgroups,
      skipDuplicates: true,
    });
  }
}
