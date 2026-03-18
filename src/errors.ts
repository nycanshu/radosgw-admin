/**
 * Base error class for all RGW Admin API errors.
 *
 * Every error includes:
 * - `statusCode` — HTTP status (undefined for client-side validation errors)
 * - `code` — RGW error code from the response body (e.g. `NoSuchUser`, `BucketAlreadyExists`)
 *
 * @example
 * ```typescript
 * try {
 *   await rgw.users.get('alice');
 * } catch (err) {
 *   if (err instanceof RGWError) {
 *     console.log(err.statusCode); // 404
 *     console.log(err.code);       // "NoSuchUser"
 *     console.log(err.message);    // "No user found with the given UID"
 *   }
 * }
 * ```
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
 * Thrown when a requested resource (user, bucket, key, subuser) does not exist.
 *
 * Common RGW codes: `NoSuchUser`, `NoSuchBucket`, `NoSuchKey`, `NoSuchSubUser`
 *
 * @example
 * ```typescript
 * catch (err) {
 *   if (err instanceof RGWNotFoundError) {
 *     console.log(err.code); // "NoSuchUser"
 *   }
 * }
 * ```
 */
export class RGWNotFoundError extends RGWError {
  constructor(message: string, code?: string) {
    super(message || 'Resource not found', 404, code ?? 'NoSuchResource');
    this.name = 'RGWNotFoundError';
  }
}

/**
 * Thrown when input validation fails before making an HTTP request.
 * No HTTP call is made — the error is thrown client-side.
 */
export class RGWValidationError extends RGWError {
  constructor(message: string, statusCode?: number, code?: string) {
    super(message, statusCode, code ?? 'ValidationError');
    this.name = 'RGWValidationError';
  }
}

/**
 * Thrown on 403 Access Denied responses.
 * Usually means the admin user lacks the required capabilities.
 *
 * Common RGW codes: `AccessDenied`, `InvalidAccessKeyId`, `SignatureDoesNotMatch`
 */
export class RGWAuthError extends RGWError {
  constructor(message: string, code?: string) {
    super(
      message || 'Access denied. Check your admin credentials and user capabilities.',
      403,
      code ?? 'AccessDenied',
    );
    this.name = 'RGWAuthError';
  }
}

/**
 * Thrown when a resource already exists (409 Conflict).
 *
 * Common RGW codes: `UserAlreadyExists`, `BucketAlreadyExists`, `KeyExists`, `EmailExists`
 */
export class RGWConflictError extends RGWError {
  constructor(message: string, code?: string) {
    super(message || 'Resource already exists', 409, code ?? 'AlreadyExists');
    this.name = 'RGWConflictError';
  }
}

/**
 * Thrown when the RGW rate limit is exceeded (429 Too Many Requests).
 * This error is retryable — the SDK will automatically retry with backoff
 * when `maxRetries > 0`.
 *
 * Common RGW codes: `TooManyRequests`, `SlowDown`
 */
export class RGWRateLimitError extends RGWError {
  constructor(message: string, code?: string) {
    super(
      message || 'Rate limit exceeded. Reduce request frequency or increase rate limits.',
      429,
      code ?? 'TooManyRequests',
    );
    this.name = 'RGWRateLimitError';
  }
}

/**
 * Thrown on 5xx server errors from the RGW.
 * These are retryable — the SDK will automatically retry with backoff
 * when `maxRetries > 0`.
 *
 * Common RGW codes: `InternalError`, `ServiceUnavailable`
 */
export class RGWServiceError extends RGWError {
  constructor(message: string, statusCode: number, code?: string) {
    super(message || `RGW server error (HTTP ${statusCode})`, statusCode, code);
    this.name = 'RGWServiceError';
  }
}
