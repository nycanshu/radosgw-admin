/**
 * Integration Test: Client Features
 *
 * Tests client-level features against a live RGW server:
 * - Retry logic with jitter (v0.1.0 + v0.2.0)
 * - Debug logging (v0.1.0)
 * - Insecure TLS mode (v0.1.0)
 * - Health check (v0.2.0)
 * - User-Agent header (v0.2.0)
 * - Request/response hooks (v0.2.0)
 * - AbortSignal cancellation (v0.2.0)
 *
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-client.ts
 */

import { RadosGWAdminClient, RGWError } from '../../src/index.js';
import type { BeforeRequestHook, AfterResponseHook } from '../../src/index.js';
import { config } from 'dotenv';

config();

let stepsPassed = 0;
let stepsFailed = 0;

function pass(label: string): void {
  stepsPassed++;
  console.log(`   ✅ ${label}`);
}

function fail(label: string, error: unknown): void {
  stepsFailed++;
  console.error(`   ❌ ${label}: ${error instanceof Error ? error.message : String(error)}`);
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function run() {
  console.log('=== Integration Test: Client Features ===\n');

  const origDebug = console.debug;

  // ── 1. Retry + Debug Logging ───────────────────────────────────────────────

  console.log('1. Normal request with retry config (maxRetries=2, debug=true)...');
  try {
    const debugLogs: string[] = [];
    console.debug = (...args: unknown[]) => {
      debugLogs.push(args.map(String).join(' '));
    };

    const client = new RadosGWAdminClient({
      host: process.env.RGW_HOST!,
      port: Number(process.env.RGW_PORT),
      accessKey: process.env.RGW_ACCESS_KEY!,
      secretKey: process.env.RGW_SECRET_KEY!,
      region: process.env.RGW_REGION,
      maxRetries: 2,
      retryDelay: 100,
      debug: true,
    });

    const users = await client.users.list();
    console.debug = origDebug;

    assert(Array.isArray(users), 'users.list() should return an array');
    assert(
      debugLogs.some((l) => l.includes('request')),
      'debug should log request',
    );
    assert(
      debugLogs.some((l) => l.includes('response')),
      'debug should log response',
    );
    assert(
      !debugLogs.some((l) => l.includes('retry')),
      'healthy server should not trigger retries',
    );
    pass(`Listed ${users.length} users, debug logs correct, no retries`);
  } catch (err) {
    console.debug = origDebug;
    fail('Retry + debug logging', err);
  }

  // ── 2. Retry against unreachable endpoint ──────────────────────────────────

  console.log('\n2. Retry with jitter against unreachable endpoint...');
  try {
    const unreachableClient = new RadosGWAdminClient({
      host: 'http://127.0.0.1',
      port: 19999,
      accessKey: 'fake',
      secretKey: 'fake',
      maxRetries: 2,
      retryDelay: 50,
    });

    const start = Date.now();
    try {
      await unreachableClient.users.list();
      throw new Error('Expected request to fail');
    } catch (err) {
      const elapsed = Date.now() - start;
      assert(err instanceof RGWError, 'should throw RGWError');
      // With jitter: retry 1 = 50-100ms, retry 2 = 100-200ms → total 150-300ms minimum
      assert(elapsed >= 100, `elapsed ${elapsed}ms should be >= 100ms (retries fired)`);
      pass(`Failed after ${elapsed}ms with retries + jitter`);
    }
  } catch (err) {
    fail('Retry with jitter', err);
  }

  // ── 3. No retries when maxRetries=0 ────────────────────────────────────────

  console.log('\n3. No retries (maxRetries=0) against unreachable endpoint...');
  try {
    const noRetryClient = new RadosGWAdminClient({
      host: 'http://127.0.0.1',
      port: 19999,
      accessKey: 'fake',
      secretKey: 'fake',
      maxRetries: 0,
      retryDelay: 50,
    });

    const start = Date.now();
    try {
      await noRetryClient.users.list();
      throw new Error('Expected request to fail');
    } catch (err) {
      const elapsed = Date.now() - start;
      assert(err instanceof RGWError, 'should throw RGWError');
      pass(`Failed in ${elapsed}ms (no retries)`);
    }
  } catch (err) {
    fail('No retries', err);
  }

  // ── 4. Insecure TLS mode ──────────────────────────────────────────────────

  console.log('\n4. Insecure TLS mode...');
  try {
    const insecureLogs: string[] = [];
    console.debug = (...args: unknown[]) => {
      insecureLogs.push(args.map(String).join(' '));
    };

    const insecureClient = new RadosGWAdminClient({
      host: process.env.RGW_HOST!,
      port: Number(process.env.RGW_PORT),
      accessKey: process.env.RGW_ACCESS_KEY!,
      secretKey: process.env.RGW_SECRET_KEY!,
      region: process.env.RGW_REGION,
      insecure: true,
      debug: true,
      maxRetries: 1,
    });

    const users = await insecureClient.users.list();
    console.debug = origDebug;

    assert(Array.isArray(users), 'should return users');
    assert(
      insecureLogs.some((l) => l.includes('TLS')),
      'should log TLS warning',
    );
    pass(`Listed ${users.length} users with insecure TLS`);
  } catch (err) {
    console.debug = origDebug;
    fail('Insecure TLS mode', err);
  }

  // ── 5. Health Check (v0.2.0) ──────────────────────────────────────────────

  console.log('\n5. Health check — reachable server...');
  try {
    const client = new RadosGWAdminClient({
      host: process.env.RGW_HOST!,
      port: Number(process.env.RGW_PORT),
      accessKey: process.env.RGW_ACCESS_KEY!,
      secretKey: process.env.RGW_SECRET_KEY!,
      region: process.env.RGW_REGION,
    });

    const ok = await client.healthCheck();
    assert(ok === true, 'healthCheck should return true for reachable RGW');
    pass('healthCheck() returned true');
  } catch (err) {
    fail('Health check (reachable)', err);
  }

  console.log('\n6. Health check — unreachable server...');
  try {
    const unreachableClient = new RadosGWAdminClient({
      host: 'http://127.0.0.1',
      port: 19999,
      accessKey: 'fake',
      secretKey: 'fake',
      timeout: 2000,
    });

    const ok = await unreachableClient.healthCheck();
    assert(ok === false, 'healthCheck should return false for unreachable RGW');
    pass('healthCheck() returned false');
  } catch (err) {
    fail('Health check (unreachable)', err);
  }

  // ── 7. Request/Response Hooks (v0.2.0) ─────────────────────────────────────

  console.log('\n7. Request/response hooks...');
  try {
    const beforeCalls: Array<{ method: string; path: string; attempt: number }> = [];
    const afterCalls: Array<{ status?: number; durationMs: number; error?: Error }> = [];

    const beforeHook: BeforeRequestHook = (ctx) => {
      beforeCalls.push({ method: ctx.method, path: ctx.path, attempt: ctx.attempt });
    };
    const afterHook: AfterResponseHook = (ctx) => {
      afterCalls.push({ status: ctx.status, durationMs: ctx.durationMs, error: ctx.error });
    };

    const client = new RadosGWAdminClient({
      host: process.env.RGW_HOST!,
      port: Number(process.env.RGW_PORT),
      accessKey: process.env.RGW_ACCESS_KEY!,
      secretKey: process.env.RGW_SECRET_KEY!,
      region: process.env.RGW_REGION,
      onBeforeRequest: [beforeHook],
      onAfterResponse: [afterHook],
    });

    // Make two different API calls to verify hooks fire on all modules
    await client.users.list();
    await client.info.get();

    assert(beforeCalls.length === 2, `expected 2 before calls, got ${beforeCalls.length}`);
    assert(afterCalls.length === 2, `expected 2 after calls, got ${afterCalls.length}`);

    assert(beforeCalls[0]!.method === 'GET', 'first call should be GET');
    assert(beforeCalls[0]!.attempt === 0, 'first attempt should be 0');
    assert(beforeCalls[1]!.method === 'GET', 'second call should be GET');

    assert(afterCalls[0]!.status === 200, `expected status 200, got ${afterCalls[0]!.status}`);
    assert(afterCalls[0]!.durationMs >= 0, 'durationMs should be non-negative');
    assert(afterCalls[0]!.error === undefined, 'no error expected on success');
    assert(afterCalls[1]!.status === 200, `expected status 200, got ${afterCalls[1]!.status}`);

    pass(`Hooks fired ${beforeCalls.length} times across users + info modules`);
  } catch (err) {
    fail('Request/response hooks', err);
  }

  // ── 8. Hooks receive error on failure (v0.2.0) ────────────────────────────

  console.log('\n8. Hooks receive error context on failure...');
  try {
    const afterErrors: Array<{ error?: Error }> = [];

    const client = new RadosGWAdminClient({
      host: 'http://127.0.0.1',
      port: 19999,
      accessKey: 'fake',
      secretKey: 'fake',
      timeout: 2000,
      onAfterResponse: [
        (ctx) => {
          afterErrors.push({ error: ctx.error });
        },
      ],
    });

    try {
      await client.users.list();
    } catch {
      // expected
    }

    assert(afterErrors.length === 1, `expected 1 after call, got ${afterErrors.length}`);
    assert(afterErrors[0]!.error instanceof Error, 'hook should receive error');
    pass(`Hook received error: ${afterErrors[0]!.error!.message.slice(0, 60)}`);
  } catch (err) {
    fail('Hooks error context', err);
  }

  // ── 9. Hook failure does not break request (v0.2.0) ────────────────────────

  console.log('\n9. Broken hook does not break request...');
  try {
    const brokenHook: BeforeRequestHook = () => {
      throw new Error('hook exploded on purpose');
    };

    const client = new RadosGWAdminClient({
      host: process.env.RGW_HOST!,
      port: Number(process.env.RGW_PORT),
      accessKey: process.env.RGW_ACCESS_KEY!,
      secretKey: process.env.RGW_SECRET_KEY!,
      region: process.env.RGW_REGION,
      onBeforeRequest: [brokenHook],
    });

    const users = await client.users.list();
    assert(Array.isArray(users), 'request should succeed despite broken hook');
    pass(`Request succeeded with ${users.length} users despite broken hook`);
  } catch (err) {
    fail('Broken hook resilience', err);
  }

  // ── 10. Custom User-Agent header (v0.2.0) ─────────────────────────────────

  console.log('\n10. Custom User-Agent header...');
  try {
    // We can't inspect the actual header sent to RGW from here,
    // but we verify the config is accepted and requests still work
    const client = new RadosGWAdminClient({
      host: process.env.RGW_HOST!,
      port: Number(process.env.RGW_PORT),
      accessKey: process.env.RGW_ACCESS_KEY!,
      secretKey: process.env.RGW_SECRET_KEY!,
      region: process.env.RGW_REGION,
      userAgent: 'integration-test/1.0',
    });

    const info = await client.info.get();
    assert(typeof info === 'object', 'should return info object');
    pass('Request succeeded with custom User-Agent');
  } catch (err) {
    fail('Custom User-Agent', err);
  }

  // ── 11. Default User-Agent header (v0.2.0) ────────────────────────────────

  console.log('\n11. Default User-Agent header...');
  try {
    const client = new RadosGWAdminClient({
      host: process.env.RGW_HOST!,
      port: Number(process.env.RGW_PORT),
      accessKey: process.env.RGW_ACCESS_KEY!,
      secretKey: process.env.RGW_SECRET_KEY!,
      region: process.env.RGW_REGION,
    });

    // Default User-Agent should work without configuration
    const info = await client.info.get();
    assert(typeof info === 'object', 'should return info object');
    pass('Request succeeded with default User-Agent');
  } catch (err) {
    fail('Default User-Agent', err);
  }

  // ── 12. AbortSignal cancellation (v0.2.0) ─────────────────────────────────

  console.log('\n12. AbortSignal cancellation...');
  try {
    const controller = new AbortController();
    // Abort immediately
    controller.abort();

    const client = new RadosGWAdminClient({
      host: process.env.RGW_HOST!,
      port: Number(process.env.RGW_PORT),
      accessKey: process.env.RGW_ACCESS_KEY!,
      secretKey: process.env.RGW_SECRET_KEY!,
      region: process.env.RGW_REGION,
    });

    try {
      await client._client.request({
        method: 'GET',
        path: '/user',
        signal: controller.signal,
      });
      throw new Error('Expected request to be aborted');
    } catch (err) {
      assert(err instanceof RGWError, 'should throw RGWError on abort');
      pass(`Request aborted: ${(err as RGWError).message.slice(0, 60)}`);
    }
  } catch (err) {
    fail('AbortSignal cancellation', err);
  }

  // ── 13. Hooks fire on retries with correct attempt number (v0.2.0) ─────────

  console.log('\n13. Hooks fire on each retry attempt...');
  try {
    const attempts: number[] = [];

    const client = new RadosGWAdminClient({
      host: 'http://127.0.0.1',
      port: 19999,
      accessKey: 'fake',
      secretKey: 'fake',
      maxRetries: 2,
      retryDelay: 10,
      timeout: 1000,
      onBeforeRequest: [
        (ctx) => {
          attempts.push(ctx.attempt);
        },
      ],
    });

    try {
      await client.users.list();
    } catch {
      // expected
    }

    assert(attempts.length === 3, `expected 3 attempts, got ${attempts.length}`);
    assert(attempts[0] === 0, `first attempt should be 0, got ${attempts[0]}`);
    assert(attempts[1] === 1, `second attempt should be 1, got ${attempts[1]}`);
    assert(attempts[2] === 2, `third attempt should be 2, got ${attempts[2]}`);
    pass(`Hook fired on all 3 attempts: [${attempts.join(', ')}]`);
  } catch (err) {
    fail('Hooks on retries', err);
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${stepsPassed} passed, ${stepsFailed} failed`);
  console.log('='.repeat(50));

  if (stepsFailed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
