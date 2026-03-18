import { describe, it, expect } from 'vitest';
import {
  RGWError,
  RGWNotFoundError,
  RGWValidationError,
  RGWAuthError,
  RGWConflictError,
  RGWRateLimitError,
  RGWServiceError,
} from '../../src/errors.js';

describe('RGWError', () => {
  it('has correct name and message', () => {
    const err = new RGWError('test error', 500, 'InternalError');
    expect(err.name).toBe('RGWError');
    expect(err.message).toBe('test error');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('InternalError');
  });

  it('is an instance of Error', () => {
    const err = new RGWError('test');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('RGWNotFoundError', () => {
  it('has 404 status and preserves RGW code', () => {
    const err = new RGWNotFoundError('No user found', 'NoSuchUser');
    expect(err.name).toBe('RGWNotFoundError');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NoSuchUser');
    expect(err.message).toBe('No user found');
  });

  it('defaults code to NoSuchResource when not provided', () => {
    const err = new RGWNotFoundError('Resource not found');
    expect(err.code).toBe('NoSuchResource');
  });

  it('defaults message when empty', () => {
    const err = new RGWNotFoundError('');
    expect(err.message).toBe('Resource not found');
  });

  it('is an instance of RGWError', () => {
    expect(new RGWNotFoundError('not found')).toBeInstanceOf(RGWError);
  });
});

describe('RGWValidationError', () => {
  it('has no status code for client-side validation', () => {
    const err = new RGWValidationError('uid cannot be empty');
    expect(err.name).toBe('RGWValidationError');
    expect(err.statusCode).toBeUndefined();
    expect(err.code).toBe('ValidationError');
  });

  it('preserves status code and RGW code for HTTP 400 responses', () => {
    const err = new RGWValidationError('Bad value for max-buckets', 400, 'InvalidArgument');
    expect(err.name).toBe('RGWValidationError');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('InvalidArgument');
  });

  it('defaults code to ValidationError when not provided with status', () => {
    const err = new RGWValidationError('Bad request', 400);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('ValidationError');
  });
});

describe('RGWAuthError', () => {
  it('has 403 status and preserves RGW code', () => {
    const err = new RGWAuthError('Access denied', 'InvalidAccessKeyId');
    expect(err.name).toBe('RGWAuthError');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('InvalidAccessKeyId');
  });

  it('defaults code to AccessDenied when not provided', () => {
    const err = new RGWAuthError('Forbidden');
    expect(err.code).toBe('AccessDenied');
  });
});

describe('RGWConflictError', () => {
  it('has 409 status and preserves RGW code', () => {
    const err = new RGWConflictError('User already exists', 'UserAlreadyExists');
    expect(err.name).toBe('RGWConflictError');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('UserAlreadyExists');
  });

  it('defaults code to AlreadyExists when not provided', () => {
    const err = new RGWConflictError('Conflict');
    expect(err.code).toBe('AlreadyExists');
  });
});

describe('RGWRateLimitError', () => {
  it('has 429 status and preserves RGW code', () => {
    const err = new RGWRateLimitError('Too many requests', 'SlowDown');
    expect(err.name).toBe('RGWRateLimitError');
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('SlowDown');
  });

  it('defaults code to TooManyRequests when not provided', () => {
    const err = new RGWRateLimitError('Rate limit hit');
    expect(err.code).toBe('TooManyRequests');
  });

  it('defaults message when empty', () => {
    const err = new RGWRateLimitError('');
    expect(err.message).toContain('Rate limit exceeded');
  });

  it('is an instance of RGWError', () => {
    expect(new RGWRateLimitError('throttled')).toBeInstanceOf(RGWError);
  });
});

describe('RGWServiceError', () => {
  it('has correct status for 500', () => {
    const err = new RGWServiceError('Internal Server Error', 500, 'InternalError');
    expect(err.name).toBe('RGWServiceError');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('InternalError');
  });

  it('has correct status for 503', () => {
    const err = new RGWServiceError('Service Unavailable', 503, 'ServiceUnavailable');
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('ServiceUnavailable');
  });

  it('defaults message when empty', () => {
    const err = new RGWServiceError('', 502);
    expect(err.message).toBe('RGW server error (HTTP 502)');
  });

  it('is an instance of RGWError', () => {
    expect(new RGWServiceError('error', 500)).toBeInstanceOf(RGWError);
  });
});
