import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersModule } from '../../src/modules/users.js';
import { RGWValidationError } from '../../src/errors.js';
import type { BaseClient } from '../../src/client.js';
import type { RGWUser, RGWUserWithStats } from '../../src/types/user.types.js';

const mockUser: RGWUser = {
  userId: 'alice',
  displayName: 'Alice Example',
  email: 'alice@example.com',
  suspended: 0,
  maxBuckets: 1000,
  subusers: [],
  keys: [{ user: 'alice', accessKey: 'TESTKEY', secretKey: 'TESTSECRET' }],
  swiftKeys: [],
  caps: [],
  opMask: 'read, write, delete',
  defaultPlacement: '',
  defaultStorageClass: '',
  placementTags: [],
  tenant: '',
  bucketQuota: { enabled: false, checkOnRaw: false, maxSize: -1, maxSizeKb: 0, maxObjects: -1 },
  userQuota: { enabled: false, checkOnRaw: false, maxSize: -1, maxSizeKb: 0, maxObjects: -1 },
};

const mockUserWithStats: RGWUserWithStats = {
  ...mockUser,
  stats: {
    size: 1024,
    sizeActual: 4096,
    sizeUtilized: 1024,
    sizeKb: 1,
    sizeKbActual: 4,
    sizeKbUtilized: 1,
    numObjects: 5,
  },
};

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as BaseClient & { request: ReturnType<typeof vi.fn> };
}

