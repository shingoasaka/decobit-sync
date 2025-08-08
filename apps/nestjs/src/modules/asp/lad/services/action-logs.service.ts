import { Injectable } from "@nestjs/common";
import { Browser, Page } from "playwright";
import * as fs from "fs";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";
import { LogService } from "src/modules/logs/types";
import dotenv from "dotenv";
// import { LadActionLogRepository } from "../repositories/action-logs.repository";
// import { parseToJst } from "src/libs/date-utils";
import { BaseAspService } from "../../base/base-asp.service";
import { writeToSpreadsheet, convertTo2DArray } from "../../../../libs/spreadsheet-utils";

dotenv.config();

interface RawLadData {
  // 成果日時?: string;
  // 遷移広告URL名?: string;
  // "リファラ(クリック)"?: string;
  [key: string]: string | undefined;
}

@Injectable()
export class LadActionLogService extends BaseAspService implements LogService {
  // constructor(private readonly repository: LadActionLogRepository) {
  constructor() {
  super(LadActionLogService.name);
  }

  // async fetchAndInsertLogs(): Promise<number> {
  async fetchAndInsertLogs(): Promise<RawLadData[]> {
    console.log("🧪 fetchAndInsertLogs 実行されました");

    const result = await this.executeWithBrowser(
      async (browser: Browser, page: Page) => {
        return await this.performLadActionOperation(page);
      },
      "Ladアクションログ取得エラー",
    );

    // return result || 0;
    return result || [];
  }

  // private async performLadActionOperation(page: Page): Promise<number> {
  private async performLadActionOperation(page: Page): Promise<RawLadData[]> {
    await this.navigateToPage(page, "https://admin038.l-ad.net/front/login/");

    await page
      .getByRole("textbox", { name: "ログインID" })
      .fill(process.env.LAD_MEN_USERNAME ?? "");
    await page
      .getByRole("textbox", { name: "パスワード" })
      .fill(process.env.LAD_MEN_PASSWORD ?? "");
    await page.getByRole("button", { name: "ログイン" }).click();

    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await page.getByRole("link", { name: "ログ集計" }).click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    await page.getByRole("link", { name: "成果ログ" }).click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    
    await page.getByRole("button", { name: "本日" }).click();

    await page
      .waitForResponse(
        (response) =>
          response.url().includes("/admin/actionlog/") &&
          response.status() === 200,
        { timeout: 20000 },
      )
      .catch(() =>
        this.logger.warn("レスポンス待機タイムアウト、処理を継続します"),
      );

    await page.getByRole("button", { name: " CSV生成" }).click();

    await page.waitForTimeout(60000);

    await this.navigateToPage(
      page,
      "https://admin038.l-ad.net/admin/actionlog/list",
    );

  await page.waitForSelector('div[class^="csvInfoExport"]', { timeout: 15000 }).catch(() => {
    this.logger.warn("csvInfoExport ブロックが見つかりませんでした");
  });

    // 📅 対象日（本日）の文字列（例: 2025年08月06日(JST)）
    const nowJst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const target = new Date(nowJst.getFullYear(), nowJst.getMonth(), nowJst.getDate());
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const expectedDateStr = `${y}年${m}月${d}日`;

  // 一覧から必要情報をまとめて取得（ブラウザ→Node に返す）
  const blocks = await page.$$eval('div[class^="csvInfoExport"]', (nodes) => {
    return Array.from(nodes).slice(0, 5).map((el, idx) => {
      const text = (el.textContent || "").replace(/\s+/g, "");

      // [対象期間:YYYY年MM月DD日-YYYY年MM月DD日] / [対象期間:YYYY年MM月DD日] を抽出
      const m =
        text.match(/\[対象期間:(\d{4}年\d{2}月\d{2}日)\s*[-〜]\s*(\d{4}年\d{2}月\d{2}日)\]/) ||
        text.match(/\[対象期間:(\d{4}年\d{2}月\d{2}日)\]/);
      const start = m?.[1] || null;
      const end = (m && m.length >= 3 && m[2]) ? m[2] : start; // 右端が無ければ start を使う

      // a要素からファイル名候補を吸い出す（onclick / data-file / href）
      const a = el.querySelector("a") as HTMLAnchorElement | null;
      const onclick = a?.getAttribute("onclick") || "";
      let fileName =
        onclick.match(/"(.*?\.csv)"/)?.[1] ||
        a?.getAttribute("data-file") ||
        a?.getAttribute("href")?.match(/[^/\\]+\.csv/)?.[0] ||
        null;

      // ダメならテキスト中の *.csv を最後の手段で拾う
      if (!fileName) {
        fileName = text.match(/[A-Za-z0-9_-]+\.csv/)?.[0] || null;
      }

      return {
        index: idx + 1,        // csvInfoExport{index} に対応
        rawText: text,
        periodStart: start,
        periodEnd: end,
        fileName,
        outerHTMLWhenNoFile: (!fileName && el instanceof HTMLElement) ? (el as HTMLElement).outerHTML : null,
      };
    });
  });

  // 取得したブロックをログ（右端で突合するのを明示）
  for (const b of blocks) {
    console.log(`🧪 csvブロック確認: csvInfoExport${b.index}: ${b.rawText}`);
    console.log(`🧪 periodStart: ${b.periodStart}, periodEnd(右端): ${b.periodEnd}, fileName: ${b.fileName}`);
    if (!b.fileName && b.outerHTMLWhenNoFile) {
      console.log(`🧪 fileNameが取れない要素のouterHTML: ${b.outerHTMLWhenNoFile}`);
    }
  }

  // 突合に使う実値（右端）を事前にログ出しして目視確認
  for (const b of blocks) {
    const compareTarget = b.periodEnd ?? b.periodStart;
    console.log(`🧪 突合直前ログ: compareTarget(右端)=${compareTarget} / expected=${expectedDateStr} / equal=${compareTarget === expectedDateStr}`);
  }

  // 右端（periodEnd）優先でヒット
  const hit = blocks.find(b => (b.periodEnd ?? b.periodStart) === expectedDateStr && b.fileName);

  if (!hit) {
    this.logger.warn(`対象期間「${expectedDateStr}」（右端）に一致するCSVリンクが見つからず`);
    return [];
  }

  console.log(`✅ ヒット: csvInfoExport${hit.index}, file=${hit.fileName}`);

  // クリック対象（中の <a> ならOK。onclick/href どっちでも反応する想定）
  const matchedFileName = hit.fileName!;
  const targetSelector = `div.csvInfoExport${hit.index} a`;

  // ダウンロード（ファイル名でガード）
  const [download] = await Promise.all([
    this.waitForDownload_lad(page, matchedFileName),
    page.click(targetSelector),
  ]).catch((err: unknown) => {
    this.logger.error("ダウンロード待機中にエラー:", err);
    return [null];
  });

    // const [download] = await Promise.all([
    //   this.waitForDownload(page),
    //   page.click('div.csvInfoExport1 a[href^="javascript:void(0)"]'),
    // ]).catch((error: unknown) => {
    //   this.logger.error("ダウンロード待機中にエラーが発生しました:", error);
    //   return [null];
    // });

    if (!download) {
      this.logger.warn(
        "ダウンロードイベントが取得できませんでした。処理を中止します。",
      );
      return [];
    }

    const downloadPath = await download.path().catch((error: unknown) => {
      this.logger.error("ダウンロードパスの取得に失敗しました:", error);
      return null;
    });

    if (!downloadPath) {
      this.logger.warn("ダウンロードパスが取得できません。処理を中止します。");
      return [];
    }

    const rawData = await this.processCsv(downloadPath);
    console.log("🧪 rawData 件数:", rawData.length);
    // const formattedData = await this.transformData(rawData);
    // return await this.repository.save(formattedData);

    // スプレッドシート書き込み処理
    try {
      await writeToSpreadsheet({
        spreadsheetId: process.env.SPREADSHEET_ID_LAD_MEN_ACTION || "",
        sheetName: "Lad_CV_Referrer_Today_Mensclear_test",
        values: convertTo2DArray(rawData),
      });

      this.logger.log("スプレッドシートへの書き出しに成功しました。");
    } catch (e) {
      this.logger.error(`スプレッドシートへの書き出しに失敗しました: ${e}`);
    }

    return rawData;
  }

