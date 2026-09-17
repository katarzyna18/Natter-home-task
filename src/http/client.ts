import {
  MAX_RETRIES,
  REQUEST_TIMEOUT_MS,
  RETRY_BASE_DELAY_MS,
  USER_AGENT,
} from "../config.js";

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly url?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface HttpClientOptions {
  timeoutMs?: number;
  maxRetries?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof HttpError) {
    if (error.status !== undefined && isRetryableStatus(error.status)) {
      return true;
    }
    // Timeouts are converted to HttpError without a status code.
    return /timed out/i.test(error.message);
  }
  if (error instanceof Error) {
    const name = error.name;
    return (
      name === "AbortError" ||
      name === "TimeoutError" ||
      /network|fetch|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(error.message)
    );
  }
  return false;
}

export class HttpClient {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: HttpClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.userAgent = options.userAgent ?? USER_AGENT;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getText(url: string): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        return await this.getTextOnce(url);
      } catch (error) {
        lastError = error;
        const canRetry =
          attempt < this.maxRetries && isRetryableError(error);
        if (!canRetry) {
          throw error;
        }
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Failed to fetch ${url}`);
  }

  private async getTextOnce(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": this.userAgent,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status} for ${url}`,
          response.status,
          url,
        );
      }

      return await response.text();
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError")
      ) {
        throw new HttpError(`Request timed out for ${url}`, undefined, url);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
