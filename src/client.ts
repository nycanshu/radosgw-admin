import { signRequest } from './signer.js';
import {
  RGWError,
  RGWNotFoundError,
  RGWAuthError,
  RGWConflictError,
  RGWValidationError,
} from './errors.js';
import type { ClientConfig, RequestOptions } from './types/common.types.js';

const DEFAULT_ADMIN_PATH = '/admin';
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_REGION = 'us-east-1';

/**
 * Validates the client configuration on construction.
 */
function validateConfig(config: ClientConfig): void {
  if (!config.host || typeof config.host !== 'string') {
    throw new RGWValidationError('host is required and must be a non-empty string');
  }
  if (!config.accessKey || typeof config.accessKey !== 'string') {
    throw new RGWValidationError('accessKey is required and must be a non-empty string');
  }
  if (!config.secretKey || typeof config.secretKey !== 'string') {
    throw new RGWValidationError('secretKey is required and must be a non-empty string');
  }
  if (
    config.port !== undefined &&
    (config.port < 1 || config.port > 65535 || !Number.isInteger(config.port))
  ) {
    throw new RGWValidationError('port must be an integer between 1 and 65535');
  }
  if (config.timeout !== undefined && (config.timeout < 0 || !Number.isFinite(config.timeout))) {
    throw new RGWValidationError('timeout must be a non-negative finite number');
  }
  if (
    config.maxRetries !== undefined &&
    (config.maxRetries < 0 || !Number.isInteger(config.maxRetries))
  ) {
    throw new RGWValidationError('maxRetries must be a non-negative integer');
  }
  if (
    config.retryDelay !== undefined &&
    (config.retryDelay < 0 || !Number.isFinite(config.retryDelay))
  ) {
    throw new RGWValidationError('retryDelay must be a non-negative finite number');
  }
}

/**
 * Transforms snake_case, kebab-case, or dot-separated keys to camelCase recursively.
 * e.g. "display-name" → "displayName", "rgw.main" → "rgwMain"
 */
export function toCamelCase(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.replaceAll(/[-_.]([a-z])/g, (_, c: string) => c.toUpperCase()),
        toCamelCase(v),
      ]),
    );
  }
  return obj;
}

/**
 * Transforms camelCase keys to kebab-case for outgoing query params.
 * RGW Admin API uses hyphenated params (e.g. display-name, max-buckets).
 */
