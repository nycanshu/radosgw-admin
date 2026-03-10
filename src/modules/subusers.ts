import type { BaseClient } from '../client.js';
import { RGWValidationError } from '../errors.js';
import { validateUid } from '../validators.js';
import type { RGWSubuser } from '../types/user.types.js';
import type {
  CreateSubuserInput,
  ModifySubuserInput,
  DeleteSubuserInput,
} from '../types/key.types.js';

/**
 * Validates that a subuser ID is a non-empty string.
 */
function validateSubuser(subuser: string): void {
  if (!subuser || typeof subuser !== 'string' || subuser.trim().length === 0) {
    throw new RGWValidationError('subuser is required and must be a non-empty string');
  }
}

/**
 * Subuser management module — create, modify, and remove subusers with Swift keys.
 *
 * @example
 * ```typescript
 * // Create a subuser with Swift access
 * const subusers = await client.subusers.create({
 *   uid: 'alice',
 *   subuser: 'alice:swift',
 *   access: 'readwrite',
 *   keyType: 'swift',
 * });
 * ```
 */
export class SubusersModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * Create a new subuser for a user.
   *
   * @param input - Subuser creation parameters. `uid` and `subuser` are required.
   * @returns Array of subusers belonging to the user after creation.
   * @throws {RGWValidationError} If `uid` or `subuser` is missing or invalid.
   * @throws {RGWNotFoundError} If the parent user does not exist.
   *
   * @example
   * ```typescript
   * const subusers = await client.subusers.create({
   *   uid: 'alice',
   *   subuser: 'alice:swift',
   *   access: 'readwrite',
   *   keyType: 'swift',
   *   generateSecret: true,
   * });
   * console.log(subusers[0].id, subusers[0].permissions);
   * ```
   */
  async create(input: CreateSubuserInput): Promise<RGWSubuser[]> {
    validateUid(input.uid);
    validateSubuser(input.subuser);

    return this.client.request<RGWSubuser[]>({
      method: 'PUT',
      path: '/user',
      query: {
        subuser: input.subuser,
        uid: input.uid,
        secretKey: input.secretKey,
        keyType: input.keyType,
        access: input.access,
        generateSecret: input.generateSecret,
      },
    });
  }

  /**
   * Modify an existing subuser's properties.
   *
   * @param input - Properties to update. `uid` and `subuser` are required.
   * @returns Array of subusers belonging to the user after modification.
   * @throws {RGWValidationError} If `uid` or `subuser` is missing or invalid.
   * @throws {RGWNotFoundError} If the parent user or subuser does not exist.
   *
   * @example
   * ```typescript
   * const subusers = await client.subusers.modify({
   *   uid: 'alice',
   *   subuser: 'alice:swift',
   *   access: 'full',
   * });
   * ```
   */
  async modify(input: ModifySubuserInput): Promise<RGWSubuser[]> {
    validateUid(input.uid);
    validateSubuser(input.subuser);

    return this.client.request<RGWSubuser[]>({
      method: 'POST',
      path: '/user',
      query: {
        subuser: input.subuser,
        uid: input.uid,
        secretKey: input.secretKey,
        keyType: input.keyType,
        access: input.access,
        generateSecret: input.generateSecret,
      },
    });
  }

  /**
   * Remove a subuser from a user. Optionally purge the subuser's keys.
   *
   * @param input - `uid` and `subuser` are required. `purgeKeys` defaults to true.
   * @throws {RGWValidationError} If `uid` or `subuser` is missing or invalid.
   * @throws {RGWNotFoundError} If the parent user or subuser does not exist.
   *
   * @example
   * ```typescript
   * // Remove subuser and purge keys
   * await client.subusers.remove({
   *   uid: 'alice',
   *   subuser: 'alice:swift',
   * });
   *
   * // Remove subuser but keep keys
   * await client.subusers.remove({
   *   uid: 'alice',
   *   subuser: 'alice:swift',
   *   purgeKeys: false,
   * });
   * ```
   */
  async remove(input: DeleteSubuserInput): Promise<void> {
    validateUid(input.uid);
    validateSubuser(input.subuser);

    return this.client.request<void>({
      method: 'DELETE',
      path: '/user',
      query: {
        subuser: input.subuser,
        uid: input.uid,
        purgeKeys: input.purgeKeys,
      },
    });
  }
}
