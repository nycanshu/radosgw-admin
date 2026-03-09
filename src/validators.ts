import { RGWValidationError } from './errors.js';

/**
 * Validates that a uid is a non-empty string with no leading/trailing whitespace.
 *
 * @throws {RGWValidationError} If uid is empty, not a string, or has leading/trailing whitespace.
 */
export function validateUid(uid: string): void {
  if (!uid || typeof uid !== 'string' || uid.trim() !== uid || uid.trim().length === 0) {
    throw new RGWValidationError(
      'uid is required and must be a non-empty string without leading/trailing whitespace',
    );
  }
}

/**
 * Validates that a uid does not contain colons.
 * Colons are reserved for subuser notation (e.g. "uid:subuser").
 *
 * @throws {RGWValidationError} If uid contains a colon.
 */
export function validateUidNoColon(uid: string): void {
  validateUid(uid);
  if (uid.includes(':')) {
    throw new RGWValidationError(
      'uid must not contain colons — colons are reserved for subuser notation (e.g. "uid:subuser")',
    );
  }
}
