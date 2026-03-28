import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toCamelCase, BaseClient } from '../../src/client.js';
import {
  RadosGWAdminClient,
  RGWValidationError,
  RGWError,
  RGWNotFoundError,
  RGWRateLimitError,
  RGWServiceError,
  RGWAuthError,
  RGWConflictError,
} from '../../src/index.js';
import type { BeforeRequestHook, AfterResponseHook } from '../../src/index.js';

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

  it('throws RGWValidationError when port is out of range', () => {
    expect(() => new RadosGWAdminClient({ ...validConfig, port: 0 })).toThrow(RGWValidationError);
    expect(() => new RadosGWAdminClient({ ...validConfig, port: 70000 })).toThrow(
      RGWValidationError,
    );
    expect(() => new RadosGWAdminClient({ ...validConfig, port: 3.5 })).toThrow(RGWValidationError);
  });

  it('throws RGWValidationError when timeout is negative', () => {
    expect(() => new RadosGWAdminClient({ ...validConfig, timeout: -1 })).toThrow(
      RGWValidationError,
    );
  });

  it('throws RGWValidationError when maxRetries is invalid', () => {
    expect(() => new RadosGWAdminClient({ ...validConfig, maxRetries: -1 })).toThrow(
      RGWValidationError,
    );
    expect(() => new RadosGWAdminClient({ ...validConfig, maxRetries: 1.5 })).toThrow(
      RGWValidationError,
    );
  });

  it('throws RGWValidationError when retryDelay is negative', () => {
    expect(() => new RadosGWAdminClient({ ...validConfig, retryDelay: -100 })).toThrow(
      RGWValidationError,
    );
  });

  it('accepts valid optional config values', () => {
    const client = new RadosGWAdminClient({
      ...validConfig,
      port: 8080,
      timeout: 0,
      maxRetries: 0,
      retryDelay: 0,
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
    await expect(client.request({ method: 'GET', path: '/user' })).rejects.toThrow(
      RGWNotFoundError,
    );
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

  it('retries on DNS resolution failure (ENOTFOUND)', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND example.invalid'))
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
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('never touches NODE_TLS_REJECT_UNAUTHORIZED when insecure: true', async () => {
    const touched: boolean[] = [];
    fetchSpy.mockImplementation(() => {
      touched.push(process.env.NODE_TLS_REJECT_UNAUTHORIZED !== undefined);
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
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
    expect(touched).toEqual([false]);
  });

  it('passes dispatcher to fetch when insecure: true', async () => {
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      insecure: true,
    });
    await client.request({ method: 'GET', path: '/user' });

    const [, fetchInit] = fetchSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(fetchInit['dispatcher']).toBeDefined();
  });

  it('does not pass dispatcher to fetch when insecure: false', async () => {
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      insecure: false,
    });
    await client.request({ method: 'GET', path: '/user' });

    const [, fetchInit] = fetchSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(fetchInit['dispatcher']).toBeUndefined();
  });

  it('concurrent insecure + secure requests do not share TLS state', async () => {
    const envSnapshots: Array<string | undefined> = [];

    fetchSpy.mockImplementation(() => {
      envSnapshots.push(process.env.NODE_TLS_REJECT_UNAUTHORIZED);
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{}'),
      });
    });

    const insecureClient = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      insecure: true,
    });
    const secureClient = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      insecure: false,
    });

    await Promise.all([
      insecureClient.request({ method: 'GET', path: '/user' }),
      secureClient.request({ method: 'GET', path: '/user' }),
    ]);

    expect(envSnapshots.every((v) => v === undefined)).toBe(true);
  });
});

describe('BaseClient User-Agent header', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends default User-Agent header', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });
    await client.request({ method: 'GET', path: '/user' });

    const callHeaders = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(callHeaders['User-Agent']).toMatch(/^radosgw-admin\/.*node\//);
  });

  it('sends custom User-Agent when configured', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      userAgent: 'my-app/1.0',
    });
    await client.request({ method: 'GET', path: '/user' });

    const callHeaders = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(callHeaders['User-Agent']).toBe('my-app/1.0');
  });
});

describe('BaseClient request body', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serialises body as JSON when body is provided', async () => {
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    await client.request({ method: 'PUT', path: '/user', body: { displayName: 'Alice' } });

    const [, fetchInit] = fetchSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(fetchInit['body']).toBe(JSON.stringify({ displayName: 'Alice' }));
  });

  it('does not set body when body is not provided', async () => {
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    await client.request({ method: 'GET', path: '/user' });

    const [, fetchInit] = fetchSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(fetchInit['body']).toBeUndefined();
  });
});

