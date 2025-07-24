import { google } from "googleapis";
import { readFileSync } from "fs";
import { JWT } from "google-auth-library";

interface WriteToSpreadsheetOptions {
  spreadsheetId: string;
  sheetName: string;
  values: string[][];
}

export async function writeToSpreadsheet(options: WriteToSpreadsheetOptions) {
  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS!;
  const credentials = JSON.parse(readFileSync(keyFilePath, "utf-8"));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  // ✅ 型エラー回避のために明示的にJWT型を使用
  const authClient = (await auth.getClient()) as JWT;

  const sheets = google.sheets({
    version: "v4",
    auth: authClient,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: options.spreadsheetId,
    range: `${options.sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: options.values,
    },
  });
}
