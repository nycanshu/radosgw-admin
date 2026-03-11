import type { BaseClient } from '../client.js';
import { RGWValidationError } from '../errors.js';
import { validateUid } from '../validators.js';
import type {
  RGWRateLimit,
  RGWGlobalRateLimit,
  SetUserRateLimitInput,
  SetBucketRateLimitInput,
  SetGlobalRateLimitInput,
} from '../types/quota.types.js';

/**
 * Validates that a bucket name is a non-empty string.
 */
function validateBucket(bucket: string): void {
  if (!bucket || typeof bucket !== 'string' || bucket.trim().length === 0) {
    throw new RGWValidationError('bucket is required and must be a non-empty string');
  }
}

/**
 * Rate limit management module — get, set, and disable rate limits for users, buckets, and globally.
 *
 * Rate limits are enforced **per RGW instance**. If you have 3 RGW daemons and want a
 * cluster-wide limit of 300 ops/min, set `maxReadOps: 100` on each instance.
 *
 * Requires Ceph **Pacific (v16)** or later.
 *
 * @example
 * ```typescript
 * // Throttle alice to 100 read ops/min per RGW
 * await client.rateLimit.setUserLimit({
 *   uid: 'alice',
 *   maxReadOps: 100,
 *   maxWriteOps: 50,
 * });
 *
 * // Get current rate limit
 * const limit = await client.rateLimit.getUserLimit('alice');
 * console.log(limit.enabled, limit.maxReadOps);
 * ```
 */
