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
        k.replace(/[-_.]([a-z])/g, (_, c: string) => c.toUpperCase()),
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
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
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
 */
export class BaseClient {
  private readonly host: string;
  private readonly port: number | undefined;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly adminPath: string;
  private readonly timeout: number;
  private readonly region: string;

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
  }

  /**
   * Makes a signed HTTP request to the RGW Admin API.
   *
   * @param options - Request method, path, query params, and optional body
   * @returns Parsed and camelCase-transformed JSON response, or void for empty responses
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, query, body } = options;

    // Build URL
    const baseUrl = this.port ? `${this.host}:${this.port}` : this.host;
    const fullPath = `${this.adminPath}${path}`;
    const url = new URL(fullPath, baseUrl);

    // Add query parameters (convert camelCase to kebab-case)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(toKebabCase(key), String(value));
        }
      }
    }

    // Always request JSON
    url.searchParams.set('format', 'json');

    // Sign the request
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

    // Execute request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: { ...headers, ...signedHeaders },
        signal: controller.signal,
      };
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }
      const response = await fetch(url.toString(), fetchOptions);

      // Handle empty responses (DELETE, PUT that return no body)
      const text = await response.text();

      if (!response.ok) {
        let errorCode: string | undefined;
        try {
          const errorBody = JSON.parse(text) as Record<string, unknown>;
          errorCode = (errorBody.Code as string) ?? undefined;
        } catch {
          // Response is not JSON
        }
        throw mapHttpError(response.status, text, errorCode);
      }

      if (!text) {
        return undefined as T;
      }

      const parsed: unknown = JSON.parse(text);
      return toCamelCase(parsed) as T;
    } catch (error) {
      if (error instanceof RGWError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new RGWError(`Request timed out after ${this.timeout}ms`, undefined, 'Timeout');
      }
      throw new RGWError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        undefined,
        'NetworkError',
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
