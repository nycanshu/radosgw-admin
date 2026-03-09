import type { BaseClient } from '../client.js';
import { RGWValidationError } from '../errors.js';
import type {
  CreateUserInput,
  ModifyUserInput,
  DeleteUserInput,
  GetUserStatsInput,
  RGWUser,
  RGWUserStats,
} from '../types/user.types.js';

/**
 * Validates that a uid is a non-empty string with no leading/trailing whitespace.
 */
function validateUid(uid: string): void {
  if (!uid || typeof uid !== 'string' || uid.trim() !== uid || uid.trim().length === 0) {
    throw new RGWValidationError(
      'uid is required and must be a non-empty string without leading/trailing whitespace',
    );
  }
}

/**
 * User management module — create, get, modify, delete, list, suspend, enable, and get stats.
 *
 * @example
 * ```typescript
 * const user = await client.users.create({
 *   uid: 'alice',
 *   displayName: 'Alice',
 * });
 * ```
 */
export class UsersModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * Create a new RGW user.
   *
   * @param input - User creation parameters. `uid` and `displayName` are required.
   * @returns The newly created user object with keys, caps, and quotas.
   * @throws {RGWValidationError} If `uid` or `displayName` is missing or invalid.
   * @throws {RGWConflictError} If a user with the given `uid` already exists.
   *
   * @example
   * ```typescript
   * const user = await client.users.create({
   *   uid: 'alice',
   *   displayName: 'Alice Example',
   *   email: 'alice@example.com',
   *   maxBuckets: 100,
   * });
   * console.log(user.keys[0].accessKey);
   * ```
   */
  async create(input: CreateUserInput): Promise<RGWUser> {
    validateUid(input.uid);
    if (
      !input.displayName ||
      typeof input.displayName !== 'string' ||
      input.displayName.trim().length === 0
    ) {
      throw new RGWValidationError('displayName is required and must be a non-empty string');
    }

    return this.client.request<RGWUser>({
      method: 'PUT',
      path: '/user',
      query: {
        uid: input.uid,
        displayName: input.displayName,
        email: input.email,
        keyType: input.keyType,
        accessKey: input.accessKey,
        secretKey: input.secretKey,
        userCaps: input.userCaps,
        generateKey: input.generateKey,
        maxBuckets: input.maxBuckets,
        suspended: input.suspended,
        tenant: input.tenant,
      },
    });
  }

  /**
   * Get full user information including keys, caps, and quotas.
   *
   * @param uid - The user ID to look up.
   * @returns Full user object.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * const user = await client.users.get('alice');
   * console.log(user.displayName, user.email);
   * ```
   */
  async get(uid: string): Promise<RGWUser> {
    validateUid(uid);

    return this.client.request<RGWUser>({
      method: 'GET',
      path: '/user',
      query: { uid },
    });
  }

  /**
   * Modify an existing user's properties.
   *
   * @param input - Properties to update. `uid` is required, all other fields are optional.
   * @returns The updated user object.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * const updated = await client.users.modify({
   *   uid: 'alice',
   *   displayName: 'Alice Updated',
   *   maxBuckets: 200,
   * });
   * ```
   */
  async modify(input: ModifyUserInput): Promise<RGWUser> {
    validateUid(input.uid);

    return this.client.request<RGWUser>({
      method: 'POST',
      path: '/user',
      query: {
        uid: input.uid,
        displayName: input.displayName,
        email: input.email,
        maxBuckets: input.maxBuckets,
        suspended: input.suspended,
        userCaps: input.userCaps,
        opMask: input.opMask,
      },
    });
  }

  /**
   * Delete a user. Optionally purge all user data (buckets and objects).
   *
   * @param input - `uid` is required. Set `purgeData: true` to delete all objects.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * // Safe delete (fails if user has data)
   * await client.users.delete({ uid: 'alice' });
   *
   * // Force delete with data purge
   * await client.users.delete({ uid: 'alice', purgeData: true });
   * ```
   */
  async delete(input: DeleteUserInput): Promise<void> {
    validateUid(input.uid);

    if (input.purgeData) {
      console.warn(
        `[radosgw-admin] WARNING: purgeData=true will permanently delete all objects for user "${input.uid}"`,
      );
    }

    return this.client.request<void>({
      method: 'DELETE',
      path: '/user',
      query: {
        uid: input.uid,
        purgeData: input.purgeData,
      },
    });
  }

  /**
   * List all user IDs in the cluster.
   *
   * @returns Array of user ID strings.
   *
   * @example
   * ```typescript
   * const uids = await client.users.list();
   * console.log('Total users:', uids.length);
   * ```
   */
  async list(): Promise<string[]> {
    return this.client.request<string[]>({
      method: 'GET',
      path: '/metadata/user',
    });
  }

  /**
   * Suspend a user account. The user's data is preserved but access is denied.
   *
   * @param uid - The user ID to suspend.
   * @returns The updated user object with `suspended: 1`.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * const suspended = await client.users.suspend('alice');
   * console.log(suspended.suspended); // 1
   * ```
   */
  async suspend(uid: string): Promise<RGWUser> {
    validateUid(uid);

    return this.client.request<RGWUser>({
      method: 'POST',
      path: '/user',
      query: { uid, suspended: true },
    });
  }

  /**
   * Re-enable a suspended user account.
   *
   * @param uid - The user ID to enable.
   * @returns The updated user object with `suspended: 0`.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * const enabled = await client.users.enable('alice');
   * console.log(enabled.suspended); // 0
   * ```
   */
  async enable(uid: string): Promise<RGWUser> {
    validateUid(uid);

    return this.client.request<RGWUser>({
      method: 'POST',
      path: '/user',
      query: { uid, suspended: false },
    });
  }

  /**
   * Get storage usage statistics for a user.
   *
   * @param input - `uid` is required. Set `sync: true` to force a stats sync before returning.
   * @returns User storage statistics (size, objects, etc.).
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * const stats = await client.users.getStats({ uid: 'alice', sync: true });
   * console.log('Objects:', stats.stats.numObjects);
   * console.log('Size (KB):', stats.stats.sizeKb);
   * ```
   */
  async getStats(input: GetUserStatsInput): Promise<RGWUserStats> {
    validateUid(input.uid);

    return this.client.request<RGWUserStats>({
      method: 'GET',
      path: '/user',
      query: {
        uid: input.uid,
        stats: true,
        sync: input.sync,
      },
    });
  }
}
