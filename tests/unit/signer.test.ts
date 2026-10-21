import { createHash, createHmac } from 'node:crypto';
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

/**
 * Independent SigV4 reference: signs a hand-written canonical query string, so each
 * test pins the exact canonical form RGW expects rather than re-deriving it.
 */
function expectedAuthorization(path: string, canonicalQuery: string): string {
  const amzDate = '20250115T120000Z';
  const scope = '20250115/us-east-1/s3/aws4_request';
  const canonicalRequest = [
    'GET',
    path,
    canonicalQuery,
    `host:localhost:8080\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`,
    'host;x-amz-content-sha256;x-amz-date',
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');
  let key: Buffer | string = 'AWS4TESTSECRET';
  for (const part of ['20250115', 'us-east-1', 's3', 'aws4_request']) {
    key = createHmac('sha256', key).update(part).digest();
  }
  const signature = createHmac('sha256', key).update(stringToSign).digest('hex');
  return `AWS4-HMAC-SHA256 Credential=TESTKEY/${scope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`;
}

describe('signRequest canonical query string (SigV4 UriEncode)', () => {
  const fixedDate = new Date('2025-01-15T12:00:00.000Z');

  function signQuery(params: [string, string][]): string {
    const url = new URL('http://localhost:8080/admin/user');
    for (const [k, v] of params) url.searchParams.append(k, v);
    return signRequest(
      {
        method: 'GET',
        url,
        headers: {},
        accessKey: 'TESTKEY',
        secretKey: 'TESTSECRET',
        region: 'us-east-1',
      },
      fixedDate,
    ).Authorization!;
  }

  it('matches the reference signature for a plain query', () => {
    const auth = signQuery([
      ['uid', 'alice'],
      ['format', 'json'],
    ]);
    expect(auth).toBe(expectedAuthorization('/admin/user', 'format=json&uid=alice'));
  });

  it.each([
    ['!', '%21'],
    ["'", '%27'],
    ['(', '%28'],
    [')', '%29'],
    ['*', '%2A'],
  ])('percent-encodes reserved character %s as %s', (char, encoded) => {
    const auth = signQuery([['display-name', `smoke ${char}`]]);
    expect(auth).toBe(expectedAuthorization('/admin/user', `display-name=smoke%20${encoded}`));
  });

  it('encodes a realistic display name with parentheses (issue #83)', () => {
    const auth = signQuery([
      ['uid', 'some-user'],
      ['display-name', 'Backup (prod)'],
    ]);
    expect(auth).toBe(
      expectedAuthorization('/admin/user', 'display-name=Backup%20%28prod%29&uid=some-user'),
    );
  });

  it('encodes reserved characters in parameter names', () => {
    const auth = signQuery([['a*b', 'x']]);
    expect(auth).toBe(expectedAuthorization('/admin/user', 'a%2Ab=x'));
  });

  it('leaves unreserved characters - _ . ~ unescaped', () => {
    const auth = signQuery([['k', 'a-b_c.d~e']]);
    expect(auth).toBe(expectedAuthorization('/admin/user', 'k=a-b_c.d~e'));
  });

  it('encodes spaces as %20 and other reserved characters with uppercase hex', () => {
    const auth = signQuery([['k', 'a b+c/d=e&f']]);
    expect(auth).toBe(expectedAuthorization('/admin/user', 'k=a%20b%2Bc%2Fd%3De%26f'));
  });

  it('encodes non-ASCII characters as UTF-8 percent-escapes', () => {
    const auth = signQuery([['k', 'Šťastný']]);
    expect(auth).toBe(expectedAuthorization('/admin/user', 'k=%C5%A0%C5%A5astn%C3%BD'));
  });

  it('sorts parameter names by byte order, not locale order', () => {
    const auth = signQuery([
      ['a', '1'],
      ['_', '2'],
      ['A', '3'],
    ]);
    expect(auth).toBe(expectedAuthorization('/admin/user', 'A=3&_=2&a=1'));
  });

  it('sorts by encoded name rather than raw name', () => {
    // Raw 'é' sorts after 'a', but its encoded form '%C3%A9' sorts before it.
    const auth = signQuery([
      ['a', '1'],
      ['é', '2'],
    ]);
    expect(auth).toBe(expectedAuthorization('/admin/user', '%C3%A9=2&a=1'));
  });

  it('sorts duplicate parameter names by encoded value', () => {
    const auth = signQuery([
      ['k', 'b'],
      ['k', 'B'],
      ['k', '(a'],
    ]);
    expect(auth).toBe(expectedAuthorization('/admin/user', 'k=%28a&k=B&k=b'));
  });
});
