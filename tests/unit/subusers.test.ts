import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubusersModule } from '../../src/modules/subusers.js';
import { RGWValidationError } from '../../src/errors.js';
import type { BaseClient } from '../../src/client.js';
import type { RGWSubuser } from '../../src/types/user.types.js';

const mockSubusers: RGWSubuser[] = [{ id: 'alice:swift', permissions: 'readwrite' }];

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as BaseClient & { request: ReturnType<typeof vi.fn> };
}

describe('SubusersModule', () => {
  let client: ReturnType<typeof createMockClient>;
  let subusers: SubusersModule;

  beforeEach(() => {
    client = createMockClient();
    subusers = new SubusersModule(client);
  });

  // ── create ──────────────────────────────────────────────

  describe('create', () => {
    it('sends PUT /user with subuser param', async () => {
      client.request.mockResolvedValue(mockSubusers);

      const result = await subusers.create({
        uid: 'alice',
        subuser: 'alice:swift',
        access: 'readwrite',
        keyType: 'swift',
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: expect.objectContaining({
          uid: 'alice',
          subuser: 'alice:swift',
          access: 'readwrite',
          keyType: 'swift',
        }),
      });
      expect(result[0].id).toBe('alice:swift');
      expect(result[0].permissions).toBe('readwrite');
    });

    it('passes all optional fields when provided', async () => {
      client.request.mockResolvedValue(mockSubusers);

      await subusers.create({
        uid: 'alice',
        subuser: 'alice:swift',
        secretKey: 'MYSECRET',
        keyType: 'swift',
        access: 'full',
        generateSecret: false,
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'PUT',
        path: '/user',
        query: {
          uid: 'alice',
          subuser: 'alice:swift',
          secretKey: 'MYSECRET',
          keyType: 'swift',
          access: 'full',
          generateSecret: false,
        },
      });
    });

    it('sends optional fields as undefined when not provided', async () => {
      client.request.mockResolvedValue(mockSubusers);

      await subusers.create({ uid: 'alice', subuser: 'alice:swift' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.secretKey).toBeUndefined();
      expect(call.query.keyType).toBeUndefined();
      expect(call.query.access).toBeUndefined();
      expect(call.query.generateSecret).toBeUndefined();
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(subusers.create({ uid: '', subuser: 'alice:swift' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when uid has leading whitespace', async () => {
      await expect(subusers.create({ uid: '  alice', subuser: 'alice:swift' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when subuser is empty', async () => {
      await expect(subusers.create({ uid: 'alice', subuser: '' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when subuser is whitespace-only', async () => {
      await expect(subusers.create({ uid: 'alice', subuser: '   ' })).rejects.toThrow(
        RGWValidationError,
      );
    });
  });

  // ── modify ──────────────────────────────────────────────

  describe('modify', () => {
    it('sends POST /user with subuser param', async () => {
      client.request.mockResolvedValue(mockSubusers);

      const result = await subusers.modify({
        uid: 'alice',
        subuser: 'alice:swift',
        access: 'full',
      });

      expect(client.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/user',
        query: expect.objectContaining({
          uid: 'alice',
          subuser: 'alice:swift',
          access: 'full',
        }),
      });
      expect(result[0].id).toBe('alice:swift');
    });

    it('sends only provided optional fields', async () => {
      client.request.mockResolvedValue(mockSubusers);

      await subusers.modify({ uid: 'alice', subuser: 'alice:swift', access: 'read' });

      const call = client.request.mock.calls[0]![0] as { query: Record<string, unknown> };
      expect(call.query.access).toBe('read');
      expect(call.query.secretKey).toBeUndefined();
      expect(call.query.keyType).toBeUndefined();
      expect(call.query.generateSecret).toBeUndefined();
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(subusers.modify({ uid: '', subuser: 'alice:swift' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when subuser is empty', async () => {
      await expect(subusers.modify({ uid: 'alice', subuser: '' })).rejects.toThrow(
        RGWValidationError,
      );
    });
  });

  // ── delete ──────────────────────────────────────────────

  describe('delete', () => {
    it('sends DELETE /user with subuser param', async () => {
      client.request.mockResolvedValue(undefined);

      await subusers.delete({ uid: 'alice', subuser: 'alice:swift' });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/user',
        query: {
          uid: 'alice',
          subuser: 'alice:swift',
          purgeKeys: undefined,
        },
      });
    });

    it('sends purgeKeys when false', async () => {
      client.request.mockResolvedValue(undefined);

      await subusers.delete({ uid: 'alice', subuser: 'alice:swift', purgeKeys: false });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/user',
        query: {
          uid: 'alice',
          subuser: 'alice:swift',
          purgeKeys: false,
        },
      });
    });

    it('sends purgeKeys when true', async () => {
      client.request.mockResolvedValue(undefined);

      await subusers.delete({ uid: 'alice', subuser: 'alice:swift', purgeKeys: true });

      expect(client.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/user',
        query: {
          uid: 'alice',
          subuser: 'alice:swift',
          purgeKeys: true,
        },
      });
    });

    it('throws RGWValidationError when uid is empty', async () => {
      await expect(subusers.delete({ uid: '', subuser: 'alice:swift' })).rejects.toThrow(
        RGWValidationError,
      );
    });

    it('throws RGWValidationError when subuser is empty', async () => {
      await expect(subusers.delete({ uid: 'alice', subuser: '' })).rejects.toThrow(
        RGWValidationError,
      );
    });
  });
});
