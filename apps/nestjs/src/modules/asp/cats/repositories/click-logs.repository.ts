import { Injectable } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { getNowJst, parseToJst } from "src/libs/date-utils";
import { BaseAspRepository } from "../../base/repository.base";
import { AspType } from "@operate-ad/prisma";

// 入力データの型定義
interface RawCatsData {
  [key: string]: string | null | undefined;
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

  private getValue(item: RawCatsData, key: string): string | null {
    return item[key] || null;
  }

  private formatData(item: RawCatsData): FormattedCatsData {
    const now = getNowJst();
    return {
      clickDateTime: parseToJst(this.getValue(item, "クリック日時")),
      affiliateLinkName: this.getValue(item, "広告名"),
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * DB にデータを保存
   */
  async save(conversionData: RawCatsData[]): Promise<number> {
    try {
      const formatted = conversionData.map((item) => this.formatData(item));

      // Save to common table
      return await this.saveToCommonTable(formatted, "aspClickLog", {
        clickDateTime: formatted[0]?.clickDateTime,
      });
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
