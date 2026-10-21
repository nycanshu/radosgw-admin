/**
 * Integration test: SigV4 canonical query encoding (issue #83)
 *
 * Every request carries its parameters in the query string, so any free-text
 * value containing ! ' ( ) * must be percent-encoded exactly as RGW re-encodes
 * it, or RGW rejects the request with SignatureDoesNotMatch (RGWAuthError).
 *
 * Covers every free-text query parameter the SDK sends: displayName, email,
 * userCaps, uid (shared by every module), S3 access/secret keys, and subuser
 * secrets. Each value is round-tripped through a GET to prove it was stored
 * unchanged.
 *
 * Required env vars: RGW_HOST, RGW_PORT, RGW_ACCESS_KEY, RGW_SECRET_KEY
 * Optional: RGW_REGION (defaults to us-east-1)
 *
 * Run:
 *   npx tsx tests/integration/test-signing.ts
 *
 * Never run against production clusters.
 */

import { RadosGWAdminClient, RGWAuthError, RGWValidationError } from '../../src/index.js';
import { randomBytes } from 'node:crypto';
import { config } from 'dotenv';

config();

// ── Assertion helpers ────────────────────────────────────────────────────────

let stepsPassed = 0;
let stepsFailed = 0;

function pass(label: string): void {
  stepsPassed++;
  console.log(`   ✓ ${label}`);
}

function assert(condition: boolean, label: string): void {
  if (!condition) throw new Error(`ASSERTION FAILED: ${label}`);
  pass(label);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `ASSERTION FAILED: ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`,
    );
  }
  pass(`${label} = ${JSON.stringify(actual)}`);
}

function step(n: number, description: string): void {
  console.log(`\nStep ${n}: ${description}`);
}

/** Runs a call and rethrows signature failures with a clear #83 message. */
async function signed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof RGWAuthError) {
      throw new Error(`${label} rejected by RGW (${err.code}) — SigV4 query encoding regression`);
    }
    throw err;
  }
}

// ── Client setup ─────────────────────────────────────────────────────────────

const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST ?? 'http://localhost',
  port: process.env.RGW_PORT ? Number(process.env.RGW_PORT) : 8080,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
  region: process.env.RGW_REGION,
});

const RUN_ID = `${Date.now()}-${randomBytes(4).toString('hex')}`;
const TEST_UID = `ct-sign-${RUN_ID}`;
const TEST_UID_CREATE = `ct-sign-create-${RUN_ID}`;
const TEST_UID_CAPS = `ct-sign-caps-${RUN_ID}`;
// uid itself carrying every reserved character — exercises every module's uid param
const TEST_UID_SPECIAL = `ct-sign-(x)!'*-${RUN_ID}`;
const RESERVED = ['!', "'", '(', ')', '*'] as const;

// ── Tests ────────────────────────────────────────────────────────────────────

