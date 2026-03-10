import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BucketsModule } from '../../src/modules/buckets.js';
import { RGWValidationError } from '../../src/errors.js';
import type { BaseClient } from '../../src/client.js';
import type { RGWBucket, CheckBucketIndexResult } from '../../src/types/bucket.types.js';

const mockBucket: RGWBucket = {
  bucket: 'my-bucket',
  tenant: '',
  explicitTenant: false,
  id: 'bucket-id-123',
  marker: 'marker-123',
  indexType: 'Normal',
  owner: 'alice',
  ver: '1',
  masterVer: '1',
  mtime: '2026-01-01T00:00:00.000Z',
  creationTime: '2026-01-01T00:00:00.000Z',
  maxMarker: '0,',
  usage: {
    rgwMain: {
      size: 1024,
      sizeActual: 4096,
      sizeUtilized: 1024,
      sizeKb: 1,
      sizeKbActual: 4,
      numObjects: 5,
    },
    rgwMultimeta: {
      size: 0,
      sizeActual: 0,
      sizeUtilized: 0,
      sizeKb: 0,
      sizeKbActual: 0,
      numObjects: 0,
    },
  },
  bucketQuota: {
    enabled: false,
    checkOnRaw: false,
    maxSize: -1,
    maxSizeKb: 0,
    maxObjects: -1,
  },
};

const mockCheckResult: CheckBucketIndexResult = {
  invalidMultipartEntries: [],
  checkResult: {
    existingHeader: { usage: {} },
    calculatedHeader: { usage: {} },
  },
};

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as BaseClient & { request: ReturnType<typeof vi.fn> };
}

describe('BucketsModule', () => {
  let client: ReturnType<typeof createMockClient>;
  let buckets: BucketsModule;

  beforeEach(() => {
    client = createMockClient();
    buckets = new BucketsModule(client);
  });

  // ── list ──────────────────────────────────────────────

  describe('list', () => {
    it('sends GET /bucket without uid', async () => {
      client.request.mockResolvedValue(['bucket-a', 'bucket-b']);

      const result = await buckets.list();

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/bucket',
        query: {},
      });
      expect(result).toEqual(['bucket-a', 'bucket-b']);
    });

    it('sends GET /bucket with uid filter', async () => {
      client.request.mockResolvedValue(['bucket-a']);

      const result = await buckets.list('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/bucket',
        query: { uid: 'alice' },
      });
      expect(result).toEqual(['bucket-a']);
    });

    it('returns empty array when no buckets exist', async () => {
      client.request.mockResolvedValue([]);

      const result = await buckets.list();

      expect(result).toEqual([]);
    });

    it('throws RGWValidationError when uid is empty string', async () => {
      await expect(buckets.list('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── getInfo ───────────────────────────────────────────

  describe('getInfo', () => {
    it('sends GET /bucket with bucket name', async () => {
      client.request.mockResolvedValue(mockBucket);

      const result = await buckets.getInfo('my-bucket');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/bucket',
        query: { bucket: 'my-bucket' },
      });
      expect(result.owner).toBe('alice');
      expect(result.usage.rgwMain.numObjects).toBe(5);
    });

    it('throws RGWValidationError when bucket is empty', async () => {
      await expect(buckets.getInfo('')).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when bucket is whitespace-only', async () => {
      await expect(buckets.getInfo('   ')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── delete ────────────────────────────────────────────

  describe('delete', () => {
    it('sends DELETE /bucket with bucket name', async () => {
      client.request.mockResolvedValue(undefined);

      await buckets.delete({ bucket: 'my-bucket' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/bucket',
        query: { bucket: 'my-bucket', purgeObjects: undefined },
      });
    });

    it('sends purgeObjects when true', async () => {
      client.request.mockResolvedValue(undefined);

      await buckets.delete({ bucket: 'my-bucket', purgeObjects: true });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/bucket',
        query: { bucket: 'my-bucket', purgeObjects: true },
      });
    });

    it('emits console.warn when purgeObjects is true', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      client.request.mockResolvedValue(undefined);

      await buckets.delete({ bucket: 'my-bucket', purgeObjects: true });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('purgeObjects=true'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"my-bucket"'));
      warnSpy.mockRestore();
    });

    it('does not emit console.warn when purgeObjects is false', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      client.request.mockResolvedValue(undefined);

      await buckets.delete({ bucket: 'my-bucket', purgeObjects: false });

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('throws RGWValidationError when bucket is empty', async () => {
      await expect(buckets.delete({ bucket: '' })).rejects.toThrow(RGWValidationError);
    });
  });

  // ── transferOwnership ──────────────────────────────────

  describe('transferOwnership', () => {
    it('sends PUT /bucket with correct params', async () => {
      client.request.mockResolvedValue(undefined);

      await buckets.transferOwnership({
        bucket: 'my-bucket',
        bucketId: 'bucket-id-123',
        uid: 'bob',
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/bucket',
        query: { bucket: 'my-bucket', bucketId: 'bucket-id-123', uid: 'bob' },
      });
    });

    it('throws RGWValidationError when bucket is empty', async () => {
      await expect(
        buckets.transferOwnership({ bucket: '', bucketId: 'id', uid: 'bob' }),
      ).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(
        buckets.transferOwnership({ bucket: 'my-bucket', bucketId: 'id', uid: '' }),
      ).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when bucketId is empty', async () => {
      await expect(
        buckets.transferOwnership({ bucket: 'my-bucket', bucketId: '', uid: 'bob' }),
      ).rejects.toThrow(RGWValidationError);
    });
  });

  // ── removeOwnership ────────────────────────────────────

  describe('removeOwnership', () => {
    it('sends POST /bucket with correct params', async () => {
      client.request.mockResolvedValue(undefined);

      await buckets.removeOwnership({ bucket: 'my-bucket', uid: 'alice' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/bucket',
        query: { bucket: 'my-bucket', uid: 'alice' },
      });
    });

    it('throws RGWValidationError when bucket is empty', async () => {
      await expect(buckets.removeOwnership({ bucket: '', uid: 'alice' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(buckets.removeOwnership({ bucket: 'my-bucket', uid: '' })).rejects.toThrow(
        RGWValidationError,
      );
    });
  });

  // ── verifyIndex ────────────────────────────────────────

  describe('verifyIndex', () => {
    it('sends GET /bucket with index param', async () => {
      client.request.mockResolvedValue(mockCheckResult);

      const result = await buckets.verifyIndex({ bucket: 'my-bucket' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/bucket',
        query: expect.objectContaining({
          index: '',
          bucket: 'my-bucket',
        }),
      });
      expect(result.invalidMultipartEntries).toEqual([]);
    });

    it('sends checkObjects and fix when provided', async () => {
      client.request.mockResolvedValue(mockCheckResult);

      await buckets.verifyIndex({ bucket: 'my-bucket', checkObjects: true, fix: true });

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/bucket',
        query: {
          index: '',
          bucket: 'my-bucket',
          checkObjects: true,
          fix: true,
        },
      });
    });

    it('sends optional fields as undefined when not provided', async () => {
      client.request.mockResolvedValue(mockCheckResult);

      await buckets.verifyIndex({ bucket: 'my-bucket' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.checkObjects).toBeUndefined();
      expect(call.query.fix).toBeUndefined();
    });

    it('throws RGWValidationError when bucket is empty', async () => {
      await expect(buckets.verifyIndex({ bucket: '' })).rejects.toThrow(RGWValidationError);
    });
  });
});
