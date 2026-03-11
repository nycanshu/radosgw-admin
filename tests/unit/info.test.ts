import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InfoModule } from '../../src/modules/info.js';
import type { BaseClient } from '../../src/client.js';
import type { RGWClusterInfo } from '../../src/types/usage.types.js';

const mockClusterInfo: RGWClusterInfo = {
  info: {
    clusterId: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
  },
};

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as BaseClient & { request: ReturnType<typeof vi.fn> };
}

describe('InfoModule', () => {
  let client: ReturnType<typeof createMockClient>;
  let info: InfoModule;

  beforeEach(() => {
    client = createMockClient();
    info = new InfoModule(client);
  });

  describe('get', () => {
    it('sends GET /info with empty query', async () => {
      client.request.mockResolvedValue(mockClusterInfo);

      const result = await info.get();

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/info',
        query: {},
      });
      expect(result.info.clusterId).toBe('a0b1c2d3-e4f5-6789-abcd-ef0123456789');
    });

    it('returns the cluster info shape', async () => {
      client.request.mockResolvedValue(mockClusterInfo);

      const result = await info.get();

      expect(result).toHaveProperty('info');
      expect(result.info).toHaveProperty('clusterId');
      expect(typeof result.info.clusterId).toBe('string');
    });
  });
});
