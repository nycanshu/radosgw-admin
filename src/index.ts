import { BaseClient } from './client.js';
import { UsersModule } from './modules/users.js';
import { KeysModule } from './modules/keys.js';
import { SubusersModule } from './modules/subusers.js';
import { BucketsModule } from './modules/buckets.js';
import type { ClientConfig } from './types/common.types.js';

/**
 * RadosGW Admin Client — the single entry point for all RGW Admin API operations.
 *
 * @example
 * ```typescript
 * import { RadosGWAdminClient } from 'radosgw-admin';
 *
 * const client = new RadosGWAdminClient({
 *   host: 'http://192.168.1.100',
 *   port: 8080,
 *   accessKey: 'ADMIN_ACCESS_KEY',
 *   secretKey: 'ADMIN_SECRET_KEY',
 * });
 *
 * const user = await client.users.create({
 *   uid: 'alice',
 *   displayName: 'Alice',
 * });
 * ```
 */
export class RadosGWAdminClient {
  /** @internal */
  readonly _client: BaseClient;

  /** User management operations. */
  readonly users: UsersModule;

  /** S3/Swift key management operations. */
  readonly keys: KeysModule;

  /** Subuser management operations. */
  readonly subusers: SubusersModule;

  /** Bucket management operations. */
  readonly buckets: BucketsModule;

  constructor(config: ClientConfig) {
    this._client = new BaseClient(config);
    this.users = new UsersModule(this._client);
    this.keys = new KeysModule(this._client);
    this.subusers = new SubusersModule(this._client);
    this.buckets = new BucketsModule(this._client);
  }
}

// Re-export types
export type { ClientConfig } from './types/common.types.js';
export type {
  CreateUserInput,
  ModifyUserInput,
  DeleteUserInput,
  GetUserStatsInput,
  RGWUser,
  RGWUserStats,
  RGWKey,
  RGWSwiftKey,
  RGWSubuser,
  RGWCap,
  RGWQuota,
} from './types/user.types.js';
export type {
  CreateKeyInput,
  DeleteKeyInput,
  CreateSubuserInput,
  ModifySubuserInput,
  DeleteSubuserInput,
} from './types/key.types.js';
export type {
  RGWBucket,
  RGWBucketUsage,
  DeleteBucketInput,
  LinkBucketInput,
  UnlinkBucketInput,
  CheckBucketIndexInput,
  CheckBucketIndexResult,
} from './types/bucket.types.js';

// Re-export errors
export {
  RGWError,
  RGWNotFoundError,
  RGWValidationError,
  RGWAuthError,
  RGWConflictError,
} from './errors.js';
