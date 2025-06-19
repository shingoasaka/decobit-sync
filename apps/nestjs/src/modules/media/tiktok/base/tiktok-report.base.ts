import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TikTokReportDto } from "../dtos/tiktok-report.dto";
import {
  MediaError,
  ErrorType,
  ERROR_CODES,
  ERROR_MESSAGES,
} from "../../common/errors/media.error";

interface TikTokApiParams {
  advertiser_ids: string;
  report_type: string;
  dimensions: string;
  metrics: string;
  start_date: string;
  end_date: string;
  primary_status: string;
  page: number;
  page_size: number;
}

export interface TikTokApiHeaders extends Record<string, string> {
  "Access-Token": string;
  "Content-Type": string;
}

interface TikTokApiResponseData {
  list: TikTokReportDto[];
  page_info: { has_next: boolean };
}

interface TikTokApiResponse {
  data: TikTokApiResponseData;
}

@Injectable()
export abstract class TikTokReportBase {
  protected readonly logger: Logger;
  protected readonly retryConfig = {
    maxRetries: 5,
    initialDelay: 3000,
    maxDelay: 120000,
    factor: 2,
  };
  protected readonly TIMEOUT = 60000;
  protected readonly REQUEST_INTERVAL = 1000;
  protected readonly RATE_LIMIT_BACKOFF = 60000;
  protected abstract readonly apiUrl: string;

  constructor(
    protected readonly http: HttpService,
    serviceName: string,
  ) {
    this.logger = new Logger(serviceName);
    this.validateEnvironment();
  }

  protected validateEnvironment(): void {
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (!accessToken) {
      throw new MediaError(
        ERROR_MESSAGES.ACCESS_TOKEN_MISSING,
        ERROR_CODES.AUTH_TOKEN_MISSING,
        ErrorType.AUTHENTICATION,
      );
    }
  }

  protected validateDate(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) {
      throw new MediaError(
        `${ERROR_MESSAGES.INVALID_DATE}: ${date}`,
        ERROR_CODES.INVALID_DATE,
        ErrorType.VALIDATION,
      );
    }
    return true;
  }

  protected validateMetrics(metrics: string[]): boolean {
    if (!Array.isArray(metrics) || metrics.length === 0) {
      throw new MediaError(
        ERROR_MESSAGES.INVALID_METRICS,
        ERROR_CODES.INVALID_METRICS,
        ErrorType.VALIDATION,
      );
    }
    return true;
  }

  protected validateDimensions(dimensions: string[]): boolean {
    if (!Array.isArray(dimensions) || dimensions.length === 0) {
      throw new MediaError(
        ERROR_MESSAGES.INVALID_DIMENSIONS,
        ERROR_CODES.INVALID_METRICS,
        ErrorType.VALIDATION,
      );
    }
    return true;
  }

  protected safeBigInt(value: string | number | undefined): bigint {
    if (value === undefined) {
      throw new MediaError(
        ERROR_MESSAGES.REQUIRED_ID_UNDEFINED,
        ERROR_CODES.INVALID_METRICS,
        ErrorType.VALIDATION,
      );
    }
    return BigInt(value);
  }

  protected parseNumber(value: string | number | undefined): number {
    const parsed = typeof value === "number" ? value : parseFloat(value ?? "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  protected async makeApiRequest(
    params: TikTokApiParams,
    headers: TikTokApiHeaders,
  ): Promise<TikTokApiResponseData> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            this.retryConfig.initialDelay *
              Math.pow(this.retryConfig.factor, attempt),
            this.retryConfig.maxDelay,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const response = await firstValueFrom(
          this.http.get<TikTokApiResponse>(this.apiUrl, {
            params,
            headers,
            timeout: this.TIMEOUT,
          }),
        );

        if (!response?.data?.data?.list) {
          throw new MediaError(
            ERROR_MESSAGES.INVALID_RESPONSE,
            ERROR_CODES.API_INVALID_RESPONSE,
            ErrorType.API,
          );
        }

        return response.data.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt === this.retryConfig.maxRetries) {
          throw new MediaError(
            ERROR_MESSAGES.API_TIMEOUT,
            ERROR_CODES.API_TIMEOUT,
            ErrorType.API,
            { originalError: error },
          );
        }
      }
    }

    if (!lastError) {
      throw new MediaError(
        ERROR_MESSAGES.API_ERROR,
        ERROR_CODES.API_ERROR,
        ErrorType.API,
      );
    }

    throw lastError;
  }

  private isNonRetryableError(error: unknown): boolean {
    return (
      error instanceof MediaError && error.type === ErrorType.AUTHENTICATION
    );
  }

  protected logError(message: string, error: unknown): void {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      service: this.constructor.name,
      message,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error),
    };

    if (error instanceof MediaError) {
      switch (error.type) {
        case ErrorType.AUTHENTICATION:
          this.logger.error("認証エラー", errorDetails);
          break;
        case ErrorType.API:
          this.logger.warn("APIエラー", errorDetails);
          break;
        case ErrorType.BUSINESS:
          this.logger.error("ビジネスロジックエラー", errorDetails);
          break;
        case ErrorType.VALIDATION:
          this.logger.warn("バリデーションエラー", errorDetails);
          break;
      }
    } else {
      this.logger.error("予期せぬエラー", errorDetails);
    }
  }

  protected logInfo(message: string): void {
    this.logger.log(message);
  }

  protected logWarn(message: string): void {
    this.logger.warn(message);
  }

  protected logDebug(message: string): void {
    this.logger.debug(message);
  }
}
