import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@prismaService";
import { Prisma } from "@operate-ad/prisma";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";

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
}

@Injectable()
export class CatsClickLogRepository {
  private readonly logger = new Logger(CatsClickLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

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

  private toDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      this.logger.warn(`Invalid date format: ${dateStr}`);
      return null;
    }
  }

  private normalizeKey(key: string): string {
    // キー名の先頭に余計な文字などがあれば除去
    return key.replace(/^.*?/, "");
  }

  private getValue(item: RawCatsData, key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    return item[key] || item[normalizedKey] || null;
  }

  private formatData(item: RawCatsData): FormattedCatsData {
    return {
      clickDateTime: this.toDate(this.getValue(item, "クリック日時")),
      affiliateLinkName: this.getValue(item, "広告名"),
    };
  }

  /**
   * DB にデータを保存
   */
  async save(conversionData: RawCatsData[]): Promise<number> {
    try {
      const formattedData = conversionData.map((item) => this.formatData(item));

      const result = await this.prisma.catsClickLog.createMany({
        data: formattedData,
        skipDuplicates: true,
      });

      this.logger.log(`Successfully inserted ${result.count} records`);
      return result.count;
    } catch (error) {
      this.logger.error("Error saving conversion data:", error);
      throw error;
    }
  }
}
