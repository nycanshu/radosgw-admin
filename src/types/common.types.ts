/**
 * Configuration for the RadosGW Admin Client.
 */
export interface ClientConfig {
  /** RGW endpoint, e.g. "http://192.168.1.10" or "https://ceph.example.com" */
  host: string;
  /** Port number. Omit to use the default from the host URL. */
  port?: number;
  /** Admin access key for AWS SigV4 authentication */
  accessKey: string;
  /** Admin secret key for AWS SigV4 authentication */
  secretKey: string;
  /** Admin API path prefix. Default: "/admin" */
  adminPath?: string;
  /** Request timeout in milliseconds. Default: 10000 */
  timeout?: number;
  /** Skip TLS certificate verification. Default: false */
  insecure?: boolean;
  /** Enable debug logging of requests and responses. Default: false */
  debug?: boolean;
  /** Maximum number of retries for transient errors (5xx, timeouts, network errors). Default: 0 (no retries) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff between retries. Default: 200 */
  retryDelay?: number;
  /** AWS region for SigV4 signing. Default: "us-east-1" */
  region?: string;
  /** Custom User-Agent header. Default: `radosgw-admin/VERSION node/NODE_VERSION` */
  userAgent?: string;
  /** Hooks called before each HTTP request. Use for logging, metrics, or request modification. */
  onBeforeRequest?: BeforeRequestHook[];
  /** Hooks called after each HTTP response (or error). Use for logging, metrics, or telemetry. */
  onAfterResponse?: AfterResponseHook[];
}

/** HTTP methods used by the RGW Admin API */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Internal request options passed to the base client */
export interface RequestOptions {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
  /** External AbortSignal to cancel the request. Combined with the internal timeout signal. */
  signal?: AbortSignal;
}

/** Context passed to request lifecycle hooks. */
export interface HookContext {
  /** HTTP method (GET, POST, PUT, DELETE) */
  method: HttpMethod;
  /** RGW Admin API path (e.g. "/user") */
  path: string;
  /** Full request URL */
  url: string;
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>;
  /** 0-based retry attempt number */
  attempt: number;
  /** Timestamp when the request started (Date.now()) */
  startTime: number;
}

/** Hook called before each HTTP request. */
export type BeforeRequestHook = (ctx: HookContext) => void | Promise<void>;

/** Hook called after each HTTP response or error. */
export type AfterResponseHook = (
  ctx: HookContext & {
    /** HTTP status code (undefined if network error) */
    status?: number;
    /** Request duration in milliseconds */
    durationMs: number;
    /** Error if the request failed */
    error?: Error;
  },
) => void | Promise<void>;
