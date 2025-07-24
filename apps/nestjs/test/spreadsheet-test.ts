import { writeToSpreadsheet } from "../src/libs/spreadsheet-utils";
import * as dotenv from "dotenv";
import * as path from "path";
import { ClickLogService } from "../src/modules/asp/lad/services/click-logs.service";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

(async () => {
  const service = new ClickLogService(); // DI未使用の簡易呼び出し

  const rawData = await service.fetchClickLogs(); // ← 任意のデータ取得メソッドに変更

  if (!rawData || rawData.length === 0) {
    console.log("❌ データが空です");
    return;
  }

  const headers = Object.keys(rawData[0]);
  const rows = rawData.map((row: Record<string, any>) =>
    headers.map((key) => row[key] ?? ""),
  );

  const values = [headers, ...rows];

  await writeToSpreadsheet({
    spreadsheetId: process.env.SPREADSHEET_ID_LAD_CLICK!,
    sheetName: "Lad_Click_Referrer_Today_test",
    values,
  });

  console.log("✅ スプレッドシート書き込み完了（全データ出力）");
})();
