import { describe, it, expect } from 'vitest';
import {
  RGWError,
  RGWNotFoundError,
  RGWValidationError,
  RGWAuthError,
  RGWConflictError,
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
  it('has 404 status and descriptive message', () => {
    const err = new RGWNotFoundError('User', 'alice');
    expect(err.name).toBe('RGWNotFoundError');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('User not found: "alice"');
  });

  it('is an instance of RGWError', () => {
    expect(new RGWNotFoundError('User', 'alice')).toBeInstanceOf(RGWError);
  });
});

describe('RGWValidationError', () => {
  it('has no status code', () => {
    const err = new RGWValidationError('uid cannot be empty');
    expect(err.name).toBe('RGWValidationError');
    expect(err.statusCode).toBeUndefined();
    expect(err.code).toBe('ValidationError');
  });
});

describe('RGWAuthError', () => {
  it('has 403 status', () => {
    const err = new RGWAuthError('Access denied');
    expect(err.name).toBe('RGWAuthError');
    expect(err.statusCode).toBe(403);
  });
});

describe('RGWConflictError', () => {
  it('has 409 status', () => {
    const err = new RGWConflictError('User', 'alice');
    expect(err.name).toBe('RGWConflictError');
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('User already exists: "alice"');
  });
});
