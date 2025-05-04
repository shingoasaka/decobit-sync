import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { AspType, Prisma } from "@operate-ad/prisma";
import { getNowJst } from "src/libs/date-utils";

@Injectable()
export abstract class BaseAspRepository {
  protected readonly logger: Logger;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly aspType: AspType,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  protected async saveToCommonTable(
    data: any[],
    tableName: "aspClickLog" | "aspActionLog",
    options: {
      clickDateTime?: Date | null;
      actionDateTime?: Date | null;
      clickCount?: number;
      referrerUrl?: string | null;
      uid?: string | null;
    } = {},
  ): Promise<number> {
    try {
      const now = getNowJst();
      const commonData = data.map((item) => ({
        aspType: this.aspType,
        clickDateTime: options.clickDateTime,
        actionDateTime: options.actionDateTime,
        affiliateLinkName: item.affiliateLinkName,
        clickCount: options.clickCount,
        referrerUrl: options.referrerUrl,
        uid: options.uid,
        createdAt: now,
        updatedAt: now,
      }));

      let result;
      if (tableName === "aspClickLog") {
        result = await this.prisma.aspClickLog.createMany({
          data: commonData as Prisma.AspClickLogCreateManyInput[],
          skipDuplicates: true,
        });
      } else {
        result = await this.prisma.aspActionLog.createMany({
          data: commonData as Prisma.AspActionLogCreateManyInput[],
          skipDuplicates: true,
        });
      }

      this.logger.log(
        `Successfully inserted ${result.count} records to ${tableName}`,
      );
      return result.count;
    } catch (error) {
      this.logger.error(`Error saving to ${tableName}:`, error);
      throw error;
    }
  }
}
