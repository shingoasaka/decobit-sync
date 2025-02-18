import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";

@Injectable()
export class NavicluClickLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(conversionData: any[]) {
    for (const item of conversionData) {
      await this.prisma.rentracksClickLog.create({
        data: {
          remarks: item["備考"] || null,
          click: item["クリック数"] ? parseInt(item["クリック数"], 10) : 0,
          selesNumber: item["売上件数"] ? parseInt(item["売上件数"], 10) : 0,
          ocRate: item["O/C率"]
            ? parseFloat(item["O/C率"].replace("%", ""))
            : 0,
          approvedNnumber: item["承認済件数"]
            ? parseInt(item["承認済件数"], 10)
            : 0,
          approvedRewardAmount: item["承認済報酬"]
            ? parseInt(item["承認済報酬"].replace("\\", ""), 10)
            : 0,
        },
      });
    }
  }
}
