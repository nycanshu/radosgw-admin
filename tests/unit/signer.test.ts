import { describe, it, expect } from 'vitest';
import { signRequest } from '../../src/signer.js';

describe('signRequest', () => {
  const fixedDate = new Date('2025-01-15T12:00:00.000Z');

  const baseRequest = {
    method: 'GET',
    url: new URL('http://localhost:8080/admin/user'),
    headers: {} as Record<string, string>,
    accessKey: 'TESTKEY',
    secretKey: 'TESTSECRET',
    region: 'us-east-1',
  };

  it('returns Authorization, x-amz-date, and x-amz-content-sha256 headers', () => {
    const result = signRequest(baseRequest, fixedDate);

    expect(result).toHaveProperty('Authorization');
    expect(result).toHaveProperty('x-amz-date');
    expect(result).toHaveProperty('x-amz-content-sha256');
  });

  it('Authorization header starts with AWS4-HMAC-SHA256', () => {
    const result = signRequest(baseRequest, fixedDate);
    expect(result.Authorization).toMatch(/^AWS4-HMAC-SHA256 /);
  });

  it('includes access key in Credential', () => {
    const result = signRequest(baseRequest, fixedDate);
    expect(result.Authorization).toContain('Credential=TESTKEY/');
  });

  it('includes date stamp in Credential', () => {
    const result = signRequest(baseRequest, fixedDate);
    expect(result.Authorization).toContain('20250115/us-east-1/s3/aws4_request');
  });

  it('x-amz-date matches the provided date', () => {
    const result = signRequest(baseRequest, fixedDate);
    expect(result['x-amz-date']).toBe('20250115T120000Z');
  });

  it('produces different signatures for different secrets', () => {
    const result1 = signRequest(baseRequest, fixedDate);
    const result2 = signRequest({ ...baseRequest, secretKey: 'DIFFERENT' }, fixedDate);
    expect(result1.Authorization).not.toBe(result2.Authorization);
  });

  it('produces different signatures for different methods', () => {
    const result1 = signRequest(baseRequest, fixedDate);
    const result2 = signRequest({ ...baseRequest, method: 'PUT' }, fixedDate);
    expect(result1.Authorization).not.toBe(result2.Authorization);
  });

  it('handles query parameters in the URL', () => {
    const url = new URL('http://localhost:8080/admin/user?uid=alice&format=json');
    const result = signRequest({ ...baseRequest, url }, fixedDate);
    expect(result.Authorization).toBeDefined();
  });
});
