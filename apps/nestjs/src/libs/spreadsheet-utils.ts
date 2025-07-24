import { google } from "googleapis";
import { JWT } from "google-auth-library";

interface WriteToSpreadsheetOptions {
  spreadsheetId: string;
  sheetName: string;
  values: string[][];
}

export async function writeToSpreadsheet(options: WriteToSpreadsheetOptions) {
  const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!rawJson) {
    throw new Error("❌ GOOGLE_APPLICATION_CREDENTIALS が未設定です");
  }

  let credentials: {
    client_email: string;
    private_key: string;
  };

  try {
    credentials = JSON.parse(rawJson);
  } catch (err) {
    console.error("❌ GOOGLE_APPLICATION_CREDENTIALS の JSON パース失敗");
    throw err;
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  console.log("📤 Google Sheets 出力対象:");
  console.log("スプレッドシートID:", options.spreadsheetId);
  console.log("シート名:", options.sheetName);
  console.log("貼り付け行数:", options.values.length);
  console.log("貼り付け列数:", options.values[0]?.length || 0);

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: options.spreadsheetId,
      range: `${options.sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: options.values,
      },
    });
    console.log("✅ Google Sheets 書き込み成功");
  } catch (error) {
    console.error("❌ Google Sheets 書き込み失敗:", error);
    throw error;
  }
}
