import { describe, it, expect } from 'vitest';
import { toCamelCase } from '../../src/client.js';
import { RadosGWAdminClient, RGWValidationError } from '../../src/index.js';

describe('toCamelCase', () => {
  it('converts snake_case keys to camelCase', () => {
    const input = { user_id: 'alice', display_name: 'Alice' };
    expect(toCamelCase(input)).toEqual({ userId: 'alice', displayName: 'Alice' });
  });

  it('handles nested objects', () => {
    const input = { bucket_quota: { max_size: 1024, max_objects: 100 } };
    expect(toCamelCase(input)).toEqual({ bucketQuota: { maxSize: 1024, maxObjects: 100 } });
  });

  it('handles arrays', () => {
    const input = [{ access_key: 'key1' }, { access_key: 'key2' }];
    expect(toCamelCase(input)).toEqual([{ accessKey: 'key1' }, { accessKey: 'key2' }]);
  });

  it('handles null and primitives', () => {
    expect(toCamelCase(null)).toBeNull();
    expect(toCamelCase(42)).toBe(42);
    expect(toCamelCase('hello')).toBe('hello');
    expect(toCamelCase(true)).toBe(true);
  });

  it('handles empty object', () => {
    expect(toCamelCase({})).toEqual({});
  });

  it('leaves already camelCase keys unchanged', () => {
    const input = { userId: 'alice' };
    expect(toCamelCase(input)).toEqual({ userId: 'alice' });
  });

  it('converts kebab-case keys to camelCase', () => {
    const input = { 'display-name': 'Alice', 'max-buckets': 100 };
    expect(toCamelCase(input)).toEqual({ displayName: 'Alice', maxBuckets: 100 });
  });

  it('converts dot-separated keys to camelCase', () => {
    const input = {
      usage: {
        'rgw.main': { size: 1024, num_objects: 5 },
        'rgw.multimeta': { size: 0, num_objects: 0 },
      },
    };
    expect(toCamelCase(input)).toEqual({
      usage: {
        rgwMain: { size: 1024, numObjects: 5 },
        rgwMultimeta: { size: 0, numObjects: 0 },
      },
    });
  });
});

describe('RadosGWAdminClient constructor', () => {
  const validConfig = {
    host: 'http://localhost',
    accessKey: 'testkey',
    secretKey: 'testsecret',
  };

  it('creates client with valid config', () => {
    const client = new RadosGWAdminClient(validConfig);
    expect(client).toBeInstanceOf(RadosGWAdminClient);
  });

  it('throws RGWValidationError when host is empty', () => {
    expect(() => new RadosGWAdminClient({ ...validConfig, host: '' })).toThrow(RGWValidationError);
  });

  it('throws RGWValidationError when accessKey is empty', () => {
    expect(() => new RadosGWAdminClient({ ...validConfig, accessKey: '' })).toThrow(
      RGWValidationError,
    );
  });

  it('throws RGWValidationError when secretKey is empty', () => {
    expect(() => new RadosGWAdminClient({ ...validConfig, secretKey: '' })).toThrow(
      RGWValidationError,
    );
  });
});
