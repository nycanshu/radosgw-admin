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
 * Bucket management module — list, inspect, delete, transfer ownership, and verify/repair bucket indexes.
 *
 * @example
 * ```typescript
 * const allBuckets = await client.buckets.list();
 * const userBuckets = await client.buckets.listByUser('alice');
 * const info = await client.buckets.getInfo('my-bucket');
 * console.log(info.owner, info.usage.rgwMain.numObjects);
 * ```
 */
export class BucketsModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * List all buckets in the cluster.
   *
   * The RGW `/bucket` endpoint has a default limit of 1000 entries.
   * This method requests up to 100,000 entries to avoid silent truncation
   * on large clusters.
   *
   * For clusters with more than 100k buckets, use the planned `paginate()`
   * method (see v1.6 roadmap).
   *
   * @returns Array of bucket name strings.
   *
   * @example
   * ```typescript
   * const all = await client.buckets.list();
   * console.log(`Cluster has ${all.length} buckets`);
   * ```
   */
  async list(): Promise<string[]> {
    const result = await this.client.request<string[] | { buckets: string[] }>({
      method: 'GET',
      path: '/bucket',
      query: { maxEntries: 100000 },
    });

    if (Array.isArray(result)) {
      return result;
    }
    return result.buckets;
  }

  /**
   * List buckets owned by a specific user.
   *
   * @param uid - User ID to filter buckets by. Required.
   * @returns Array of bucket name strings owned by the user.
   * @throws {RGWValidationError} If `uid` is missing or invalid.
   *
   * @example
   * ```typescript
   * const userBuckets = await client.buckets.listByUser('alice');
   * console.log(`alice has ${userBuckets.length} buckets`);
   * ```
   */
  async listByUser(uid: string): Promise<string[]> {
    validateUid(uid);

    return this.client.request<string[]>({
      method: 'GET',
      path: '/bucket',
      query: { uid },
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
   * @returns Resolves when the bucket has been deleted.
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
   * Transfer ownership of a bucket to a different user.
   *
   * @param input - `bucket`, `bucketId`, and `uid` are all required.
   * @returns Resolves when ownership has been transferred.
   * @throws {RGWValidationError} If any required field is missing.
   * @throws {RGWNotFoundError} If the bucket or user does not exist.
   *
   * @example
   * ```typescript
   * const info = await client.buckets.getInfo('my-bucket');
   * await client.buckets.transferOwnership({
   *   bucket: 'my-bucket',
   *   bucketId: info.id,
   *   uid: 'bob',
   * });
   * ```
   */
  async transferOwnership(input: LinkBucketInput): Promise<void> {
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
   * Remove ownership of a bucket from a user without deleting the bucket.
   *
   * **Warning:** This leaves the bucket in an orphaned state with no owner.
   * The bucket and its objects remain intact but cannot be managed via the
   * S3 API until ownership is reassigned with {@link transferOwnership}.
   *
   * @param input - `bucket` and `uid` are required.
   * @returns Resolves when ownership has been removed.
   * @throws {RGWValidationError} If any required field is missing.
   * @throws {RGWNotFoundError} If the bucket or user does not exist.
   *
   * @example
   * ```typescript
   * await client.buckets.removeOwnership({
   *   bucket: 'my-bucket',
   *   uid: 'alice',
   * });
   * ```
   */
  async removeOwnership(input: UnlinkBucketInput): Promise<void> {
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
   * Verify and optionally repair a bucket's index.
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
   * const result = await client.buckets.verifyIndex({
   *   bucket: 'my-bucket',
   *   checkObjects: true,
   *   fix: false,
   * });
   * console.log('Invalid entries:', result.invalidMultipartEntries);
   *
   * // Fix detected issues
   * await client.buckets.verifyIndex({
   *   bucket: 'my-bucket',
   *   fix: true,
   * });
   * ```
   */
  async verifyIndex(input: CheckBucketIndexInput): Promise<CheckBucketIndexResult> {
    validateBucket(input.bucket);

    if (input.fix === true) {
      console.warn(
        `[radosgw-admin] WARNING: fix=true will repair the bucket index for "${input.bucket}" — this mutates index data`,
      );
    }

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
