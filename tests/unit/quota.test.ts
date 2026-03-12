import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuotaModule, parseSizeString } from '../../src/modules/quota.js';
import { RGWValidationError } from '../../src/errors.js';
import type { BaseClient } from '../../src/client.js';
import type { RGWQuota } from '../../src/types/user.types.js';

const mockQuota: RGWQuota = {
  enabled: true,
  checkOnRaw: false,
  maxSize: 10737418240,
  maxSizeKb: 10485760,
  maxObjects: 50000,
};

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as BaseClient & { request: ReturnType<typeof vi.fn> };
}

describe('parseSizeString', () => {
  it('passes through numbers unchanged', () => {
    expect(parseSizeString(1024)).toBe(1024);
    expect(parseSizeString(0)).toBe(0);
    expect(parseSizeString(-1)).toBe(-1);
  });

  it('parses kilobytes', () => {
    expect(parseSizeString('1K')).toBe(1024);
    expect(parseSizeString('1KB')).toBe(1024);
    expect(parseSizeString('1024K')).toBe(1048576);
  });

  it('parses megabytes', () => {
    expect(parseSizeString('1M')).toBe(1048576);
    expect(parseSizeString('500M')).toBe(524288000);
    expect(parseSizeString('500MB')).toBe(524288000);
  });

  it('parses gigabytes', () => {
    expect(parseSizeString('1G')).toBe(1073741824);
    expect(parseSizeString('10G')).toBe(10737418240);
    expect(parseSizeString('10GB')).toBe(10737418240);
  });

  it('parses terabytes', () => {
    expect(parseSizeString('1T')).toBe(1099511627776);
    expect(parseSizeString('1TB')).toBe(1099511627776);
  });

  it('parses decimal values', () => {
    expect(parseSizeString('1.5G')).toBe(Math.floor(1.5 * 1024 ** 3));
    expect(parseSizeString('2.5M')).toBe(Math.floor(2.5 * 1024 ** 2));
  });

  it('parses plain numbers as bytes', () => {
    expect(parseSizeString('100')).toBe(100);
    expect(parseSizeString('0')).toBe(0);
  });

  it('handles case insensitivity', () => {
    expect(parseSizeString('10g')).toBe(10737418240);
    expect(parseSizeString('500m')).toBe(524288000);
    expect(parseSizeString('1t')).toBe(1099511627776);
  });

  it('handles whitespace', () => {
    expect(parseSizeString('  10G  ')).toBe(10737418240);
  });

  it('throws on invalid format', () => {
    expect(() => parseSizeString('abc')).toThrow(RGWValidationError);
    expect(() => parseSizeString('10X')).toThrow(RGWValidationError);
    expect(() => parseSizeString('')).toThrow(RGWValidationError);
    expect(() => parseSizeString('G10')).toThrow(RGWValidationError);
  });
});