function toKebabCase(key: string): string {
  return key.replaceAll(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * Maps HTTP error responses to typed RGW errors.
 */
function mapHttpError(status: number, body: string, code?: string): RGWError {
  switch (status) {
    case 404:
      return new RGWNotFoundError('Resource', code ?? 'unknown');
    case 403:
      return new RGWAuthError(
        body || 'Access denied. Check your admin credentials and user capabilities.',
      );
    case 409:
      return new RGWConflictError('Resource', code ?? 'unknown');
    case 400:
      return new RGWValidationError(body || 'Invalid request parameters');
    default:
      return new RGWError(body || `HTTP ${status}`, status, code);
  }
}

/**
 * Core HTTP client for making signed requests to the RGW Admin API.
 * @internal
 */
export class BaseClient {
  private readonly host: string;
  private readonly port: number | undefined;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly adminPath: string;
  private readonly timeout: number;
  private readonly region: string;
  private readonly debug: boolean;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly insecure: boolean;

  constructor(config: ClientConfig) {
    validateConfig(config);

    let host = config.host;
    while (host.endsWith('/')) {
      host = host.slice(0, -1);
    }
    this.host = host;
    this.port = config.port;
    this.accessKey = config.accessKey;
    this.secretKey = config.secretKey;
    this.adminPath = config.adminPath ?? DEFAULT_ADMIN_PATH;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.region = config.region ?? DEFAULT_REGION;
    this.debug = config.debug ?? false;
    this.maxRetries = config.maxRetries ?? 0;
    this.retryDelay = config.retryDelay ?? 200;
    this.insecure = config.insecure ?? false;

    if (this.insecure) {
      this.log('WARNING: TLS certificate verification is disabled');
    }
  }

  /**
   * Logs a debug message with optional structured data.
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (!this.debug) return;
    const prefix = '[radosgw-admin]';
    if (data) {
      console.debug(prefix, message, JSON.stringify(data, null, 2));
    } else {
      console.debug(prefix, message);
    }
  }

  /**
   * Determines whether an error is retryable (5xx, timeouts, network errors).
   */
  private isRetryable(error: unknown): boolean {
    if (error instanceof RGWError) {
      if (error.statusCode !== undefined) {
        return error.statusCode >= 500;
      }
      // Network errors wrapped by wrapFetchError
      if (error.code === 'NetworkError' || error.code === 'Timeout') {
        return true;
      }
    }
    if (error instanceof Error) {
      return error.name === 'AbortError' || this.hasNetworkErrorPattern(error);
    }
    return false;
  }

  /**
   * Checks an error and its cause chain for network error patterns.
   */
  private hasNetworkErrorPattern(error: Error): boolean {
    const patterns = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'ECONNABORTED',
      'fetch failed',
    ];
    let current: Error | undefined = error;
    while (current) {
      if (patterns.some((p) => current!.message.includes(p))) {
        return true;
      }
      current = current.cause instanceof Error ? current.cause : undefined;
    }
    return false;
  }

  /**
   * Returns a promise that resolves after the given number of milliseconds.
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Makes a signed HTTP request to the RGW Admin API with retry support.
   *
   * @param options - Request method, path, query params, and optional body
   * @returns Parsed and camelCase-transformed JSON response, or void for empty responses
   */
  async request<T>(options: RequestOptions): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const backoff = this.retryDelay * Math.pow(2, attempt - 1);
        this.log(`retry ${attempt}/${this.maxRetries} after ${backoff}ms`);
        await this.delay(backoff);
      }

      try {
        return await this.executeRequest<T>(options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log('error', { error: lastError.message });

        if (attempt < this.maxRetries && this.isRetryable(error)) {
          this.log('retryable error', { error: lastError.message, attempt });
          continue;
        }
        throw error;
      }
    }

    throw lastError ?? new RGWError('Request failed after retries', undefined, 'RetryExhausted');
  }

  /**
   * Builds the full request URL with query parameters.
   */
  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): URL {
    const baseUrl = this.port ? `${this.host}:${this.port}` : this.host;
    const fullPath = `${this.adminPath}${path}`;
    const url = new URL(fullPath, baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(toKebabCase(key), String(value));
        }
      }
    }

    url.searchParams.set('format', 'json');
    return url;
  }

  /**
   * Temporarily disables TLS certificate verification for insecure mode.
   * Returns the previous value so it can be restored.
   */
  private disableTlsVerification(): string | undefined {
    const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return prev;
  }

  /**
   * Restores the TLS verification setting to its previous value.
   */
  private restoreTlsVerification(prev: string | undefined): void {
    if (prev === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
  }

  /**
   * Parses an error response body to extract the RGW error code.
   */
  private parseErrorCode(text: string): string | undefined {
    try {
      const errorBody = JSON.parse(text) as Record<string, unknown>;
      return (errorBody.Code as string) ?? undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Wraps a non-RGW error into the appropriate RGW error type.
   */
  private wrapFetchError(error: unknown): RGWError {
    if (error instanceof RGWError) return error;
    if (error instanceof Error && error.name === 'AbortError') {
      return new RGWError(`Request timed out after ${this.timeout}ms`, undefined, 'Timeout');
    }
    return new RGWError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      'NetworkError',
    );
  }

  /**
   * Executes a single signed HTTP request to the RGW Admin API.
   */
  private async executeRequest<T>(options: RequestOptions): Promise<T> {
    const { method, path, query, body } = options;
    const url = this.buildUrl(path, query);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const signedHeaders = signRequest({
      method,
      url,
      headers,
      accessKey: this.accessKey,
      secretKey: this.secretKey,
      region: this.region,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const prevTls = this.insecure ? this.disableTlsVerification() : undefined;

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: { ...headers, ...signedHeaders },
        signal: controller.signal,
      };
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      // Redact secret-key from debug logs — it appears as a query param when callers
      // provision users with pre-specified credentials (per RGW Admin Ops wire format).
      const safeUrl = url.toString().replaceAll(/([?&]secret-key=)[^&]*/gi, '$1[REDACTED]');
      this.log('request', { method, url: safeUrl });
      const response = await fetch(url.toString(), fetchOptions);
      const text = await response.text();

      if (!response.ok) {
        throw mapHttpError(response.status, text, this.parseErrorCode(text));
      }

      this.log('response', { status: response.status, body: text.slice(0, 500) });

      if (!text) {
        return undefined as T;
      }

      const parsed: unknown = JSON.parse(text);
      return toCamelCase(parsed) as T;
    } catch (error) {
      throw this.wrapFetchError(error);
    } finally {
      clearTimeout(timeoutId);
      if (this.insecure) {
        this.restoreTlsVerification(prevTls);
      }
    }
  }
}