export class RateLimitModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * Get the rate limit configuration for a user.
   *
   * @param uid - The user ID.
   * @returns The user's rate limit configuration.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * const limit = await client.rateLimit.getUserLimit('alice');
   * console.log('Read ops/min:', limit.maxReadOps);
   * console.log('Write ops/min:', limit.maxWriteOps);
   * ```
   */
  async getUserLimit(uid: string): Promise<RGWRateLimit> {
    validateUid(uid);

    return this.client.request<RGWRateLimit>({
      method: 'GET',
      path: '/ratelimit',
      query: { rateLimit: '', uid, scope: 'user' },
    });
  }

  /**
   * Set the rate limit for a user.
   *
   * Values are per RGW instance. Divide by the number of RGW daemons for cluster-wide limits.
   *
   * @param input - Rate limit settings. `uid` is required.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * await client.rateLimit.setUserLimit({
   *   uid: 'alice',
   *   maxReadOps: 100,
   *   maxWriteOps: 50,
   *   maxWriteBytes: 52428800, // 50MB/min
   *   enabled: true,
   * });
   * ```
   */
  async setUserLimit(input: SetUserRateLimitInput): Promise<void> {
    validateUid(input.uid);

    return this.client.request<void>({
      method: 'POST',
      path: '/ratelimit',
      query: {
        rateLimit: '',
        uid: input.uid,
        scope: 'user',
        maxReadOps: input.maxReadOps,
        maxWriteOps: input.maxWriteOps,
        maxReadBytes: input.maxReadBytes,
        maxWriteBytes: input.maxWriteBytes,
        enabled: input.enabled ?? true,
      },
    });
  }

  /**
   * Disable the rate limit for a user without changing the configured values.
   *
   * @param uid - The user ID.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * await client.rateLimit.disableUserLimit('alice');
   * ```
   */
  async disableUserLimit(uid: string): Promise<void> {
    validateUid(uid);

    return this.client.request<void>({
      method: 'POST',
      path: '/ratelimit',
      query: { rateLimit: '', uid, scope: 'user', enabled: false },
    });
  }

  /**
   * Get the rate limit configuration for a bucket.
   *
   * @param bucket - The bucket name.
   * @returns The bucket's rate limit configuration.
   * @throws {RGWValidationError} If `bucket` is empty.
   * @throws {RGWNotFoundError} If the bucket does not exist.
   *
   * @example
   * ```typescript
   * const limit = await client.rateLimit.getBucketLimit('my-bucket');
   * console.log('Read ops/min:', limit.maxReadOps);
   * ```
   */
  async getBucketLimit(bucket: string): Promise<RGWRateLimit> {
    validateBucket(bucket);

    return this.client.request<RGWRateLimit>({
      method: 'GET',
      path: '/ratelimit',
      query: { rateLimit: '', bucket, scope: 'bucket' },
    });
  }

  /**
   * Set the rate limit for a bucket.
   *
   * Values are per RGW instance. Divide by the number of RGW daemons for cluster-wide limits.
   *
   * @param input - Rate limit settings. `bucket` is required.
   * @throws {RGWValidationError} If `bucket` is empty.
   * @throws {RGWNotFoundError} If the bucket does not exist.
   *
   * @example
   * ```typescript
   * await client.rateLimit.setBucketLimit({
   *   bucket: 'my-bucket',
   *   maxReadOps: 200,
   *   maxWriteOps: 100,
   *   enabled: true,
   * });
   * ```
   */
  async setBucketLimit(input: SetBucketRateLimitInput): Promise<void> {
    validateBucket(input.bucket);

    return this.client.request<void>({
      method: 'POST',
      path: '/ratelimit',
      query: {
        rateLimit: '',
        bucket: input.bucket,
        scope: 'bucket',
        maxReadOps: input.maxReadOps,
        maxWriteOps: input.maxWriteOps,
        maxReadBytes: input.maxReadBytes,
        maxWriteBytes: input.maxWriteBytes,
        enabled: input.enabled ?? true,
      },
    });
  }

  /**
   * Disable the rate limit for a bucket without changing the configured values.
   *
   * @param bucket - The bucket name.
   * @throws {RGWValidationError} If `bucket` is empty.
   * @throws {RGWNotFoundError} If the bucket does not exist.
   *
   * @example
   * ```typescript
   * await client.rateLimit.disableBucketLimit('my-bucket');
   * ```
   */
  async disableBucketLimit(bucket: string): Promise<void> {
    validateBucket(bucket);

    return this.client.request<void>({
      method: 'POST',
      path: '/ratelimit',
      query: { rateLimit: '', bucket, scope: 'bucket', enabled: false },
    });
  }

  /**
   * Get the global rate limit configuration for all scopes (user, bucket, anonymous).
   *
   * @returns Global rate limits for user, bucket, and anonymous scopes.
   *
   * @example
   * ```typescript
   * const global = await client.rateLimit.getGlobal();
   * console.log('Anonymous read limit:', global.anonymous.maxReadOps);
   * ```
   */
  async getGlobal(): Promise<RGWGlobalRateLimit> {
    return this.client.request<RGWGlobalRateLimit>({
      method: 'GET',
      path: '/ratelimit',
      query: { rateLimit: '', global: '' },
    });
  }

  /**
   * Set a global rate limit for a specific scope.
   *
   * Use `scope: 'anonymous'` to protect public-read buckets from abuse.
   *
   * @param input - Rate limit settings. `scope` is required.
   * @throws {RGWValidationError} If `scope` is invalid.
   *
   * @example
   * ```typescript
   * // Limit anonymous access globally
   * await client.rateLimit.setGlobal({
   *   scope: 'anonymous',
   *   maxReadOps: 50,
   *   maxWriteOps: 0,
   *   enabled: true,
   * });
   * ```
   */
  async setGlobal(input: SetGlobalRateLimitInput): Promise<void> {
    const validScopes = ['user', 'bucket', 'anonymous'];
    if (!validScopes.includes(input.scope)) {
      throw new RGWValidationError(
        `scope must be one of: ${validScopes.join(', ')}. Got: "${input.scope}"`,
      );
    }

    return this.client.request<void>({
      method: 'POST',
      path: '/ratelimit',
      query: {
        rateLimit: '',
        global: '',
        scope: input.scope,
        maxReadOps: input.maxReadOps,
        maxWriteOps: input.maxWriteOps,
        maxReadBytes: input.maxReadBytes,
        maxWriteBytes: input.maxWriteBytes,
        enabled: input.enabled ?? true,
      },
    });
  }
}