describe('BaseClient request/response hooks', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onBeforeRequest hook with correct context', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"ok":true}'),
    });

    const beforeHook: BeforeRequestHook = vi.fn();
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      onBeforeRequest: [beforeHook],
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(beforeHook).toHaveBeenCalledTimes(1);
    expect(beforeHook).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/user',
        attempt: 0,
      }),
    );
  });

  it('calls onAfterResponse hook with status and duration', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"ok":true}'),
    });

    const afterHook: AfterResponseHook = vi.fn();
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      onAfterResponse: [afterHook],
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(afterHook).toHaveBeenCalledTimes(1);
    expect(afterHook).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/user',
        status: 200,
        durationMs: expect.any(Number),
      }),
    );
  });

  it('calls onAfterResponse with error on HTTP failure', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('{"Code":"NoSuchUser"}'),
    });

    const afterHook: AfterResponseHook = vi.fn();
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      onAfterResponse: [afterHook],
    });

    await expect(client.request({ method: 'GET', path: '/user' })).rejects.toThrow();

    expect(afterHook).toHaveBeenCalledTimes(1);
    expect(afterHook).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        error: expect.any(Error),
      }),
    );
  });

  it('calls onAfterResponse with error on network failure', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

    const afterHook: AfterResponseHook = vi.fn();
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      onAfterResponse: [afterHook],
    });

    await expect(client.request({ method: 'GET', path: '/user' })).rejects.toThrow();

    expect(afterHook).toHaveBeenCalledTimes(1);
    expect(afterHook).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
      }),
    );
  });

  it('does not break request when hook throws', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"ok":true}'),
    });

    const brokenHook: BeforeRequestHook = () => {
      throw new Error('hook exploded');
    };
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      onBeforeRequest: [brokenHook],
    });

    const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/user' });
    expect(result).toEqual({ ok: true });
  });

  it('does not break request when afterResponse hook throws', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"ok":true}'),
    });

    const brokenAfterHook: AfterResponseHook = async () => {
      throw new Error('after hook exploded');
    };
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      onAfterResponse: [brokenAfterHook],
    });

    const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/user' });
    expect(result).toEqual({ ok: true });
  });

  it('hook context includes url and startTime', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    const beforeHook: BeforeRequestHook = vi.fn();
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      onBeforeRequest: [beforeHook],
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(beforeHook).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/admin/user'),
        startTime: expect.any(Number),
      }),
    );
  });

  it('hooks fire on each retry attempt', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('error'),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"ok":true}'),
      });

    const beforeHook: BeforeRequestHook = vi.fn();
    const afterHook: AfterResponseHook = vi.fn();
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      maxRetries: 1,
      retryDelay: 1,
      onBeforeRequest: [beforeHook],
      onAfterResponse: [afterHook],
    });
    await client.request({ method: 'GET', path: '/user' });

    // before hook: attempt 0 + attempt 1
    expect(beforeHook).toHaveBeenCalledTimes(2);
    expect(beforeHook).toHaveBeenNthCalledWith(1, expect.objectContaining({ attempt: 0 }));
    expect(beforeHook).toHaveBeenNthCalledWith(2, expect.objectContaining({ attempt: 1 }));

    // after hook: 500 error on attempt 0 + 200 success on attempt 1
    expect(afterHook).toHaveBeenCalledTimes(2);
    expect(afterHook).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ status: 500, error: expect.any(Error) }),
    );
    expect(afterHook).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: 200 }));
  });

  it('runs multiple hooks in order', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    });

    const order: number[] = [];
    const hook1: BeforeRequestHook = () => {
      order.push(1);
    };
    const hook2: BeforeRequestHook = () => {
      order.push(2);
    };

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      onBeforeRequest: [hook1, hook2],
    });
    await client.request({ method: 'GET', path: '/user' });

    expect(order).toEqual([1, 2]);
  });
});

describe('BaseClient AbortSignal support', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aborts request when external signal is triggered', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    fetchSpy.mockRejectedValueOnce(abortError);

    const controller = new AbortController();
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    controller.abort();
    await expect(
      client.request({ method: 'GET', path: '/user', signal: controller.signal }),
    ).rejects.toThrow(RGWError);
  });

  it('aborts request when signal is triggered during fetch', async () => {
    const controller = new AbortController();

    // Simulate fetch that takes time, then gets aborted
    fetchSpy.mockImplementationOnce(() => {
      controller.abort();
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      return Promise.reject(abortError);
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    await expect(
      client.request({ method: 'GET', path: '/user', signal: controller.signal }),
    ).rejects.toThrow(RGWError);
  });

  it('passes combined signal to fetch (not the external one directly)', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"ok":true}'),
    });

    const controller = new AbortController();
    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    await client.request({ method: 'GET', path: '/user', signal: controller.signal });

    // The signal passed to fetch should NOT be the external signal directly
    // (it's an internal AbortController that combines timeout + external)
    const fetchSignal = fetchSpy.mock.calls[0][1].signal as AbortSignal;
    expect(fetchSignal).not.toBe(controller.signal);
    expect(fetchSignal.aborted).toBe(false);
  });

  it('works normally when no external signal is provided', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"ok":true}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/user' });
    expect(result).toEqual({ ok: true });
  });
});

