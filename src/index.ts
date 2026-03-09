import { BaseClient } from './client.js';
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
 * ```
 */
export class RadosGWAdminClient {
  /** @internal */
  readonly _client: BaseClient;

  constructor(config: ClientConfig) {
    this._client = new BaseClient(config);
  }
}

// Re-export types
export type { ClientConfig } from './types/common.types.js';

// Re-export errors
export {
  RGWError,
  RGWNotFoundError,
  RGWValidationError,
  RGWAuthError,
  RGWConflictError,
} from './errors.js';
