import type { BaseClient } from '../client.js';
import { RGWValidationError } from '../errors.js';
import { validateUid } from '../validators.js';
import type {
  RGWBucket,
  DeleteBucketInput,
  LinkBucketInput,
  UnlinkBucketInput,
  CheckBucketIndexInput,
  CheckBucketIndexResult,
} from '../types/bucket.types.js';

/**
 * Validates that a bucket name is a non-empty string.
 */
function validateBucket(bucket: string): void {
  if (!bucket || typeof bucket !== 'string' || bucket.trim().length === 0) {
    throw new RGWValidationError('bucket is required and must be a non-empty string');
  }
}

/**
 * Bucket management module — list, inspect, delete, link, unlink, and check/repair bucket indexes.
 *
 * @example
 * ```typescript
 * const buckets = await client.buckets.list('alice');
 * const info = await client.buckets.getInfo('my-bucket');
 * console.log(info.owner, info.usage.rgwMain.numObjects);
 * ```
 */
export class BucketsModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * List all buckets, optionally filtered by user.
   *
   * @param uid - If provided, only list buckets owned by this user.
   * @returns Array of bucket name strings.
   *
   * @example
   * ```typescript
   * // All buckets in the cluster
   * const all = await client.buckets.list();
   *
   * // Buckets for a specific user
   * const userBuckets = await client.buckets.list('alice');
   * ```
   */
  async list(uid?: string): Promise<string[]> {
    const query: Record<string, string | undefined> = {};
    if (uid !== undefined) {
      validateUid(uid);
      query.uid = uid;
    }

    return this.client.request<string[]>({
      method: 'GET',
      path: '/bucket',
      query,
    });
  }

  /**
   * Get detailed metadata about a bucket.
   *
   * @param bucket - The bucket name to inspect.
   * @returns Full bucket object with owner, usage, quota, and placement info.
   * @throws {RGWValidationError} If `bucket` is empty.
   * @throws {RGWNotFoundError} If the bucket does not exist.
   *
   * @example
   * ```typescript
   * const info = await client.buckets.getInfo('my-bucket');
   * console.log(`Owner: ${info.owner}`);
   * console.log(`Objects: ${info.usage.rgwMain.numObjects}`);
   * console.log(`Size: ${(info.usage.rgwMain.sizeKb / 1024).toFixed(2)} MB`);
   * ```
   */
  async getInfo(bucket: string): Promise<RGWBucket> {
    validateBucket(bucket);

    return this.client.request<RGWBucket>({
      method: 'GET',
      path: '/bucket',
      query: { bucket },
    });
  }

  /**
   * Delete a bucket. Optionally purge all objects inside it.
   *
   * @param input - `bucket` is required. Set `purgeObjects: true` to delete all objects.
   * @throws {RGWValidationError} If `bucket` is empty.
   * @throws {RGWNotFoundError} If the bucket does not exist.
   *
   * @example
   * ```typescript
   * // Safe delete (fails if bucket has objects)
   * await client.buckets.delete({ bucket: 'my-bucket' });
   *
   * // Force delete with object purge
   * await client.buckets.delete({ bucket: 'my-bucket', purgeObjects: true });
   * ```
   */
  async delete(input: DeleteBucketInput): Promise<void> {
    validateBucket(input.bucket);

    if (input.purgeObjects) {
      console.warn(
        `[radosgw-admin] WARNING: purgeObjects=true will permanently delete all objects in bucket "${input.bucket}"`,
      );
    }

    return this.client.request<void>({
      method: 'DELETE',
      path: '/bucket',
      query: {
        bucket: input.bucket,
        purgeObjects: input.purgeObjects,
      },
    });
  }

  /**
   * Link a bucket to a different user (transfer ownership).
   *
   * @param input - `bucket`, `bucketId`, and `uid` are all required.
   * @throws {RGWValidationError} If any required field is missing.
   * @throws {RGWNotFoundError} If the bucket or user does not exist.
   *
   * @example
   * ```typescript
   * const info = await client.buckets.getInfo('my-bucket');
   * await client.buckets.link({
   *   bucket: 'my-bucket',
   *   bucketId: info.id,
   *   uid: 'bob',
   * });
   * ```
   */
  async link(input: LinkBucketInput): Promise<void> {
    validateBucket(input.bucket);
    validateUid(input.uid);
    if (
      !input.bucketId ||
      typeof input.bucketId !== 'string' ||
      input.bucketId.trim().length === 0
    ) {
      throw new RGWValidationError('bucketId is required and must be a non-empty string');
    }

    return this.client.request<void>({
      method: 'PUT',
      path: '/bucket',
      query: {
        bucket: input.bucket,
        bucketId: input.bucketId,
        uid: input.uid,
      },
    });
  }

  /**
   * Unlink a bucket from a user (remove ownership without deleting the bucket).
   *
   * @param input - `bucket` and `uid` are required.
   * @throws {RGWValidationError} If any required field is missing.
   * @throws {RGWNotFoundError} If the bucket or user does not exist.
   *
   * @example
   * ```typescript
   * await client.buckets.unlink({
   *   bucket: 'my-bucket',
   *   uid: 'alice',
   * });
   * ```
   */
  async unlink(input: UnlinkBucketInput): Promise<void> {
    validateBucket(input.bucket);
    validateUid(input.uid);

    return this.client.request<void>({
      method: 'POST',
      path: '/bucket',
      query: {
        bucket: input.bucket,
        uid: input.uid,
      },
    });
  }

  /**
   * Check and optionally repair a bucket's index.
   *
   * With `fix: false` (default), this is a safe read-only operation that reports
   * any inconsistencies. Set `fix: true` to actually repair detected issues.
   *
   * @param input - `bucket` is required. `checkObjects` and `fix` are optional.
   * @returns Index check result with invalid entries and header comparison.
   * @throws {RGWValidationError} If `bucket` is empty.
   * @throws {RGWNotFoundError} If the bucket does not exist.
   *
   * @example
   * ```typescript
   * // Dry run — check only
   * const result = await client.buckets.checkIndex({
   *   bucket: 'my-bucket',
   *   checkObjects: true,
   *   fix: false,
   * });
   * console.log('Invalid entries:', result.invalidMultipartEntries);
   *
   * // Fix detected issues
   * await client.buckets.checkIndex({
   *   bucket: 'my-bucket',
   *   fix: true,
   * });
   * ```
   */
  async checkIndex(input: CheckBucketIndexInput): Promise<CheckBucketIndexResult> {
    validateBucket(input.bucket);

    return this.client.request<CheckBucketIndexResult>({
      method: 'GET',
      path: '/bucket',
      query: {
        index: '',
        bucket: input.bucket,
        checkObjects: input.checkObjects,
        fix: input.fix,
      },
    });
  }
}
