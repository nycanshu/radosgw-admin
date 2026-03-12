import { BaseClient } from './client.js';
import { UsersModule } from './modules/users.js';
import { KeysModule } from './modules/keys.js';
import { SubusersModule } from './modules/subusers.js';
import { BucketsModule } from './modules/buckets.js';
import { QuotaModule } from './modules/quota.js';
import { RateLimitModule } from './modules/ratelimit.js';
import { UsageModule } from './modules/usage.js';
import { InfoModule } from './modules/info.js';
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

  /** Quota management operations (user-level and bucket-level). */
  readonly quota: QuotaModule;

  /** Rate limit management operations (user, bucket, and global). */
  readonly rateLimit: RateLimitModule;

  /** Usage & analytics operations — query and trim RGW usage logs. */
  readonly usage: UsageModule;

  /** Cluster info operations. */
  readonly info: InfoModule;

  constructor(config: ClientConfig) {
    this._client = new BaseClient(config);
    this.users = new UsersModule(this._client);
    this.keys = new KeysModule(this._client);
    this.subusers = new SubusersModule(this._client);
    this.buckets = new BucketsModule(this._client);
    this.quota = new QuotaModule(this._client);
    this.rateLimit = new RateLimitModule(this._client);
    this.usage = new UsageModule(this._client);
    this.info = new InfoModule(this._client);
  }
}

// Re-export types
export type { ClientConfig } from './types/common.types.js';
export type {
  CreateUserInput,
  ModifyUserInput,
  DeleteUserInput,
  RGWUser,
  RGWUserStatData,
  RGWUserWithStats,
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
export type {
  RGWRateLimit,
  RGWGlobalRateLimit,
  SetUserQuotaInput,
  SetBucketQuotaInput,
  SetUserRateLimitInput,
  SetBucketRateLimitInput,
  SetGlobalRateLimitInput,
} from './types/quota.types.js';
export type {
  GetUsageInput,
  TrimUsageInput,
  RGWUsageReport,
  RGWUsageEntry,
  RGWUsageSummary,
  RGWUsageCategory,
} from './types/usage.types.js';
export type { RGWClusterInfo, RGWStorageBackend } from './types/info.types.js';

// Re-export errors
export {
  RGWError,
  RGWNotFoundError,
  RGWValidationError,
  RGWAuthError,
  RGWConflictError,
} from './errors.js';

// Re-export internals for advanced use cases (extending the client, custom signing)
export { BaseClient } from './client.js';
export { signRequest } from './signer.js';
export type { RequestOptions, HttpMethod } from './types/common.types.js';
