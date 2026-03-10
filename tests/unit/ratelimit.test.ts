import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitModule } from '../../src/modules/ratelimit.js';
import { RGWValidationError } from '../../src/errors.js';
import type { BaseClient } from '../../src/client.js';
import type { RGWRateLimit, RGWGlobalRateLimit } from '../../src/types/quota.types.js';

const mockRateLimit: RGWRateLimit = {
  enabled: true,
  maxReadOps: 100,
  maxWriteOps: 50,
  maxReadBytes: 0,
  maxWriteBytes: 52428800,
};

const mockGlobalRateLimit: RGWGlobalRateLimit = {
  user: { enabled: false, maxReadOps: 0, maxWriteOps: 0, maxReadBytes: 0, maxWriteBytes: 0 },
  bucket: { enabled: false, maxReadOps: 0, maxWriteOps: 0, maxReadBytes: 0, maxWriteBytes: 0 },
  anonymous: { enabled: true, maxReadOps: 50, maxWriteOps: 0, maxReadBytes: 0, maxWriteBytes: 0 },
};

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as BaseClient & { request: ReturnType<typeof vi.fn> };
}

describe('RateLimitModule', () => {
  let client: ReturnType<typeof createMockClient>;
  let rateLimit: RateLimitModule;

  beforeEach(() => {
    client = createMockClient();
    rateLimit = new RateLimitModule(client);
  });

  // ── getUserLimit ─────────────────────────────────────────

  describe('getUserLimit', () => {
    it('sends GET /ratelimit with uid and scope=user', async () => {
      client.request.mockResolvedValue(mockRateLimit);

      const result = await rateLimit.getUserLimit('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/ratelimit',
        query: { rateLimit: '', uid: 'alice', scope: 'user' },
      });
      expect(result.maxReadOps).toBe(100);
      expect(result.maxWriteOps).toBe(50);
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(rateLimit.getUserLimit('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── setUserLimit ─────────────────────────────────────────

  describe('setUserLimit', () => {
    it('sends POST /ratelimit with all params', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setUserLimit({
        uid: 'alice',
        maxReadOps: 100,
        maxWriteOps: 50,
        maxReadBytes: 1048576,
        maxWriteBytes: 52428800,
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/ratelimit',
        query: {
          rateLimit: '',
          uid: 'alice',
          scope: 'user',
          maxReadOps: 100,
          maxWriteOps: 50,
          maxReadBytes: 1048576,
          maxWriteBytes: 52428800,
          enabled: true,
        },
      });
    });

    it('defaults enabled to true', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setUserLimit({ uid: 'alice', maxReadOps: 100 });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.enabled).toBe(true);
    });

    it('respects explicit enabled=false', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setUserLimit({ uid: 'alice', maxReadOps: 100, enabled: false });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.enabled).toBe(false);
    });

    it('sends undefined for omitted optional fields', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setUserLimit({ uid: 'alice' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.maxReadOps).toBeUndefined();
      expect(call.query.maxWriteOps).toBeUndefined();
      expect(call.query.maxReadBytes).toBeUndefined();
      expect(call.query.maxWriteBytes).toBeUndefined();
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(rateLimit.setUserLimit({ uid: '' })).rejects.toThrow(RGWValidationError);
    });
  });

  // ── disableUserLimit ─────────────────────────────────

  describe('disableUserLimit', () => {
    it('sends POST with enabled=false', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.disableUserLimit('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/ratelimit',
        query: { rateLimit: '', uid: 'alice', scope: 'user', enabled: false },
      });
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(rateLimit.disableUserLimit('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── getBucketLimit ───────────────────────────────────────

  describe('getBucketLimit', () => {
    it('sends GET /ratelimit with bucket and scope=bucket', async () => {
      client.request.mockResolvedValue(mockRateLimit);

      const result = await rateLimit.getBucketLimit('my-bucket');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/ratelimit',
        query: { rateLimit: '', bucket: 'my-bucket', scope: 'bucket' },
      });
      expect(result.enabled).toBe(true);
    });

    it('throws RGWValidationError when bucket is empty', async () => {
      await expect(rateLimit.getBucketLimit('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── setBucketLimit ───────────────────────────────────────

  describe('setBucketLimit', () => {
    it('sends POST /ratelimit with bucket params', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setBucketLimit({
        bucket: 'my-bucket',
        maxReadOps: 200,
        maxWriteOps: 100,
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/ratelimit',
        query: {
          rateLimit: '',
          bucket: 'my-bucket',
          scope: 'bucket',
          maxReadOps: 200,
          maxWriteOps: 100,
          maxReadBytes: undefined,
          maxWriteBytes: undefined,
          enabled: true,
        },
      });
    });

    it('throws RGWValidationError when bucket is empty', async () => {
      await expect(rateLimit.setBucketLimit({ bucket: '' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when bucket is whitespace', async () => {
      await expect(rateLimit.setBucketLimit({ bucket: '   ' })).rejects.toThrow(RGWValidationError);
    });
  });

  // ── disableBucketLimit ───────────────────────────────

  describe('disableBucketLimit', () => {
    it('sends POST with enabled=false for bucket', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.disableBucketLimit('my-bucket');

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/ratelimit',
        query: { rateLimit: '', bucket: 'my-bucket', scope: 'bucket', enabled: false },
      });
    });

    it('throws RGWValidationError when bucket is empty', async () => {
      await expect(rateLimit.disableBucketLimit('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── getGlobal ───────────────────────────────────────

  describe('getGlobal', () => {
    it('sends GET /ratelimit with global param', async () => {
      client.request.mockResolvedValue(mockGlobalRateLimit);

      const result = await rateLimit.getGlobal();

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/ratelimit',
        query: { rateLimit: '', global: '' },
      });
      expect(result.anonymous.enabled).toBe(true);
      expect(result.anonymous.maxReadOps).toBe(50);
      expect(result.user.enabled).toBe(false);
    });
  });

  // ── setGlobal ───────────────────────────────────────

  describe('setGlobal', () => {
    it('sends POST /ratelimit with global and scope', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setGlobal({
        scope: 'anonymous',
        maxReadOps: 50,
        maxWriteOps: 0,
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/ratelimit',
        query: {
          rateLimit: '',
          global: '',
          scope: 'anonymous',
          maxReadOps: 50,
          maxWriteOps: 0,
          maxReadBytes: undefined,
          maxWriteBytes: undefined,
          enabled: true,
        },
      });
    });

    it('accepts scope=user', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setGlobal({ scope: 'user', maxReadOps: 1000 });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.scope).toBe('user');
    });

    it('accepts scope=bucket', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setGlobal({ scope: 'bucket', maxWriteOps: 500 });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.scope).toBe('bucket');
    });

    it('defaults enabled to true', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setGlobal({ scope: 'anonymous', maxReadOps: 50 });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.enabled).toBe(true);
    });

    it('respects explicit enabled=false', async () => {
      client.request.mockResolvedValue(undefined);

      await rateLimit.setGlobal({ scope: 'anonymous', enabled: false });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.enabled).toBe(false);
    });

    it('throws RGWValidationError for invalid scope', async () => {
      await expect(
        rateLimit.setGlobal({ scope: 'invalid' as 'user', maxReadOps: 50 }),
      ).rejects.toThrow(RGWValidationError);
    });
  });
});
