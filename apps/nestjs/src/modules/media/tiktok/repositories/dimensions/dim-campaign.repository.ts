import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class DimCampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    campaigns: {
      campaign_id: string;
      advertiser_id: string;
      campaign_name?: string;
    }[],
  ): Promise<void> {
    await this.prisma.tiktokDimensionCampaign.createMany({
      data: campaigns,
      skipDuplicates: true,
    });
  }
}