describe('QuotaModule', () => {
  let client: ReturnType<typeof createMockClient>;
  let quota: QuotaModule;

  beforeEach(() => {
    client = createMockClient();
    quota = new QuotaModule(client);
  });

  // ── getUserQuota ─────────────────────────────────────────

  describe('getUserQuota', () => {
    it('sends GET /user with quota and quotaType=user', async () => {
      client.request.mockResolvedValue(mockQuota);

      const result = await quota.getUserQuota('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user',
        query: { uid: 'alice', quota: '', quotaType: 'user' },
      });
      expect(result.enabled).toBe(true);
      expect(result.maxSize).toBe(10737418240);
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(quota.getUserQuota('')).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when uid has whitespace', async () => {
      await expect(quota.getUserQuota('  alice')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── setUserQuota ─────────────────────────────────────────

  describe('setUserQuota', () => {
    it('sends PUT /user with quota params and size in bytes', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setUserQuota({ uid: 'alice', maxSize: 10737418240, maxObjects: 50000 });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: {
          uid: 'alice',
          quota: '',
          quotaType: 'user',
          maxSize: 10737418240,
          maxObjects: 50000,
          enabled: true,
        },
      });
    });

    it('converts size string to bytes', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setUserQuota({ uid: 'alice', maxSize: '10G' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.maxSize).toBe(10737418240);
    });

    it('defaults enabled to true', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setUserQuota({ uid: 'alice', maxSize: 1024 });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.enabled).toBe(true);
    });

    it('respects explicit enabled=false', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setUserQuota({ uid: 'alice', maxSize: 1024, enabled: false });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.enabled).toBe(false);
    });

    it('sends undefined for omitted optional fields', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setUserQuota({ uid: 'alice' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.maxSize).toBeUndefined();
      expect(call.query.maxObjects).toBeUndefined();
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(quota.setUserQuota({ uid: '' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError for invalid size string', async () => {
      await expect(quota.setUserQuota({ uid: 'alice', maxSize: 'invalid' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when uid has whitespace', async () => {
      await expect(quota.setUserQuota({ uid: '  alice' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when maxObjects is invalid negative', async () => {
      await expect(quota.setUserQuota({ uid: 'alice', maxObjects: -5 })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when maxSize is invalid negative number', async () => {
      await expect(quota.setUserQuota({ uid: 'alice', maxSize: -100 })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('accepts maxObjects=-1 (unlimited)', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setUserQuota({ uid: 'alice', maxObjects: -1 });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.maxObjects).toBe(-1);
    });

    it('accepts maxSize=-1 (unlimited)', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setUserQuota({ uid: 'alice', maxSize: -1 });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.maxSize).toBe(-1);
    });
  });

  // ── enableUserQuota / disableUserQuota ─────────────────────────

  describe('enableUserQuota', () => {
    it('sends PUT with enabled=true', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.enableUserQuota('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: { uid: 'alice', quota: '', quotaType: 'user', enabled: true },
      });
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(quota.enableUserQuota('')).rejects.toThrow(RGWValidationError);
    });
  });

  describe('disableUserQuota', () => {
    it('sends PUT with enabled=false', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.disableUserQuota('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: { uid: 'alice', quota: '', quotaType: 'user', enabled: false },
      });
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(quota.disableUserQuota('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── getBucketQuota ───────────────────────────────────────

  describe('getBucketQuota', () => {
    it('sends GET /user with quotaType=bucket', async () => {
      client.request.mockResolvedValue(mockQuota);

      const result = await quota.getBucketQuota('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user',
        query: { uid: 'alice', quota: '', quotaType: 'bucket' },
      });
      expect(result.maxObjects).toBe(50000);
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(quota.getBucketQuota('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── setBucketQuota ───────────────────────────────────────

  describe('setBucketQuota', () => {
    it('sends PUT with quotaType=bucket and converts size string', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setBucketQuota({ uid: 'alice', maxSize: '1G', maxObjects: 10000 });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: {
          uid: 'alice',
          quota: '',
          quotaType: 'bucket',
          maxSize: 1073741824,
          maxObjects: 10000,
          enabled: true,
        },
      });
    });

    it('converts size string to bytes', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setBucketQuota({ uid: 'alice', maxSize: '500M' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.maxSize).toBe(524288000);
    });

    it('defaults enabled to true', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setBucketQuota({ uid: 'alice', maxSize: 1024 });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.enabled).toBe(true);
    });

    it('respects explicit enabled=false', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setBucketQuota({ uid: 'alice', maxSize: 1024, enabled: false });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.enabled).toBe(false);
    });

    it('sends undefined for omitted optional fields', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.setBucketQuota({ uid: 'alice' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.maxSize).toBeUndefined();
      expect(call.query.maxObjects).toBeUndefined();
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(quota.setBucketQuota({ uid: '' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when uid has whitespace', async () => {
      await expect(quota.setBucketQuota({ uid: '  alice' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError for invalid size string', async () => {
      await expect(quota.setBucketQuota({ uid: 'alice', maxSize: 'invalid' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when maxObjects is invalid negative', async () => {
      await expect(quota.setBucketQuota({ uid: 'alice', maxObjects: -5 })).rejects.toThrow(
        RGWValidationError,
      );
    });
  });

  // ── enableBucketQuota / disableBucketQuota ────────────────────

  describe('enableBucketQuota', () => {
    it('sends PUT with quotaType=bucket and enabled=true', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.enableBucketQuota('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: { uid: 'alice', quota: '', quotaType: 'bucket', enabled: true },
      });
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(quota.enableBucketQuota('')).rejects.toThrow(RGWValidationError);
    });
  });

  describe('disableBucketQuota', () => {
    it('sends PUT with quotaType=bucket and enabled=false', async () => {
      client.request.mockResolvedValue(undefined);

      await quota.disableBucketQuota('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: { uid: 'alice', quota: '', quotaType: 'bucket', enabled: false },
      });
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(quota.disableBucketQuota('')).rejects.toThrow(RGWValidationError);
    });
  });
});
