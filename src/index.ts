import { BaseClient } from './client.js';
import { UsersModule } from './modules/users.js';
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

  constructor(config: ClientConfig) {
    this._client = new BaseClient(config);
    this.users = new UsersModule(this._client);
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

// Re-export errors
export {
  RGWError,
  RGWNotFoundError,
  RGWValidationError,
  RGWAuthError,
  RGWConflictError,
} from './errors.js';
