import type { BaseClient } from '../client.js';
import { RGWValidationError } from '../errors.js';
import { validateUid } from '../validators.js';
import type { RGWKey } from '../types/user.types.js';
import type { CreateKeyInput, DeleteKeyInput } from '../types/key.types.js';

/**
 * Key management module — generate and revoke S3/Swift access keys.
 *
 * @example
 * ```typescript
 * // Generate a new key pair for a user
 * const keys = await client.keys.generate({ uid: 'alice' });
 * console.log(keys[0].accessKey, keys[0].secretKey);
 *
 * // Revoke a specific key
 * await client.keys.revoke({ accessKey: 'OLDKEY123' });
 * ```
 */
export class KeysModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * Generate a new S3 or Swift key for a user.
   *
   * Returns the user's **entire** key list after the operation, not just the
   * newly created key. To identify the new key, compare with the key list
   * before generation or look for the last entry.
   *
   * @param input - Key generation parameters. `uid` is required.
   * @returns Array of **all** keys belonging to the user after generation.
   * @throws {RGWValidationError} If `uid` is missing or invalid.
   * @throws {RGWNotFoundError} If the user does not exist.
   *
   * @example
   * ```typescript
   * // Auto-generate a new S3 key
   * const allKeys = await client.keys.generate({ uid: 'alice' });
   * const newKey = allKeys[allKeys.length - 1]; // newest key is last
   * console.log('New key:', newKey.accessKey);
   *
   * // Supply specific credentials (disable auto-generation)
   * const allKeys = await client.keys.generate({
   *   uid: 'alice',
   *   accessKey: 'MY_ACCESS_KEY',
   *   secretKey: 'MY_SECRET_KEY',
   *   generateKey: false,
   * });
   * ```
   */
  async generate(input: CreateKeyInput): Promise<RGWKey[]> {
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
   * Revoke an S3 or Swift key.
   *
   * @param input - `accessKey` is required. `uid` is required for Swift keys.
   * @returns Resolves when the key has been revoked.
   * @throws {RGWValidationError} If `accessKey` is missing.
   * @throws {RGWNotFoundError} If the key does not exist.
   *
   * @example
   * ```typescript
   * // Revoke an S3 key by access key ID
   * await client.keys.revoke({ accessKey: 'OLDKEY123' });
   *
   * // Revoke a Swift key (uid required)
   * await client.keys.revoke({
   *   accessKey: 'SWIFTKEY',
   *   uid: 'alice',
   *   keyType: 'swift',
   * });
   * ```
   */
  async revoke(input: DeleteKeyInput): Promise<void> {
    if (
      !input.accessKey ||
      typeof input.accessKey !== 'string' ||
      input.accessKey.trim().length === 0
    ) {
      throw new RGWValidationError('accessKey is required and must be a non-empty string');
    }

    if (input.keyType === 'swift' && !input.uid) {
      throw new RGWValidationError('uid is required when revoking a Swift key (keyType: "swift")');
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
