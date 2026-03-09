import type { BaseClient } from '../client.js';
import { RGWValidationError } from '../errors.js';
import { validateUid } from '../validators.js';
import type { RGWKey } from '../types/user.types.js';
import type { CreateKeyInput, DeleteKeyInput } from '../types/key.types.js';

/**
 * Key management module — create and delete S3/Swift access keys.
 *
 * @example
 * ```typescript
 * // Generate a new key pair for a user
 * const keys = await client.keys.create({ uid: 'alice' });
 * console.log(keys[0].accessKey, keys[0].secretKey);
 *
 * // Delete a specific key
 * await client.keys.delete({ accessKey: 'OLDKEY123' });
 * ```
 */
export class KeysModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * Create a new S3 or Swift key for a user.
   *
   * @param input - Key creation parameters. `uid` is required.
   * @returns Array of keys belonging to the user after creation.
   * @throws {RGWValidationError} If `uid` is missing or invalid.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * // Auto-generate a new S3 key
   * const keys = await client.keys.create({ uid: 'alice' });
   * console.log('New key:', keys[0].accessKey);
   *
   * // Create with specific credentials
   * const keys = await client.keys.create({
   *   uid: 'alice',
   *   accessKey: 'MY_ACCESS_KEY',
   *   secretKey: 'MY_SECRET_KEY',
   *   generateKey: false,
   * });
   * ```
   */
  async create(input: CreateKeyInput): Promise<RGWKey[]> {
    validateUid(input.uid);

    return this.client.request<RGWKey[]>({
      method: 'PUT',
      path: '/user',
      query: {
        key: '',
        uid: input.uid,
        keyType: input.keyType,
        accessKey: input.accessKey,
        secretKey: input.secretKey,
        generateKey: input.generateKey,
      },
    });
  }

  /**
   * Delete an S3 or Swift key.
   *
   * @param input - `accessKey` is required. `uid` is required for Swift keys.
   * @throws {RGWValidationError} If `accessKey` is missing.
   * @throws {RGWNotFoundError} If the key does not exist.
   *
   * @example
   * ```typescript
   * // Delete an S3 key by access key ID
   * await client.keys.delete({ accessKey: 'OLDKEY123' });
   *
   * // Delete a Swift key (uid required)
   * await client.keys.delete({
   *   accessKey: 'SWIFTKEY',
   *   uid: 'alice',
   *   keyType: 'swift',
   * });
   * ```
   */
  async delete(input: DeleteKeyInput): Promise<void> {
    if (
      !input.accessKey ||
      typeof input.accessKey !== 'string' ||
      input.accessKey.trim().length === 0
    ) {
      throw new RGWValidationError('accessKey is required and must be a non-empty string');
    }

    return this.client.request<void>({
      method: 'DELETE',
      path: '/user',
      query: {
        key: '',
        accessKey: input.accessKey,
        uid: input.uid,
        keyType: input.keyType,
      },
    });
  }
}
