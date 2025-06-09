import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { getNowJst, parseToJst } from "src/libs/date-utils";
import { BaseAspRepository } from "../../base/repository.base";
import { AspType } from "@operate-ad/prisma";

// CATS固有のカラム名を持つインターフェース・個別形式
interface RawCatsData {
  クリック日時?: string;
  広告名?: string;
}

// 変換後のデータの型定義
interface FormattedCatsData {
  clickDateTime: Date | null;
  affiliateLinkName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

@Injectable()
export class CatsClickLogRepository extends BaseAspRepository {
  protected readonly format = "individual" as const;

  constructor(protected readonly prisma: PrismaService) {
    super(prisma, AspType.CATS);
  }

  /**
   * CSV を読み込み、DB に保存し、挿入件数を返します。
   */
  async processCsvAndSave(downloadPath: string): Promise<number> {
    try {
      // CSVファイルを読み込む (Shift-JIS が想定なら iconv で変換)
      const fileBuffer = fs.readFileSync(downloadPath);
      const utf8Content = iconv.decode(fileBuffer, "Shift_JIS");

      // CSV をパースして RawCatsData の配列を作る
      const records = parse(utf8Content, {
        columns: true,
        skip_empty_lines: true,
      }) as RawCatsData[];

      if (!records || records.length === 0) {
        this.logger.warn("CSVにデータがありませんでした");
        return 0;
      }

      // 保存処理
      const insertedCount = await this.save(records);
      this.logger.log(`processCsvAndSave: Inserted ${insertedCount} records`);
      return insertedCount;
    } catch (error) {
      this.logger.error("Error in processCsvAndSave", error);
      throw error;
    }
  }

  /**
   * DB にデータを保存
   */
  async save(logs: RawCatsData[]): Promise<number> {
    try {
      const formatted = await Promise.all(
        logs
          .filter((item) => {
            if (!item["クリック日時"] || !item["広告名"]) {
              this.logger.warn(
                `Skipping invalid record: ${JSON.stringify(item)}`,
              );
              return false;
            }
            return true;
          })
          .map(async (item) => {
            try {
              const clickDateTime = parseToJst(item["クリック日時"]);
              const affiliateLinkName = item["広告名"];

              if (!clickDateTime) {
                this.logger.warn(
                  `Invalid date format: ${item["クリック日時"]}`,
                );
                return null;
              }

              // 名前→ID変換
              const affiliateLink = await this.prisma.affiliateLink.upsert({
                where: {
                  asp_type_affiliate_link_name: {
                    asp_type: this.aspType,
                    affiliate_link_name: affiliateLinkName!,
                  },
                },
                update: {},
                create: {
                  asp_type: this.aspType,
                  affiliate_link_name: affiliateLinkName!,
                },
              });

              return {
                clickDateTime,
                affiliate_link_id: affiliateLink.id,
                referrer_link_id: null, // CATSは常にnull
                referrerUrl: null,
              };
            } catch (error) {
              this.logger.error(
                `Error processing record: ${JSON.stringify(item)}`,
                error,
              );
              return null;
            }
          }),
      );

      const validRecords = formatted.filter(
        (record): record is NonNullable<typeof record> => record !== null,
      );

      if (validRecords.length === 0) {
        this.logger.warn("No valid records to save");
        return 0;
      }

      return await this.saveToCommonTable(validRecords);
    } catch (error) {
      this.logger.error("Error saving CATS click logs:", error);
      throw error;
    }
  }
}
