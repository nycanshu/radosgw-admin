import type { BaseClient } from '../client.js';
import { RGWValidationError } from '../errors.js';
import { validateUid } from '../validators.js';
import type { RGWQuota, SetUserQuotaInput, SetBucketQuotaInput } from '../types/quota.types.js';

/**
 * Parses a human-readable size string (e.g. "10G", "500M", "1T") into bytes.
 * Accepts a number (passed through) or a string with optional unit suffix.
 *
 * @param size - Size as bytes (number) or human-readable string (e.g. "10G", "500M", "1.5T")
 * @returns Size in bytes
 * @throws {RGWValidationError} If the string format is invalid
 *
 * @example
 * ```typescript
 * parseSizeString(1024);      // 1024
 * parseSizeString('10G');     // 10737418240
 * parseSizeString('500M');    // 524288000
 * parseSizeString('1T');      // 1099511627776
 * parseSizeString('1024K');   // 1048576
 * parseSizeString('100');     // 100
 * ```
 */
export function parseSizeString(size: number | string): number {
  if (typeof size === 'number') return size;

  const units: Record<string, number> = {
    K: 1024,
    M: 1024 ** 2,
    G: 1024 ** 3,
    T: 1024 ** 4,
  };

  const match = size
    .toUpperCase()
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*([KMGT]?)B?$/);
  if (!match) {
    throw new RGWValidationError(
      `Invalid size string: "${size}". Use format like "10G", "500M", "1T", or a number in bytes`,
    );
  }

  const value = parseFloat(match[1]!);
  const unit = match[2]!;
  return Math.floor(value * (units[unit] ?? 1));
}

/**
 * Quota management module — get, set, enable, and disable user-level and bucket-level quotas.
 *
 * @example
 * ```typescript
 * // Set a 10GB user quota
 * await client.quota.setUserQuota({ uid: 'alice', maxSize: '10G', maxObjects: 50000 });
 *
 * // Check current quota
 * const quota = await client.quota.getUserQuota('alice');
 * console.log(quota.enabled, quota.maxSize);
 * ```
 */
export class QuotaModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * Get the user-level quota for a user.
   *
   * @param uid - The user ID.
   * @returns The user's quota configuration.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * const quota = await client.quota.getUserQuota('alice');
   * console.log('Enabled:', quota.enabled);
   * console.log('Max size:', quota.maxSize, 'bytes');
   * console.log('Max objects:', quota.maxObjects);
   * ```
   */
  async getUserQuota(uid: string): Promise<RGWQuota> {
    validateUid(uid);

    return this.client.request<RGWQuota>({
      method: 'GET',
      path: '/user',
      query: { uid, quota: '', quotaType: 'user' },
    });
  }

  /**
   * Set the user-level quota for a user.
   *
   * The `maxSize` field accepts either a number (bytes) or a human-readable string
   * like `"10G"`, `"500M"`, `"1T"`.
   *
   * @param input - Quota settings. `uid` is required.
   * @throws {RGWValidationError} If `uid` is empty or `maxSize` format is invalid.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * await client.quota.setUserQuota({
   *   uid: 'alice',
   *   maxSize: '10G',
   *   maxObjects: 50000,
   *   enabled: true,
   * });
   * ```
   */
  async setUserQuota(input: SetUserQuotaInput): Promise<void> {
    validateUid(input.uid);

    const maxSize = input.maxSize !== undefined ? parseSizeString(input.maxSize) : undefined;

    return this.client.request<void>({
      method: 'PUT',
      path: '/user',
      query: {
        uid: input.uid,
        quota: '',
        quotaType: 'user',
        maxSize,
        maxObjects: input.maxObjects,
        enabled: input.enabled ?? true,
      },
    });
  }

  /**
   * Enable the user-level quota for a user without changing quota values.
   *
   * @param uid - The user ID.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * await client.quota.enableUserQuota('alice');
   * ```
   */
  async enableUserQuota(uid: string): Promise<void> {
    validateUid(uid);

    return this.client.request<void>({
      method: 'PUT',
      path: '/user',
      query: { uid, quota: '', quotaType: 'user', enabled: true },
    });
  }

  /**
   * Disable the user-level quota for a user without changing quota values.
   *
   * @param uid - The user ID.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * await client.quota.disableUserQuota('alice');
   * ```
   */
  async disableUserQuota(uid: string): Promise<void> {
    validateUid(uid);

    return this.client.request<void>({
      method: 'PUT',
      path: '/user',
      query: { uid, quota: '', quotaType: 'user', enabled: false },
    });
  }

  /**
   * Get the bucket-level quota for a user.
   *
   * @param uid - The user ID.
   * @returns The bucket quota configuration applied to the user's buckets.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * const quota = await client.quota.getBucketQuota('alice');
   * console.log('Bucket quota enabled:', quota.enabled);
   * ```
   */
  async getBucketQuota(uid: string): Promise<RGWQuota> {
    validateUid(uid);

    return this.client.request<RGWQuota>({
      method: 'GET',
      path: '/user',
      query: { uid, quota: '', quotaType: 'bucket' },
    });
  }

  /**
   * Set the bucket-level quota for a user's buckets.
   *
   * The `maxSize` field accepts either a number (bytes) or a human-readable string
   * like `"1G"`, `"500M"`.
   *
   * @param input - Quota settings. `uid` is required.
   * @throws {RGWValidationError} If `uid` is empty or `maxSize` format is invalid.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * await client.quota.setBucketQuota({
   *   uid: 'alice',
   *   maxSize: '1G',
   *   maxObjects: 10000,
   *   enabled: true,
   * });
   * ```
   */
  async setBucketQuota(input: SetBucketQuotaInput): Promise<void> {
    validateUid(input.uid);

    const maxSize = input.maxSize !== undefined ? parseSizeString(input.maxSize) : undefined;

    return this.client.request<void>({
      method: 'PUT',
      path: '/user',
      query: {
        uid: input.uid,
        quota: '',
        quotaType: 'bucket',
        maxSize,
        maxObjects: input.maxObjects,
        enabled: input.enabled ?? true,
      },
    });
  }

  /**
   * Enable the bucket-level quota for a user without changing quota values.
   *
   * @param uid - The user ID.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * await client.quota.enableBucketQuota('alice');
   * ```
   */
  async enableBucketQuota(uid: string): Promise<void> {
    validateUid(uid);

    return this.client.request<void>({
      method: 'PUT',
      path: '/user',
      query: { uid, quota: '', quotaType: 'bucket', enabled: true },
    });
  }

  /**
   * Disable the bucket-level quota for a user without changing quota values.
   *
   * @param uid - The user ID.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * await client.quota.disableBucketQuota('alice');
   * ```
   */
  async disableBucketQuota(uid: string): Promise<void> {
    validateUid(uid);

    return this.client.request<void>({
      method: 'PUT',
      path: '/user',
      query: { uid, quota: '', quotaType: 'bucket', enabled: false },
    });
  }
}
