export interface LogService {
  fetchAndInsertLogs(): Promise<number>;
}
