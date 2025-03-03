/**
 * LogService インターフェースは、各広告/アクションログの取得とデータベースへの挿入処理を
 * 一貫して実行できるように定義したものです。
 *
 * CronService の中で、注入された複数の LogService 実装を順番に呼び出し、
 * fetchAndInsertLogs() を実行することで、
 * 各サービスに合わせたログ取得 → DB保存を行います。
 */
export interface LogService {
  /**
   * 外部サイトや API からアクションログなどを取得し、DBへ挿入する。
   * 処理件数（挿入されたレコード数など）を返す。
   */
  fetchAndInsertLogs(): Promise<number>;
}