  private async processCsv(filePath: string): Promise<RawLadData[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const utf8Data = iconv.decode(buffer, "Shift_JIS");

      const records = parse(utf8Data, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as RawLadData[];

      if (!records || records.length === 0) {
        this.logger.warn("CSVにデータがありませんでした");
        return [];
      }

      return records;
    } catch (error) {
      throw new Error(
        `CSVの処理に失敗しました: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        this.logger.error("一時ファイルの削除に失敗しました:", error);
      }
    }
  }

  // private async transformData(rawData: RawLadData[]) {
  //   const formatted = await Promise.all(
  //     rawData
  //       .filter((item) => {
  //         if (!item["成果日時"] || !item["遷移広告URL名"]) {
  //           this.logger.warn(
  //             `Skipping invalid record: ${JSON.stringify(item)}`,
  //           );
  //           return false;
  //         }
  //         return true;
  //       })
  //       .map(async (item) => {
  //         try {
  //           const actionDateTime = parseToJst(item["成果日時"]);
  //           const affiliateLinkName = item["遷移広告URL名"]?.trim();
  //           const referrer_url = item["リファラ(クリック)"]?.trim() || null;

  //           if (!actionDateTime) {
  //             this.logger.warn(`Invalid date format: ${item["成果日時"]}`);
  //             return null;
  //           }

  //           if (!affiliateLinkName) {
  //             this.logger.warn("遷移広告URL名が空です");
  //             return null;
  //           }

  //           const affiliateLink =
  //             await this.repository.getOrCreateAffiliateLink(affiliateLinkName);

  //           const { referrerLinkId, referrer_url: processedReferrerUrl } =
  //             await this.repository.processReferrerLink(referrer_url);

  //           return {
  //             actionDateTime,
  //             affiliate_link_id: affiliateLink.id,
  //             referrer_link_id: referrerLinkId,
  //             referrer_url: processedReferrerUrl,
  //             uid: null,
  //           };
  //         } catch (error) {
  //           this.logger.error(
  //             `Error processing record: ${JSON.stringify(item)}`,
  //             error,
  //           );
  //           return null;
  //         }
  //       }),
  //   );

  //   return formatted.filter(
  //     (record): record is NonNullable<typeof record> => record !== null,
  //   );
  // }
}
