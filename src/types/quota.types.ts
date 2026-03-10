import type { RGWQuota } from './user.types.js';

// Re-export for convenience
export type { RGWQuota };

/** Input for setting a user-level quota. */
export interface SetUserQuotaInput {
  /** User ID. Required. */
  uid: string;
  /** Maximum storage size in bytes, or a human-readable string like "10G", "500M". -1 for unlimited. */
  maxSize?: number | string;
  /** Maximum number of objects. -1 for unlimited. */
  maxObjects?: number;
  /** Whether the quota is enabled. Default: true when setting a quota. */
  enabled?: boolean;
}

/** Input for setting a bucket-level quota. */
export interface SetBucketQuotaInput {
  /** User ID. Required. */
  uid: string;
  /** Maximum storage size in bytes, or a human-readable string like "10G", "500M". -1 for unlimited. */
  maxSize?: number | string;
  /** Maximum number of objects. -1 for unlimited. */
  maxObjects?: number;
  /** Whether the quota is enabled. Default: true when setting a quota. */
  enabled?: boolean;
}

/** Rate limit configuration returned by the RGW Admin API. */
export interface RGWRateLimit {
  enabled: boolean;
  /** Maximum read operations per minute per RGW instance. 0 = unlimited. */
  maxReadOps: number;
  /** Maximum write operations per minute per RGW instance. 0 = unlimited. */
  maxWriteOps: number;
  /** Maximum read bytes per minute per RGW instance. 0 = unlimited. */
  maxReadBytes: number;
  /** Maximum write bytes per minute per RGW instance. 0 = unlimited. */
  maxWriteBytes: number;
}

/** Input for setting a user-level rate limit. */
export interface SetUserRateLimitInput {
  /** User ID. Required. */
  uid: string;
  /** Max read ops per minute per RGW instance. 0 = unlimited. */
  maxReadOps?: number;
  /** Max write ops per minute per RGW instance. 0 = unlimited. */
  maxWriteOps?: number;
  /** Max read bytes per minute per RGW instance. 0 = unlimited. */
  maxReadBytes?: number;
  /** Max write bytes per minute per RGW instance. 0 = unlimited. */
  maxWriteBytes?: number;
  /** Whether the rate limit is enabled. Default: true. */
  enabled?: boolean;
}

/** Input for setting a bucket-level rate limit. */
export interface SetBucketRateLimitInput {
  /** Bucket name. Required. */
  bucket: string;
  /** Max read ops per minute per RGW instance. 0 = unlimited. */
  maxReadOps?: number;
  /** Max write ops per minute per RGW instance. 0 = unlimited. */
  maxWriteOps?: number;
  /** Max read bytes per minute per RGW instance. 0 = unlimited. */
  maxReadBytes?: number;
  /** Max write bytes per minute per RGW instance. 0 = unlimited. */
  maxWriteBytes?: number;
  /** Whether the rate limit is enabled. Default: true. */
  enabled?: boolean;
}

/** Input for setting a global rate limit. */
export interface SetGlobalRateLimitInput {
  /** Scope: 'user', 'bucket', or 'anonymous'. Required. */
  scope: 'user' | 'bucket' | 'anonymous';
  /** Max read ops per minute per RGW instance. 0 = unlimited. */
  maxReadOps?: number;
  /** Max write ops per minute per RGW instance. 0 = unlimited. */
  maxWriteOps?: number;
  /** Max read bytes per minute per RGW instance. 0 = unlimited. */
  maxReadBytes?: number;
  /** Max write bytes per minute per RGW instance. 0 = unlimited. */
  maxWriteBytes?: number;
  /** Whether the rate limit is enabled. Default: true. */
  enabled?: boolean;
}

/** Global rate limit info returned by the RGW Admin API. */
export interface RGWGlobalRateLimit {
  /** Rate limit for all users (per-user scope). */
  user: RGWRateLimit;
  /** Rate limit for all buckets (per-bucket scope). */
  bucket: RGWRateLimit;
  /** Rate limit for anonymous (unauthenticated) access. */
  anonymous: RGWRateLimit;
}
