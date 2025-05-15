import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class DimAdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    ads: {
      ad_id: string;
      ad_name: string;
      advertiser_id: string;
      adgroup_id: string;
    }[],
  ): Promise<void> {
    await this.prisma.TiktokDimensionAd.createMany({
      data: ads,
      skipDuplicates: true,
    });
  }
}
