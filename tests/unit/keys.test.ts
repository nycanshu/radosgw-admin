import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeysModule } from '../../src/modules/keys.js';
import { RGWValidationError } from '../../src/errors.js';
import type { BaseClient } from '../../src/client.js';
import type { RGWKey } from '../../src/types/user.types.js';

const mockKeys: RGWKey[] = [
  { user: 'alice', accessKey: 'KEY1', secretKey: 'SECRET1' },
  { user: 'alice', accessKey: 'KEY2', secretKey: 'SECRET2' },
];

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as BaseClient & { request: ReturnType<typeof vi.fn> };
}

describe('KeysModule', () => {
  let client: ReturnType<typeof createMockClient>;
  let keys: KeysModule;

  beforeEach(() => {
    client = createMockClient();
    keys = new KeysModule(client);
  });

  // ── create ──────────────────────────────────────────────

  describe('create', () => {
    it('sends PUT /user?key with uid', async () => {
      client.request.mockResolvedValue(mockKeys);

      const result = await keys.create({ uid: 'alice' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: expect.objectContaining({
          key: '',
          uid: 'alice',
        }),
      });
      expect(result).toHaveLength(2);
      expect(result[0].accessKey).toBe('KEY1');
    });

    it('passes all optional fields when provided', async () => {
      client.request.mockResolvedValue(mockKeys);

      await keys.create({
        uid: 'alice',
        keyType: 's3',
        accessKey: 'MYKEY',
        secretKey: 'MYSECRET',
        generateKey: false,
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: {
          key: '',
          uid: 'alice',
          keyType: 's3',
          accessKey: 'MYKEY',
          secretKey: 'MYSECRET',
          generateKey: false,
        },
      });
    });

    it('sends optional fields as undefined when not provided', async () => {
      client.request.mockResolvedValue(mockKeys);

      await keys.create({ uid: 'alice' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.keyType).toBeUndefined();
      expect(call.query.accessKey).toBeUndefined();
      expect(call.query.secretKey).toBeUndefined();
      expect(call.query.generateKey).toBeUndefined();
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(keys.create({ uid: '' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when uid has leading whitespace', async () => {
      await expect(keys.create({ uid: '  alice' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when uid has trailing whitespace', async () => {
      await expect(keys.create({ uid: 'alice  ' })).rejects.toThrow(RGWValidationError);
    });
  });

  // ── delete ──────────────────────────────────────────────

  describe('delete', () => {
    it('sends DELETE /user?key with accessKey', async () => {
      client.request.mockResolvedValue(undefined);

      await keys.delete({ accessKey: 'KEY1' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/user',
        query: expect.objectContaining({
          key: '',
          accessKey: 'KEY1',
        }),
      });
    });

    it('sends uid and keyType for Swift keys', async () => {
      client.request.mockResolvedValue(undefined);

      await keys.delete({ accessKey: 'SWIFTKEY', uid: 'alice', keyType: 'swift' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/user',
        query: {
          key: '',
          accessKey: 'SWIFTKEY',
          uid: 'alice',
          keyType: 'swift',
        },
      });
    });

    it('throws RGWValidationError when accessKey is empty', async () => {
      await expect(keys.delete({ accessKey: '' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when accessKey is whitespace-only', async () => {
      await expect(keys.delete({ accessKey: '   ' })).rejects.toThrow(RGWValidationError);
    });
  });
});