async function run() {
  console.log('=== Integration Test: SigV4 Query Encoding (#83) ===');
  console.log(`Run ID: ${RUN_ID}`);

  step(1, 'Create user with displayName "Backup (prod)" — exact issue #83 repro');
  const created = await signed('users.create', () =>
    client.users.create({ uid: TEST_UID_CREATE, displayName: 'Backup (prod)' }),
  );
  assertEqual(created.displayName, 'Backup (prod)', 'created.displayName');

  step(2, 'Create baseline user with a plain displayName');
  await signed('users.create', () =>
    client.users.create({ uid: TEST_UID, displayName: 'plain name' }),
  );
  pass(`"${TEST_UID}" created`);

  let n = 3;
  for (const char of RESERVED) {
    const name = `smoke ${char}x${char}`;
    step(n++, `Modify displayName containing ${char} — accepted and stored unchanged`);
    const resp = await signed(`users.modify (${char})`, () =>
      client.users.modify({ uid: TEST_UID, displayName: name }),
    );
    assertEqual(resp.displayName, name, 'modifyResp.displayName');
    const fetched = await signed('users.get', () => client.users.get(TEST_UID));
    assertEqual(fetched.displayName, name, 'fetched.displayName');
  }

  step(n++, 'Modify displayName with all reserved characters plus controls (~, space, Unicode)');
  const combined = "Backup (prod) !'* ~ Šťastný kůň";
  await signed('users.modify (combined)', () =>
    client.users.modify({ uid: TEST_UID, displayName: combined }),
  );
  assertEqual((await client.users.get(TEST_UID)).displayName, combined, 'fetched.displayName');

  step(n++, "Modify email containing ' — accepted and stored unchanged");
  const email = `o'brien.${RUN_ID}@example.com`;
  await signed('users.modify (email)', () => client.users.modify({ uid: TEST_UID, email }));
  assertEqual((await client.users.get(TEST_UID)).email, email, 'fetched.email');

  step(n++, 'Create user with userCaps "usage=*" — * in a caps value');
  await signed('users.create (userCaps)', () =>
    client.users.create({ uid: TEST_UID_CAPS, displayName: 'Caps *', userCaps: 'usage=*' }),
  );
  const usageCap = (await client.users.get(TEST_UID_CAPS)).caps.find((c) => c.type === 'usage');
  assert(usageCap !== undefined, 'caps contain usage entry');
  assertEqual(usageCap!.perm, '*', 'usage cap perm');

  step(n++, 'addCaps / removeCaps "buckets=*" — * through the ?caps endpoints');
  const added = await signed('users.addCaps', () =>
    client.users.addCaps(TEST_UID_CAPS, 'buckets=*'),
  );
  assertEqual(added.find((c) => c.type === 'buckets')?.perm, '*', 'addCaps buckets perm');
  const removed = await signed('users.removeCaps', () =>
    client.users.removeCaps(TEST_UID_CAPS, 'buckets=*'),
  );
  assert(!removed.some((c) => c.type === 'buckets'), 'removeCaps removed buckets entry');

  step(n++, 'Generate S3 key with a user-supplied secret containing reserved characters');
  const accessKey = `CTSIGN${randomBytes(6).toString('hex').toUpperCase()}`;
  const secretKey = `Sec(ret)!'*${randomBytes(8).toString('hex')}`;
  const keys = await signed('keys.generate', () =>
    client.keys.generate({ uid: TEST_UID, accessKey, secretKey, generateKey: false }),
  );
  const generated = keys.find((k) => k.accessKey === accessKey);
  assert(generated !== undefined, `keys contain access key "${accessKey}"`);
  assertEqual(generated!.secretKey, secretKey, 'generated.secretKey');

  step(n++, 'Create subuser with a secret containing reserved characters');
  const subuser = `${TEST_UID}:swift`;
  const subSecret = `Sub(secret)!'*${randomBytes(8).toString('hex')}`;
  const subusers = await signed('subusers.create', () =>
    client.subusers.create({
      uid: TEST_UID,
      subuser,
      secretKey: subSecret,
      keyType: 'swift',
      access: 'read',
      generateSecret: false,
    }),
  );
  assert(
    subusers.some((s) => s.id === subuser),
    `subusers contain "${subuser}"`,
  );
  const swiftKey = (await client.users.get(TEST_UID)).swiftKeys.find((k) => k.user === subuser);
  assert(swiftKey !== undefined, 'swift key exists for subuser');
  assertEqual(swiftKey!.secretKey, subSecret, 'subuser swift secretKey');

  step(n++, `Create user whose uid contains ! ' ( ) * — "${TEST_UID_SPECIAL}"`);
  const special = await signed('users.create (special uid)', () =>
    client.users.create({ uid: TEST_UID_SPECIAL, displayName: 'Special UID' }),
  );
  assertEqual(special.userId, TEST_UID_SPECIAL, 'special.userId');

  step(n++, 'Special uid works across modules (users, keys, quota, rate limit, usage)');
  assertEqual(
    (await signed('users.get', () => client.users.get(TEST_UID_SPECIAL))).userId,
    TEST_UID_SPECIAL,
    'users.get userId',
  );
  const stats = await signed('users.getStats', () => client.users.getStats(TEST_UID_SPECIAL));
  assertEqual(stats.userId, TEST_UID_SPECIAL, 'users.getStats userId');
  await signed('users.suspend', () => client.users.suspend(TEST_UID_SPECIAL));
  await signed('users.enable', () => client.users.enable(TEST_UID_SPECIAL));
  pass('users.suspend / users.enable accepted');
  const specialKeys = await signed('keys.generate', () =>
    client.keys.generate({ uid: TEST_UID_SPECIAL }),
  );
  assert(specialKeys.length > 0, 'keys.generate returned keys');
  await signed('quota.setUserQuota', () =>
    client.quota.setUserQuota({ uid: TEST_UID_SPECIAL, maxObjects: 1000, enabled: true }),
  );
  const quota = await signed('quota.getUserQuota', () =>
    client.quota.getUserQuota(TEST_UID_SPECIAL),
  );
  assertEqual(quota.maxObjects, 1000, 'quota.maxObjects');
  try {
    await signed('rateLimit.getUserLimit', () => client.rateLimit.getUserLimit(TEST_UID_SPECIAL));
    pass('rateLimit.getUserLimit accepted');
  } catch (err) {
    // Rate limiting disabled → 400 InvalidArgument. RGW authenticates before
    // validating the op, so a 400 still proves the signature was accepted.
    if (!(err instanceof RGWValidationError && err.code === 'InvalidArgument')) throw err;
    pass('rateLimit.getUserLimit signature accepted (rate limiting not enabled on this RGW)');
  }
  await signed('usage.get', () => client.usage.get({ uid: TEST_UID_SPECIAL }));
  pass('usage.get accepted');
  const buckets = await signed('buckets.listByUser', () =>
    client.buckets.listByUser(TEST_UID_SPECIAL),
  );
  assert(Array.isArray(buckets), 'buckets.listByUser returns array');

  step(n++, 'Delete special-uid user');
  await signed('users.delete', () =>
    client.users.delete({ uid: TEST_UID_SPECIAL, purgeData: true }),
  );
  pass(`"${TEST_UID_SPECIAL}" deleted`);

  console.log('\n' + '─'.repeat(60));
  console.log(`Passed: ${stepsPassed}  Failed: ${stepsFailed}`);
  console.log('=== All tests passed! ===\n');
}

// ── Cleanup — always runs, even on failure ───────────────────────────────────

async function cleanup() {
  const targets = [TEST_UID, TEST_UID_CREATE, TEST_UID_CAPS, TEST_UID_SPECIAL];
  await Promise.allSettled(targets.map((uid) => client.users.delete({ uid, purgeData: true })));
}

// ── Entry point ──────────────────────────────────────────────────────────────

run()
  .catch((err: unknown) => {
    stepsFailed++;
    console.error('\n✗ Test failed:', err instanceof Error ? err.message : err);
    console.log(`\nPassed: ${stepsPassed}  Failed: ${stepsFailed}`);
    process.exitCode = 1;
  })
  .finally(() => {
    return cleanup().catch((err: unknown) => console.error('Cleanup error:', err));
  });
