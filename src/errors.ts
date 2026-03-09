/**
 * Base error class for all RGW Admin API errors.
 */
export class RGWError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
    public readonly uid?: string,
  ) {
    super(message);
    this.name = 'RGWError';
  }
}

/**
 * Thrown when a requested resource (user, bucket, key) does not exist.
 */
export class RGWNotFoundError extends RGWError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: "${id}"`, 404, 'NoSuchResource');
    this.name = 'RGWNotFoundError';
  }
}

/**
 * Thrown when input validation fails before making an HTTP request.
 */
export class RGWValidationError extends RGWError {
  constructor(message: string) {
    super(message, undefined, 'ValidationError');
    this.name = 'RGWValidationError';
  }
}

/**
 * Thrown on 403 Access Denied responses.
 */
export class RGWAuthError extends RGWError {
  constructor(message: string) {
    super(message, 403, 'AccessDenied');
    this.name = 'RGWAuthError';
  }
}

/**
 * Thrown when a resource already exists (409 Conflict).
 */
export class RGWConflictError extends RGWError {
  constructor(resource: string, id: string) {
    super(`${resource} already exists: "${id}"`, 409, 'AlreadyExists');
    this.name = 'RGWConflictError';
  }
}
