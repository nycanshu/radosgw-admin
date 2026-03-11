import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageModule } from '../../src/modules/usage.js';
import { RGWValidationError } from '../../src/errors.js';
import type { BaseClient } from '../../src/client.js';
import type { RGWUsageReport } from '../../src/types/usage.types.js';

const mockReport: RGWUsageReport = {
  entries: [
    {
      user: 'alice',
      buckets: [
        {
          bucket: 'my-bucket',
          time: '2025-01-01 00:00:00',
          epoch: 1735689600,
          owner: 'alice',
          categories: [
            {
              category: 'get_obj',
              bytesSent: 1048576,
              bytesReceived: 0,
              ops: 10,
              successfulOps: 10,
            },
          ],
        },
      ],
    },
  ],
  summary: [
    {
      user: 'alice',
      categories: [
        {
          category: 'get_obj',
          bytesSent: 1048576,
          bytesReceived: 0,
          ops: 10,
          successfulOps: 10,
        },
      ],
      total: {
        bytesSent: 1048576,
        bytesReceived: 0,
        ops: 10,
        successfulOps: 10,
      },
    },
  ],
};

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as BaseClient & { request: ReturnType<typeof vi.fn> };
}

describe('UsageModule', () => {
  let client: ReturnType<typeof createMockClient>;
  let usage: UsageModule;

  beforeEach(() => {
    client = createMockClient();
    usage = new UsageModule(client);
  });

  // ── get ──────────────────────────────────────────────────

  describe('get', () => {
    it('sends GET /usage with no query params when called with no args', async () => {
      client.request.mockResolvedValue(mockReport);

      const result = await usage.get();

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/usage',
        query: {
          uid: undefined,
          start: undefined,
          end: undefined,
          showEntries: undefined,
          showSummary: undefined,
        },
      });
      expect(result.entries).toHaveLength(1);
      expect(result.summary).toHaveLength(1);
    });

    it('sends uid and date range when provided', async () => {
      client.request.mockResolvedValue(mockReport);

      await usage.get({ uid: 'alice', start: '2025-01-01', end: '2025-01-31' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/usage',
        query: {
          uid: 'alice',
          start: '2025-01-01',
          end: '2025-01-31',
          showEntries: undefined,
          showSummary: undefined,
        },
      });
    });

    it('normalizes Date objects to YYYY-MM-DD strings', async () => {
      client.request.mockResolvedValue(mockReport);

      await usage.get({
        start: new Date('2025-01-01T00:00:00Z'),
        end: new Date('2025-01-31T00:00:00Z'),
      });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.start).toBe('2025-01-01');
      expect(call.query.end).toBe('2025-01-31');
    });

    it('accepts datetime strings', async () => {
      client.request.mockResolvedValue(mockReport);

      await usage.get({ start: '2025-01-01 00:00:00', end: '2025-01-31 23:59:59' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.start).toBe('2025-01-01 00:00:00');
      expect(call.query.end).toBe('2025-01-31 23:59:59');
    });

    it('passes showEntries and showSummary flags', async () => {
      client.request.mockResolvedValue(mockReport);

      await usage.get({ showEntries: false, showSummary: true });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.showEntries).toBe(false);
      expect(call.query.showSummary).toBe(true);
    });

    it('throws RGWValidationError for invalid date string', async () => {
      await expect(usage.get({ start: 'not-a-date' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError for invalid Date object', async () => {
      await expect(usage.get({ start: new Date('invalid') })).rejects.toThrow(RGWValidationError);
    });
  });

  // ── trim ─────────────────────────────────────────────────

  describe('trim', () => {
    it('trims usage for a specific user without removeAll', async () => {
      client.request.mockResolvedValue(undefined);

      await usage.trim({ uid: 'alice', end: '2024-12-31' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/usage',
        query: {
          uid: 'alice',
          start: undefined,
          end: '2024-12-31',
          removeAll: undefined,
        },
      });
    });

    it('trims cluster-wide when removeAll is true', async () => {
      client.request.mockResolvedValue(undefined);

      await usage.trim({ end: '2024-12-31', removeAll: true });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/usage',
        query: {
          uid: undefined,
          start: undefined,
          end: '2024-12-31',
          removeAll: true,
        },
      });
    });

    it('throws RGWValidationError when no uid and removeAll is not true', async () => {
      await expect(usage.trim({ end: '2024-12-31' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when called with empty object (no uid, no removeAll)', async () => {
      await expect(usage.trim({})).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when called with no args (no uid, no removeAll)', async () => {
      await expect(usage.trim()).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError for invalid date string', async () => {
      await expect(usage.trim({ uid: 'alice', start: 'bad-date' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('emits console.warn for removeAll=true with uid', async () => {
      client.request.mockResolvedValue(undefined);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await usage.trim({ uid: 'alice', removeAll: true });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WARNING'));
      warnSpy.mockRestore();
    });

    it('emits console.warn for cluster-wide removeAll=true', async () => {
      client.request.mockResolvedValue(undefined);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await usage.trim({ removeAll: true });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ALL users'));
      warnSpy.mockRestore();
    });

    it('normalizes Date objects in trim', async () => {
      client.request.mockResolvedValue(undefined);

      await usage.trim({ uid: 'alice', end: new Date('2024-12-31T00:00:00Z') });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.end).toBe('2024-12-31');
    });
  });
});