describe('UsersModule', () => {
  let client: ReturnType<typeof createMockClient>;
  let users: UsersModule;

  beforeEach(() => {
    client = createMockClient();
    users = new UsersModule(client);
  });

  // ── create ──────────────────────────────────────────────

  describe('create', () => {
    it('sends PUT /user with correct params', async () => {
      client.request.mockResolvedValue(mockUser);

      const result = await users.create({
        uid: 'alice',
        displayName: 'Alice Example',
        email: 'alice@example.com',
        maxBuckets: 100,
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: expect.objectContaining({
          uid: 'alice',
          displayName: 'Alice Example',
          email: 'alice@example.com',
          maxBuckets: 100,
        }),
      });
      expect(result.userId).toBe('alice');
    });

    it('sends all optional fields when provided', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.create({
        uid: 'alice',
        displayName: 'Alice',
        email: 'alice@example.com',
        keyType: 's3',
        accessKey: 'MYKEY',
        secretKey: 'MYSECRET',
        userCaps: 'users=*;buckets=read',
        generateKey: false,
        maxBuckets: 50,
        suspended: false,
        tenant: 'acme',
        opMask: 'read, write',
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: {
          uid: 'alice',
          displayName: 'Alice',
          email: 'alice@example.com',
          keyType: 's3',
          accessKey: 'MYKEY',
          secretKey: 'MYSECRET',
          userCaps: 'users=*;buckets=read',
          generateKey: false,
          maxBuckets: 50,
          suspended: false,
          tenant: 'acme',
          opMask: 'read, write',
        },
      });
    });

    it('sends optional fields as undefined when not provided', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.create({ uid: 'alice', displayName: 'Alice' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.email).toBeUndefined();
      expect(call.query.tenant).toBeUndefined();
      expect(call.query.keyType).toBeUndefined();
      expect(call.query.opMask).toBeUndefined();
    });

    it('passes generateKey=true correctly', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.create({ uid: 'alice', displayName: 'Alice', generateKey: true });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.generateKey).toBe(true);
    });

    it('passes tenant field correctly', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.create({ uid: 'alice', displayName: 'Alice', tenant: 'acme' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.tenant).toBe('acme');
    });

    it('passes userCaps field correctly', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.create({ uid: 'alice', displayName: 'Alice', userCaps: 'users=*' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.userCaps).toBe('users=*');
    });

    it('passes opMask field correctly', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.create({ uid: 'alice', displayName: 'Alice', opMask: 'read' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.opMask).toBe('read');
    });

    // ── uid validation ──

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(users.create({ uid: '', displayName: 'Test' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when uid has leading whitespace', async () => {
      await expect(users.create({ uid: '  alice', displayName: 'Test' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when uid has trailing whitespace', async () => {
      await expect(users.create({ uid: 'alice  ', displayName: 'Test' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when uid contains a colon', async () => {
      await expect(users.create({ uid: 'alice:subuser', displayName: 'Test' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError with colon message', async () => {
      await expect(users.create({ uid: 'alice:swift', displayName: 'Test' })).rejects.toThrow(
        /colon/,
      );
    });

    // ── displayName validation ──

    it('throws RGWValidationError when displayName is empty', async () => {
      await expect(users.create({ uid: 'alice', displayName: '' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when displayName is whitespace-only', async () => {
      await expect(users.create({ uid: 'alice', displayName: '   ' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when displayName has leading whitespace', async () => {
      await expect(users.create({ uid: 'alice', displayName: '  Alice' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when displayName has trailing whitespace', async () => {
      await expect(users.create({ uid: 'alice', displayName: 'Alice  ' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    // ── email validation ──

    it('throws RGWValidationError for invalid email', async () => {
      await expect(
        users.create({ uid: 'alice', displayName: 'Alice', email: 'not-an-email' }),
      ).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError for email without domain', async () => {
      await expect(
        users.create({ uid: 'alice', displayName: 'Alice', email: 'alice@' }),
      ).rejects.toThrow(RGWValidationError);
    });

    it('accepts a valid email', async () => {
      client.request.mockResolvedValue(mockUser);
      await expect(
        users.create({ uid: 'alice', displayName: 'Alice', email: 'alice@example.com' }),
      ).resolves.toBeDefined();
    });

    // ── userCaps validation ──

    it('throws RGWValidationError for invalid userCaps format', async () => {
      await expect(
        users.create({ uid: 'alice', displayName: 'Alice', userCaps: 'invalid' }),
      ).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError for empty userCaps string', async () => {
      await expect(
        users.create({ uid: 'alice', displayName: 'Alice', userCaps: '' }),
      ).rejects.toThrow(RGWValidationError);
    });

    it('accepts valid single-cap userCaps', async () => {
      client.request.mockResolvedValue(mockUser);
      await expect(
        users.create({ uid: 'alice', displayName: 'Alice', userCaps: 'users=*' }),
      ).resolves.toBeDefined();
    });

    it('accepts valid multi-cap userCaps', async () => {
      client.request.mockResolvedValue(mockUser);
      await expect(
        users.create({ uid: 'alice', displayName: 'Alice', userCaps: 'users=read;buckets=write' }),
      ).resolves.toBeDefined();
    });

    it('accepts userCaps with read, write perm', async () => {
      client.request.mockResolvedValue(mockUser);
      await expect(
        users.create({ uid: 'alice', displayName: 'Alice', userCaps: 'buckets=read, write' }),
      ).resolves.toBeDefined();
    });
  });

  // ── get ─────────────────────────────────────────────────

  describe('get', () => {
    it('sends GET /user with uid', async () => {
      client.request.mockResolvedValue(mockUser);

      const result = await users.get('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user',
        query: { uid: 'alice' },
      });
      expect(result.displayName).toBe('Alice Example');
      expect(result.keys).toHaveLength(1);
      expect(result.suspended).toBe(0);
    });

    it('prefixes uid with tenant when tenant is provided', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.get('alice', 'acme');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user',
        query: { uid: 'acme$alice' },
      });
    });

    it('does not modify uid when tenant is omitted', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.get('alice');

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.uid).toBe('alice');
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(users.get('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── getByAccessKey ───────────────────────────────────────

  describe('getByAccessKey', () => {
    it('sends GET /user with access-key query param', async () => {
      client.request.mockResolvedValue(mockUser);

      const result = await users.getByAccessKey('AKIAIOSFODNN7EXAMPLE');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user',
        query: { accessKey: 'AKIAIOSFODNN7EXAMPLE' },
      });
      expect(result.userId).toBe('alice');
    });

    it('throws RGWValidationError when accessKey is empty', async () => {
      await expect(users.getByAccessKey('')).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when accessKey is whitespace-only', async () => {
      await expect(users.getByAccessKey('   ')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── modify ──────────────────────────────────────────────

  describe('modify', () => {
    it('sends POST /user with correct params', async () => {
      const updatedUser = { ...mockUser, displayName: 'Alice Updated', maxBuckets: 200 };
      client.request.mockResolvedValue(updatedUser);

      const result = await users.modify({
        uid: 'alice',
        displayName: 'Alice Updated',
        maxBuckets: 200,
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/user',
        query: expect.objectContaining({
          uid: 'alice',
          displayName: 'Alice Updated',
          maxBuckets: 200,
        }),
      });
      expect(result.displayName).toBe('Alice Updated');
    });

    it('sends only provided optional fields', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.modify({ uid: 'alice', email: 'new@example.com' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.email).toBe('new@example.com');
      expect(call.query.displayName).toBeUndefined();
      expect(call.query.maxBuckets).toBeUndefined();
    });

    it('sends suspended=true when provided', async () => {
      client.request.mockResolvedValue({ ...mockUser, suspended: 1 });

      await users.modify({ uid: 'alice', suspended: true });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.suspended).toBe(true);
    });

    it('sends opMask when provided', async () => {
      client.request.mockResolvedValue(mockUser);

      await users.modify({ uid: 'alice', opMask: 'read' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.opMask).toBe('read');
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(users.modify({ uid: '' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError for invalid email in modify', async () => {
      await expect(users.modify({ uid: 'alice', email: 'bad' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError for invalid userCaps in modify', async () => {
      await expect(users.modify({ uid: 'alice', userCaps: 'badformat' })).rejects.toThrow(
        RGWValidationError,
      );
    });
  });

  // ── delete ──────────────────────────────────────────────

  describe('delete', () => {
    it('sends DELETE /user with uid', async () => {
      client.request.mockResolvedValue(undefined);

      await users.delete({ uid: 'alice' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/user',
        query: { uid: 'alice', purgeData: undefined },
      });
    });

    it('sends purgeData when true', async () => {
      client.request.mockResolvedValue(undefined);

      await users.delete({ uid: 'alice', purgeData: true });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/user',
        query: { uid: 'alice', purgeData: true },
      });
    });

    it('emits console.warn when purgeData is true', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      client.request.mockResolvedValue(undefined);

      await users.delete({ uid: 'alice', purgeData: true });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('purgeData=true'));
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"alice"'));
      warnSpy.mockRestore();
    });

    it('does not emit console.warn when purgeData is false', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      client.request.mockResolvedValue(undefined);

      await users.delete({ uid: 'alice', purgeData: false });

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('does not emit console.warn when purgeData is undefined', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      client.request.mockResolvedValue(undefined);

      await users.delete({ uid: 'alice' });

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(users.delete({ uid: '' })).rejects.toThrow(RGWValidationError);
    });
  });

  // ── list ────────────────────────────────────────────────

  describe('list', () => {
    it('sends GET /metadata/user and returns uid array', async () => {
      client.request.mockResolvedValue(['alice', 'bob', 'charlie']);

      const result = await users.list();

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/metadata/user',
      });
      expect(result).toEqual(['alice', 'bob', 'charlie']);
    });

    it('returns empty array when no users exist', async () => {
      client.request.mockResolvedValue([]);
      expect(await users.list()).toEqual([]);
    });

    it('handles tenant-prefixed uids', async () => {
      client.request.mockResolvedValue(['acme$alice', 'acme$bob']);
      const result = await users.list();
      expect(result).toContain('acme$alice');
    });
  });

  // ── suspend ─────────────────────────────────────────────

  describe('suspend', () => {
    it('sends POST /user with suspended=true', async () => {
      const suspendedUser = { ...mockUser, suspended: 1 };
      client.request.mockResolvedValue(suspendedUser);

      const result = await users.suspend('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/user',
        query: { uid: 'alice', suspended: true },
      });
      expect(result.suspended).toBe(1);
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(users.suspend('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── enable ──────────────────────────────────────────────

  describe('enable', () => {
    it('sends POST /user with suspended=false', async () => {
      client.request.mockResolvedValue(mockUser);

      const result = await users.enable('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/user',
        query: { uid: 'alice', suspended: false },
      });
      expect(result.suspended).toBe(0);
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(users.enable('')).rejects.toThrow(RGWValidationError);
    });
  });

  // ── getStats ────────────────────────────────────────────

  describe('getStats', () => {
    it('sends GET /user with stats=true and no sync flag by default', async () => {
      client.request.mockResolvedValue(mockUserWithStats);

      const result = await users.getStats('alice');

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user',
        query: { uid: 'alice', stats: true, sync: undefined },
      });
      expect(result.stats.numObjects).toBe(5);
      expect(result.userId).toBe('alice');
    });

    it('sends sync=true when requested', async () => {
      client.request.mockResolvedValue(mockUserWithStats);

      await users.getStats('alice', true);

      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user',
        query: { uid: 'alice', stats: true, sync: true },
      });
    });

    it('sends sync=false when explicitly passed', async () => {
      client.request.mockResolvedValue(mockUserWithStats);

      await users.getStats('alice', false);

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.sync).toBe(false);
    });

    it('returns both user fields and stats', async () => {
      client.request.mockResolvedValue(mockUserWithStats);

      const result = await users.getStats('alice');

      expect(result.userId).toBe('alice');
      expect(result.displayName).toBe('Alice Example');
      expect(result.stats.size).toBe(1024);
      expect(result.stats.sizeKb).toBe(1);
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(users.getStats('')).rejects.toThrow(RGWValidationError);
    });
  });
});
