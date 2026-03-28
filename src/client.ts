import { signRequest } from './signer.js';
import { Agent } from 'undici';
import {
  RGWError,
  RGWNotFoundError,
  RGWAuthError,
  RGWConflictError,
  RGWValidationError,
  RGWRateLimitError,
  RGWServiceError,
} from './errors.js';
import type {
  ClientConfig,
  RequestOptions,
  BeforeRequestHook,
  AfterResponseHook,
  HookContext,
} from './types/common.types.js';

/** SDK version injected at build time by tsup, fallback for dev/test. */
declare const __SDK_VERSION__: string | undefined;
const SDK_VERSION = typeof __SDK_VERSION__ !== 'undefined' ? __SDK_VERSION__ : '0.0.0-dev';

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
 * Extracts the human-readable error message from an RGW JSON error response.
 * RGW typically returns `{"Code": "NoSuchUser", "Message": "No user found..."}`.
 * Falls back to the raw body if parsing fails.
 */
function parseErrorBody(body: string): { message: string; code: string | undefined } {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const code = typeof parsed.Code === 'string' ? parsed.Code : undefined;
    const message = typeof parsed.Message === 'string' ? parsed.Message : undefined;
    // Use Message if available, otherwise build a readable message from Code
    return { message: message ?? (code ? code : body), code };
  } catch {
    return { message: body, code: undefined };
  }
}

/**
 * Maps HTTP error responses to typed RGW errors.
 * Preserves the actual RGW error code from the response body.
 */
function mapHttpError(status: number, body: string): RGWError {
  const { message, code } = parseErrorBody(body);
  switch (status) {
    case 400:
      return new RGWValidationError(message || 'Invalid request parameters', 400, code);
    case 403:
      return new RGWAuthError(message, code);
    case 404:
      return new RGWNotFoundError(message, code);
    case 409:
      return new RGWConflictError(message, code);
    case 429:
      return new RGWRateLimitError(message, code);
    default:
      if (status >= 500) {
        return new RGWServiceError(message, status, code);
      }
      return new RGWError(message || `HTTP ${status}`, status, code);
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
  readonly #dispatcher: Agent | undefined;
  private readonly userAgent: string;
  private readonly beforeRequestHooks: BeforeRequestHook[];
  private readonly afterResponseHooks: AfterResponseHook[];

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
    this.#dispatcher = config.insecure
      ? new Agent({ connect: { rejectUnauthorized: false } })
      : undefined;
    this.userAgent =
      config.userAgent ?? `radosgw-admin/${SDK_VERSION} node/${process.versions.node}`;
    this.beforeRequestHooks = config.onBeforeRequest ?? [];
    this.afterResponseHooks = config.onAfterResponse ?? [];

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
        return error.statusCode >= 500 || error.statusCode === 429;
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
        const base = this.retryDelay * Math.pow(2, attempt - 1);
        const backoff = base + Math.random() * base; // full jitter
        this.log(`retry ${attempt}/${this.maxRetries} after ${Math.round(backoff)}ms`);
        await this.delay(backoff);
      }

      try {
        return await this.executeRequest<T>(options, attempt);
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
   * Runs all before-request hooks, swallowing errors so hooks never break requests.
   */
  private async runBeforeHooks(ctx: HookContext): Promise<void> {
    for (const hook of this.beforeRequestHooks) {
      try {
        await hook(ctx);
      } catch (err) {
        this.log('onBeforeRequest hook error', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  /**
   * Runs all after-response hooks, swallowing errors so hooks never break requests.
   */
  private async runAfterHooks(
    ctx: HookContext & { status?: number; durationMs: number; error?: Error },
  ): Promise<void> {
    for (const hook of this.afterResponseHooks) {
      try {
        await hook(ctx);
      } catch (err) {
        this.log('onAfterResponse hook error', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  /**
   * Combines the internal timeout signal with an optional external signal.
   * Returns the combined signal and a cleanup function.
   */
  private createCombinedSignal(externalSignal?: AbortSignal): {
    signal: AbortSignal;
    cleanup: () => void;
  } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let onExternalAbort: (() => void) | undefined;
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        onExternalAbort = () => controller.abort();
        externalSignal.addEventListener('abort', onExternalAbort);
      }
    }

    const cleanup = (): void => {
      clearTimeout(timeoutId);
      if (externalSignal && onExternalAbort) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    };

    return { signal: controller.signal, cleanup };
  }

  /**
   * Executes a single signed HTTP request to the RGW Admin API.
   */
  private async executeRequest<T>(options: RequestOptions, attempt = 0): Promise<T> {
    const { method, path, query, body, signal: externalSignal } = options;
    const url = this.buildUrl(path, query);
    const startTime = Date.now();

    const hookCtx: HookContext = {
      method,
      path,
      url: url.toString(),
      ...(query !== undefined && { query }),
      attempt,
      startTime,
    };

    await this.runBeforeHooks(hookCtx);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
    };

    const signedHeaders = signRequest({
      method,
      url,
      headers,
      accessKey: this.accessKey,
      secretKey: this.secretKey,
      region: this.region,
    });

    const { signal, cleanup } = this.createCombinedSignal(externalSignal);

    try {
      const fetchOptions: Record<string, unknown> = {
        method,
        headers: { ...headers, ...signedHeaders },
        signal,
        ...(this.#dispatcher ? { dispatcher: this.#dispatcher } : {}),
      };
      if (body) {
        fetchOptions['body'] = JSON.stringify(body);
      }

      // Redact secret-key from debug logs — it appears as a query param when callers
      // provision users with pre-specified credentials (per RGW Admin Ops wire format).
      const safeUrl = url.toString().replaceAll(/([?&]secret-key=)[^&]*/gi, '$1[REDACTED]');
      this.log('request', { method, url: safeUrl });
      const response = await fetch(url.toString(), fetchOptions as RequestInit);
      const text = await response.text();

      if (!response.ok) {
        const error = mapHttpError(response.status, text);
        await this.runAfterHooks({
          ...hookCtx,
          status: response.status,
          durationMs: Date.now() - startTime,
          error,
        });
        throw error;
      }

      this.log('response', { status: response.status, body: text.slice(0, 500) });

      await this.runAfterHooks({
        ...hookCtx,
        status: response.status,
        durationMs: Date.now() - startTime,
      });

      if (!text) {
        return undefined as T;
      }

      const parsed: unknown = JSON.parse(text);
      return toCamelCase(parsed) as T;
    } catch (error) {
      const wrapped = this.wrapFetchError(error);
      // Only run after hooks if not already run (i.e. for network/abort errors)
      if (!(error instanceof RGWError)) {
        await this.runAfterHooks({
          ...hookCtx,
          durationMs: Date.now() - startTime,
          error: wrapped,
        });
      }
      throw wrapped;
    } finally {
      cleanup();
    }
  }
}
