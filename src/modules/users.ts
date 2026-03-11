import type { BaseClient } from '../client.js';
import { RGWValidationError } from '../errors.js';
import { validateUid, validateUidNoColon } from '../validators.js';
import type {
  CreateUserInput,
  ModifyUserInput,
  DeleteUserInput,
  RGWUser,
  RGWUserWithStats,
} from '../types/user.types.js';

/**
 * Validates a basic email format. Rejects empty strings or addresses without
 * an `@` and a domain segment. Full RFC 5321 validation is intentionally not
 * performed — RGW stores arbitrary display strings and the goal is catching
 * obvious developer mistakes at the call site.
 */
function validateEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RGWValidationError(
      `Invalid email address: "${email}". Expected format: "user@domain.tld"`,
    );
  }
}

/**
 * Validates the user capabilities string format.
 * Expected: `"type=perm"` or `"type1=perm;type2=perm"`.
 * Valid perms: `*`, `read`, `write`, `read, write`.
 */
function validateUserCaps(caps: string): void {
  if (!caps.trim()) {
    throw new RGWValidationError('userCaps must not be empty if provided');
  }
  const capSegment = /^[a-z][a-z-]*=(?:\*|read,\s*write|read|write)$/i;
  const valid = caps
    .split(';')
    .map((s) => s.trim())
    .every((seg) => capSegment.test(seg));
  if (!valid) {
    throw new RGWValidationError(
      `Invalid userCaps format: "${caps}". ` +
        `Expected "type=perm" or "type1=perm;type2=perm". ` +
        `Valid perms: *, read, write, "read, write". ` +
        `Example: "users=*;buckets=read"`,
    );
  }
}

/**
 * User management module — create, get, modify, delete, list, suspend, enable,
 * get stats, and look up users by access key.
 *
 * @example
 * ```typescript
 * const user = await client.users.create({ uid: 'alice', displayName: 'Alice' });
 * const same = await client.users.getByAccessKey(user.keys[0].accessKey);
 * ```
 */
export class UsersModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * Create a new RGW user.
   *
   * @param input - User creation parameters. `uid` and `displayName` are required.
   * @returns The newly created user object with keys, caps, and quotas.
   * @throws {RGWValidationError} If `uid` contains colons, `displayName` is blank,
   *   `email` is malformed, or `userCaps` is an invalid capability string.
   * @throws {RGWConflictError} If a user with the given `uid` already exists.
   *
   * @example
   * ```typescript
   * const user = await client.users.create({
   *   uid: 'alice',
   *   displayName: 'Alice Example',
   *   email: 'alice@example.com',
   *   maxBuckets: 100,
   *   userCaps: 'users=read;buckets=*',
   * });
   * console.log(user.keys[0].accessKey);
   * ```
   */
  async create(input: CreateUserInput): Promise<RGWUser> {
    validateUidNoColon(input.uid);

    if (
      !input.displayName ||
      typeof input.displayName !== 'string' ||
      input.displayName.trim().length === 0
    ) {
      throw new RGWValidationError('displayName is required and must be a non-empty string');
    }
    if (input.displayName !== input.displayName.trim()) {
      throw new RGWValidationError('displayName must not have leading or trailing whitespace');
    }
    if (input.email !== undefined) {
      validateEmail(input.email);
    }
    if (input.userCaps !== undefined) {
      validateUserCaps(input.userCaps);
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
        opMask: input.opMask,
      },
    });
  }

  /**
   * Get full user information including keys, caps, and quotas.
   *
   * For multi-tenant setups pass the `tenant` parameter instead of embedding
   * it in the uid string. Both `get('alice', 'acme')` and `get('acme$alice')`
   * resolve to the same user; the former is preferred for clarity.
   *
   * @param uid - The user ID (without tenant prefix).
   * @param tenant - Optional tenant name. When provided, resolves to `tenant$uid`.
   * @returns Full user object.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * // Standard lookup
   * const user = await client.users.get('alice');
   *
   * // Multi-tenant lookup
   * const tenantUser = await client.users.get('alice', 'acme');
   * ```
   */
  async get(uid: string, tenant?: string): Promise<RGWUser> {
    validateUid(uid);
    const effectiveUid = tenant ? `${tenant}$${uid}` : uid;

    return this.client.request<RGWUser>({
      method: 'GET',
      path: '/user',
      query: { uid: effectiveUid },
    });
  }

  /**
   * Look up a user by their S3 access key.
   *
   * Useful for mapping an incoming S3 request's access key to the owning user
   * without knowing the uid in advance.
   *
   * @param accessKey - The S3 access key to look up.
   * @returns The user that owns this access key.
   * @throws {RGWValidationError} If `accessKey` is empty.
   * @throws {RGWNotFoundError} If no user owns this access key.
   *
   * @example
   * ```typescript
   * const user = await client.users.getByAccessKey('AKIAIOSFODNN7EXAMPLE');
   * console.log('Key belongs to:', user.userId);
   * ```
   */
  async getByAccessKey(accessKey: string): Promise<RGWUser> {
    if (!accessKey || typeof accessKey !== 'string' || accessKey.trim().length === 0) {
      throw new RGWValidationError('accessKey is required and must be a non-empty string');
    }

    return this.client.request<RGWUser>({
      method: 'GET',
      path: '/user',
      query: { accessKey },
    });
  }

  /**
   * Modify an existing user's properties.
   *
   * Only the provided fields are updated — omitted fields retain their current values.
   *
   * @param input - Properties to update. `uid` is required; all other fields are optional.
   * @returns The updated user object.
   * @throws {RGWValidationError} If `uid` is empty, `email` is malformed,
   *   or `userCaps` is an invalid capability string.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * const updated = await client.users.modify({
   *   uid: 'alice',
   *   displayName: 'Alice Updated',
   *   maxBuckets: 200,
   *   opMask: 'read, write',
   * });
   * ```
   */
  async modify(input: ModifyUserInput): Promise<RGWUser> {
    validateUid(input.uid);
    if (input.email !== undefined) {
      validateEmail(input.email);
    }
    if (input.userCaps !== undefined) {
      validateUserCaps(input.userCaps);
    }

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
   * // Safe delete — fails if user owns buckets
   * await client.users.delete({ uid: 'alice' });
   *
   * // ⚠️  Force delete with full data purge
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
   * List all user IDs in the cluster (or tenant).
   *
   * Returns the full list in a single call. For clusters with a very large number
   * of users, this may be a large response — there is no server-side pagination
   * support on the `/metadata/user` endpoint.
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
   * Suspend a user account. The user's data is preserved but all API access is denied.
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
   * Returns the full user object with an additional `stats` field containing
   * storage size and object counts. Pass `sync: true` to force RGW to
   * recalculate stats from the backing store before returning (slower but accurate).
   *
   * @param uid - The user ID.
   * @param sync - If true, forces a stats sync before returning. Default: false.
   * @returns User object with embedded `stats` field.
   * @throws {RGWValidationError} If `uid` is empty.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * // Fast read (may be slightly stale)
   * const result = await client.users.getStats('alice');
   *
   * // Force sync — accurate but slower
   * const result = await client.users.getStats('alice', true);
   *
   * console.log('Objects:', result.stats.numObjects);
   * console.log('Size (KB):', result.stats.sizeKb);
   * ```
   */
  async getStats(uid: string, sync?: boolean): Promise<RGWUserWithStats> {
    validateUid(uid);

    return this.client.request<RGWUserWithStats>({
      method: 'GET',
      path: '/user',
      query: {
        uid,
        stats: true,
        sync,
      },
    });
  }
}
