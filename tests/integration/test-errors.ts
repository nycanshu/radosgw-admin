/**
 * Integration Test: Error Handling
 *
 * Validates all error classes and RGW error codes against a live RGW server.
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-errors.ts
 */

import { RadosGWAdminClient } from '../../src/index.js';
import {
  RGWError,
  RGWNotFoundError,
  RGWValidationError,
  RGWAuthError,
  RGWConflictError,
} from '../../src/errors.js';
import { config } from 'dotenv';

config();

const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST ?? 'http://localhost',
  port: process.env.RGW_PORT ? Number(process.env.RGW_PORT) : 8080,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
  region: process.env.RGW_REGION,
});

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail: string) {
  if (ok) {
    console.log(`  ✅ ${label}: ${detail}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}: ${detail}`);
    failed++;
  }
}

async function main() {
  console.log('=== Error Validation Against Real RGW ===\n');

  // 1. 404 — NoSuchUser
  console.log('--- 404 Not Found ---');
  try {
    await client.users.get('__nonexistent_user_test_12345__');
    check('NoSuchUser', false, 'expected error but got success');
  } catch (err: unknown) {
    const e = err as RGWNotFoundError;
    check(
      'NoSuchUser → RGWNotFoundError',
      e instanceof RGWNotFoundError,
      `got ${e.constructor.name}`,
    );
    check('NoSuchUser code', e.code === 'NoSuchUser', `code=${e.code}`);
    check('NoSuchUser statusCode', e.statusCode === 404, `status=${e.statusCode}`);
    console.log(`  → message: "${e.message}"`);
  }

  // 2. 404 — NoSuchBucket
  try {
    await client.buckets.getInfo('__nonexistent_bucket_test_12345__');
    check('NoSuchBucket', false, 'expected error but got success');
  } catch (err: unknown) {
    const e = err as RGWNotFoundError;
    check(
      'NoSuchBucket → RGWNotFoundError',
      e instanceof RGWNotFoundError,
      `got ${e.constructor.name}`,
    );
    check('NoSuchBucket code', e.code === 'NoSuchBucket', `code=${e.code}`);
    console.log(`  → message: "${e.message}"`);
  }

  // 3. 409 — UserAlreadyExists (create same user twice)
  console.log('\n--- 409 Conflict ---');
  const testUid = `__error_test_${Date.now()}__`;
  try {
    await client.users.create({ uid: testUid, displayName: 'Error Test User' });
    try {
      await client.users.create({ uid: testUid, displayName: 'Error Test User' });
      check('UserAlreadyExists', false, 'expected error but got success');
    } catch (err: unknown) {
      const e = err as RGWConflictError;
      check(
        'UserAlreadyExists → RGWConflictError',
        e instanceof RGWConflictError,
        `got ${e.constructor.name}`,
      );
      check('UserAlreadyExists code', e.code === 'UserAlreadyExists', `code=${e.code}`);
      check('UserAlreadyExists statusCode', e.statusCode === 409, `status=${e.statusCode}`);
      console.log(`  → message: "${e.message}"`);
    }
    // Cleanup
    await client.users.delete({ uid: testUid, purgeData: true });
  } catch (err: unknown) {
    const e = err as Error;
    console.log(`  ⚠️  Setup failed: ${e.message}`);
  }

  // 4. 403 — Wrong credentials
  console.log('\n--- 403 Auth Error ---');
  const badClient = new RadosGWAdminClient({
    host: process.env.RGW_HOST ?? 'http://localhost',
    port: process.env.RGW_PORT ? Number(process.env.RGW_PORT) : 8080,
    accessKey: 'INVALID_ACCESS_KEY_12345',
    secretKey: 'INVALID_SECRET_KEY_12345',
    region: process.env.RGW_REGION,
  });
  try {
    await badClient.users.list();
    check('InvalidAccessKey', false, 'expected error but got success');
  } catch (err: unknown) {
    const e = err as RGWAuthError;
    check('Auth error → RGWAuthError', e instanceof RGWAuthError, `got ${e.constructor.name}`);
    check('Auth statusCode', e.statusCode === 403, `status=${e.statusCode}`);
    check(
      'Auth code',
      ['InvalidAccessKeyId', 'AccessDenied', 'SignatureDoesNotMatch'].includes(e.code ?? ''),
      `code=${e.code}`,
    );
    console.log(`  → message: "${e.message}"`);
  }

  // 5. 403 — Wrong secret (valid access key, bad secret)
  const badSecretClient = new RadosGWAdminClient({
    host: process.env.RGW_HOST ?? 'http://localhost',
    port: process.env.RGW_PORT ? Number(process.env.RGW_PORT) : 8080,
    accessKey: process.env.RGW_ACCESS_KEY!,
    secretKey: 'WRONG_SECRET_KEY_12345',
    region: process.env.RGW_REGION,
  });
  try {
    await badSecretClient.users.list();
    check('SignatureDoesNotMatch', false, 'expected error but got success');
  } catch (err: unknown) {
    const e = err as RGWAuthError;
    check('Bad secret → RGWAuthError', e instanceof RGWAuthError, `got ${e.constructor.name}`);
    check('Bad secret code', e.code === 'SignatureDoesNotMatch', `code=${e.code}`);
    console.log(`  → message: "${e.message}"`);
  }

  // 6. Client-side validation
  console.log('\n--- Client-side Validation ---');
  try {
    await client.users.get('');
    check('Empty UID', false, 'expected error but got success');
  } catch (err: unknown) {
    const e = err as RGWValidationError;
    check(
      'Empty UID → RGWValidationError',
      e instanceof RGWValidationError,
      `got ${e.constructor.name}`,
    );
    check('Empty UID statusCode', e.statusCode === undefined, `status=${e.statusCode}`);
    check('Empty UID code', e.code === 'ValidationError', `code=${e.code}`);
    console.log(`  → message: "${e.message}"`);
  }

  // 7. Network/Timeout error
  console.log('\n--- Network Error ---');
  const deadClient = new RadosGWAdminClient({
    host: 'http://192.0.2.1',
    port: 9999,
    accessKey: 'x',
    secretKey: 'x',
    timeout: 3000,
  });
  try {
    await deadClient.users.list();
    check('Timeout', false, 'expected error but got success');
  } catch (err: unknown) {
    const e = err as RGWError;
    check('Unreachable → RGWError', e instanceof RGWError, `got ${e.constructor.name}`);
    check(
      'Timeout/Network code',
      ['Timeout', 'NetworkError'].includes(e.code ?? ''),
      `code=${e.code}`,
    );
    console.log(`  → message: "${e.message}"`);
  }

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