describe('RadosGWAdminClient healthCheck', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when RGW responds successfully', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{"info":{"storage_backends":[]},"fsid":"test-fsid"}'),
    });

    const client = new RadosGWAdminClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    expect(await client.healthCheck()).toBe(true);
  });

  it('returns false when RGW is unreachable', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

    const client = new RadosGWAdminClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    expect(await client.healthCheck()).toBe(false);
  });

  it('returns false when RGW returns an error', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Access denied'),
    });

    const client = new RadosGWAdminClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    expect(await client.healthCheck()).toBe(false);
  });
});

describe('BaseClient retry jitter', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds jitter to retry backoff (not always the same delay)', async () => {
    // Track delay calls to verify jitter adds randomness
    const mathRandomSpy = vi.spyOn(Math, 'random');
    mathRandomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.8);

    fetchSpy
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('error'),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('error'),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"ok":true}'),
      });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      maxRetries: 2,
      retryDelay: 10,
    });

    const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/user' });
    expect(result).toEqual({ ok: true });
    expect(mathRandomSpy).toHaveBeenCalled();
  });
});

describe('BaseClient error mapping', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps 404 with RGW Code to RGWNotFoundError with correct code', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('{"Code":"NoSuchUser","Message":"No user found"}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    try {
      await client.request({ method: 'GET', path: '/user' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RGWNotFoundError);
      expect((err as RGWNotFoundError).code).toBe('NoSuchUser');
      expect((err as RGWNotFoundError).message).toBe('No user found');
      expect((err as RGWNotFoundError).statusCode).toBe(404);
    }
  });

  it('maps 403 with RGW Code to RGWAuthError with correct code', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () =>
        Promise.resolve('{"Code":"InvalidAccessKeyId","Message":"The access key does not exist"}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    try {
      await client.request({ method: 'GET', path: '/user' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RGWAuthError);
      expect((err as RGWAuthError).code).toBe('InvalidAccessKeyId');
      expect((err as RGWAuthError).message).toBe('The access key does not exist');
    }
  });

  it('maps 409 with RGW Code to RGWConflictError with correct code', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: () => Promise.resolve('{"Code":"UserAlreadyExists","Message":"User already exists"}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    try {
      await client.request({ method: 'GET', path: '/user' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RGWConflictError);
      expect((err as RGWConflictError).code).toBe('UserAlreadyExists');
    }
  });

  it('maps 429 to RGWRateLimitError', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve('{"Code":"SlowDown","Message":"Rate limit exceeded"}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    try {
      await client.request({ method: 'GET', path: '/user' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RGWRateLimitError);
      expect((err as RGWRateLimitError).statusCode).toBe(429);
      expect((err as RGWRateLimitError).code).toBe('SlowDown');
      expect((err as RGWRateLimitError).message).toBe('Rate limit exceeded');
    }
  });

  it('maps 500 to RGWServiceError', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('{"Code":"InternalError","Message":"Internal server error"}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    try {
      await client.request({ method: 'GET', path: '/user' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RGWServiceError);
      expect((err as RGWServiceError).statusCode).toBe(500);
      expect((err as RGWServiceError).code).toBe('InternalError');
    }
  });

  it('maps 503 to RGWServiceError', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: () => Promise.resolve('Service Unavailable'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    try {
      await client.request({ method: 'GET', path: '/user' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RGWServiceError);
      expect((err as RGWServiceError).statusCode).toBe(503);
    }
  });

  it('falls back to Code when Message is absent', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('{"Code":"NoSuchBucket"}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    try {
      await client.request({ method: 'GET', path: '/bucket' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RGWNotFoundError);
      expect((err as RGWNotFoundError).code).toBe('NoSuchBucket');
      expect((err as RGWNotFoundError).message).toBe('NoSuchBucket');
    }
  });

  it('handles non-JSON error body gracefully', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Bad Gateway'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
    });

    try {
      await client.request({ method: 'GET', path: '/user' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RGWServiceError);
      expect((err as RGWServiceError).message).toBe('Bad Gateway');
    }
  });

  it('retries on 429 errors', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('{"Code":"SlowDown"}'),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"ok":true}'),
      });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      maxRetries: 1,
      retryDelay: 1,
    });

    const result = await client.request<{ ok: boolean }>({ method: 'GET', path: '/user' });
    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 429 when maxRetries is 0', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve('{"Code":"SlowDown"}'),
    });

    const client = new BaseClient({
      host: 'http://localhost',
      accessKey: 'testkey',
      secretKey: 'testsecret',
      maxRetries: 0,
    });

    await expect(client.request({ method: 'GET', path: '/user' })).rejects.toThrow(
      RGWRateLimitError,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
