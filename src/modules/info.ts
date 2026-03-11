import type { BaseClient } from '../client.js';
import type { RGWClusterInfo } from '../types/usage.types.js';

/**
 * Cluster info module — retrieve basic cluster/endpoint information.
 *
 * @example
 * ```typescript
 * const info = await client.info.get();
 * console.log('Cluster FSID:', info.info.clusterId);
 * ```
 */
export class InfoModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * Get basic cluster information including the Ceph cluster FSID.
   *
   * Useful for confirming connectivity and identifying which cluster the
   * client is connected to when managing multiple environments.
   *
   * @returns Cluster info containing the cluster ID (FSID).
   *
   * @example
   * ```typescript
   * const info = await client.info.get();
   * console.log('Cluster FSID:', info.info.clusterId);
   * ```
   */
  async get(): Promise<RGWClusterInfo> {
    return this.client.request<RGWClusterInfo>({
      method: 'GET',
      path: '/info',
      query: {},
    });
  }
}
