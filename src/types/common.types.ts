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
}

/** HTTP methods used by the RGW Admin API */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Internal request options passed to the base client */
export interface RequestOptions {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
}
