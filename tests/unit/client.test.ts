import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toCamelCase, BaseClient } from '../../src/client.js';
import { RadosGWAdminClient, RGWValidationError, RGWError } from '../../src/index.js';

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

  it('accepts new config options without error', () => {
    const client = new RadosGWAdminClient({
      ...validConfig,
      debug: true,
      maxRetries: 3,
      retryDelay: 500,
      insecure: true,
    });
    expect(client).toBeInstanceOf(RadosGWAdminClient);
  });
});

describe('BaseClient retry logic', () => {
  const config = {
    host: 'http://localhost',
    accessKey: 'testkey',
    secretKey: 'testsecret',
    maxRetries: 2,
    retryDelay: 10,
  };

  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('succeeds on first attempt without retries', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"user_id":"alice"}'),
    });

    const client = new BaseClient(config);
    const result = await client.request<{ userId: string }>({
      method: 'GET',
      path: '/user',
    });

    expect(result).toEqual({ userId: 'alice' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 errors and succeeds', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"status":"ok"}'),
      });

    const client = new BaseClient(config);
    const result = await client.request<{ status: string }>({
      method: 'GET',
      path: '/user',
    });

    expect(result).toEqual({ status: 'ok' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 404 errors', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('{"Code":"NoSuchUser"}'),
    });

    const client = new BaseClient(config);
    await expect(client.request({ method: 'GET', path: '/user' })).rejects.toThrow('not found');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 400 errors', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request'),
    });

    const client = new BaseClient(config);
    await expect(client.request({ method: 'GET', path: '/user' })).rejects.toThrow(
      RGWValidationError,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting all retries on 500', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const client = new BaseClient(config);
    await expect(client.request({ method: 'GET', path: '/user' })).rejects.toThrow(RGWError);
    expect(fetchSpy).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('retries on network errors (ECONNREFUSED)', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:8080'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"ok":true}'),
      });

    const client = new BaseClient(config);
    const result = await client.request<{ ok: boolean }>({
      method: 'GET',
      path: '/user',
    });

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not retry when maxRetries is 0', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const client = new BaseClient({
      ...config,
      maxRetries: 0,
    });
    await expect(client.request({ method: 'GET', path: '/user' })).rejects.toThrow(RGWError);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('BaseClient debug logging', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs request and response when debug is true', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"user_id":"alice"}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      debug: true,
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(debugSpy).toHaveBeenCalledWith(
      '[radosgw-admin]',
      'request',
      expect.stringContaining('"method"'),
    );
    expect(debugSpy).toHaveBeenCalledWith(
      '[radosgw-admin]',
      'response',
      expect.stringContaining('"status"'),
    );
  });

  it('does not log when debug is false', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"user_id":"alice"}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      debug: false,
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(debugSpy).not.toHaveBeenCalled();
  });
});

describe('BaseClient insecure TLS', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  });

  it('sets NODE_TLS_REJECT_UNAUTHORIZED=0 during request when insecure', async () => {
    let tlsValueDuringFetch: string | undefined;
    fetchSpy.mockImplementationOnce(() => {
      tlsValueDuringFetch = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
      });
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      insecure: true,
      debug: true,
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(tlsValueDuringFetch).toBe('0');
    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
  });

  it('does not modify NODE_TLS_REJECT_UNAUTHORIZED when insecure is false', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      insecure: false,
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
  });

  it('restores previous NODE_TLS_REJECT_UNAUTHORIZED value after request', async () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      insecure: true,
      debug: true,
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe('1');
  });
});
