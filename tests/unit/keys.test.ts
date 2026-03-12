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

  // ── generate ──────────────────────────────────────────────

  describe('generate', () => {
    it('sends PUT /user?key with uid', async () => {
      client.request.mockResolvedValue(mockKeys);

      const result = await keys.generate({ uid: 'alice' });

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

      await keys.generate({
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

      await keys.generate({ uid: 'alice' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.keyType).toBeUndefined();
      expect(call.query.accessKey).toBeUndefined();
      expect(call.query.secretKey).toBeUndefined();
      expect(call.query.generateKey).toBeUndefined();
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(keys.generate({ uid: '' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when uid has leading whitespace', async () => {
      await expect(keys.generate({ uid: '  alice' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when uid has trailing whitespace', async () => {
      await expect(keys.generate({ uid: 'alice  ' })).rejects.toThrow(RGWValidationError);
    });

    it('passes keyType swift correctly', async () => {
      client.request.mockResolvedValue(mockKeys);

      await keys.generate({ uid: 'alice', keyType: 'swift' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.keyType).toBe('swift');
    });

    it('passes generateKey=true explicitly', async () => {
      client.request.mockResolvedValue(mockKeys);

      await keys.generate({ uid: 'alice', generateKey: true });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.generateKey).toBe(true);
    });

    it('returns all user keys after generation', async () => {
      const threeKeys: RGWKey[] = [
        { user: 'alice', accessKey: 'KEY1', secretKey: 'SECRET1' },
        { user: 'alice', accessKey: 'KEY2', secretKey: 'SECRET2' },
        { user: 'alice', accessKey: 'KEY3', secretKey: 'SECRET3' },
      ];
      client.request.mockResolvedValue(threeKeys);

      const result = await keys.generate({ uid: 'alice' });
      expect(result).toHaveLength(3);
      expect(result[2].accessKey).toBe('KEY3');
    });
  });

  // ── revoke ──────────────────────────────────────────────

  describe('revoke', () => {
    it('sends DELETE /user?key with accessKey', async () => {
      client.request.mockResolvedValue(undefined);

      await keys.revoke({ accessKey: 'KEY1' });

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

      await keys.revoke({ accessKey: 'SWIFTKEY', uid: 'alice', keyType: 'swift' });

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
      await expect(keys.revoke({ accessKey: '' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when accessKey is whitespace-only', async () => {
      await expect(keys.revoke({ accessKey: '   ' })).rejects.toThrow(RGWValidationError);
    });

    it('throws RGWValidationError when swift key revoked without uid', async () => {
      await expect(keys.revoke({ accessKey: 'SWIFTKEY', keyType: 'swift' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError with descriptive swift message', async () => {
      await expect(keys.revoke({ accessKey: 'SWIFTKEY', keyType: 'swift' })).rejects.toThrow(
        /uid is required.*swift/i,
      );
    });

    it('does not require uid for s3 key revocation', async () => {
      client.request.mockResolvedValue(undefined);

      await expect(keys.revoke({ accessKey: 'S3KEY', keyType: 's3' })).resolves.toBeUndefined();
    });

    it('sends optional fields as undefined when not provided', async () => {
      client.request.mockResolvedValue(undefined);

      await keys.revoke({ accessKey: 'KEY1' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.uid).toBeUndefined();
      expect(call.query.keyType).toBeUndefined();
    });
  });
});
