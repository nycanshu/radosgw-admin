/**
 * Integration test: Users module
 *
 * Each step tests exactly ONE concept against a real RGW server.
 * A failed step prints the exact assertion that broke and stops the run.
 * Test resources are always cleaned up via finally, even on failure.
 *
 * Required env vars:
 *   RGW_HOST        e.g. http://192.168.1.100
 *   RGW_PORT        e.g. 8080
 *   RGW_ACCESS_KEY  admin access key
 *   RGW_SECRET_KEY  admin secret key
 *
 * Optional:
 *   RGW_REGION          defaults to us-east-1
 *   ENABLE_TENANT_TEST  set to "1" to run the multi-tenancy step (requires RGW tenant support)
 *
 * Run:
 *   npx tsx tests/integration/test-users.ts
 *
 * Never run against production clusters.
 */

import {
  RadosGWAdminClient,
  RGWNotFoundError,
  RGWConflictError,
  RGWAuthError,
} from '../../src/index.js';
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

function assertNotEmpty(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `ASSERTION FAILED: ${label} must be a non-empty string, got: ${JSON.stringify(value)}`,
    );
  }
  pass(`${label} is non-empty string`);
}

function assertNumber(value: unknown, label: string): void {
  if (typeof value !== 'number') {
    throw new Error(`ASSERTION FAILED: ${label} must be a number, got ${typeof value}`);
  }
  pass(`${label} is number (${value})`);
}

function assertNonNegativeNumber(value: unknown, label: string): void {
  if (typeof value !== 'number' || value < 0) {
    throw new Error(
      `ASSERTION FAILED: ${label} must be a non-negative number, got ${JSON.stringify(value)}`,
    );
  }
  pass(`${label} >= 0 (${value})`);
}

function step(n: number, description: string): void {
  console.log(`\nStep ${n}: ${description}`);
}

// ── Client setup ─────────────────────────────────────────────────────────────

const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST ?? 'http://localhost',
  port: process.env.RGW_PORT ? Number(process.env.RGW_PORT) : 8080,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
  region: process.env.RGW_REGION,
});

// Bad credentials client — used for auth error verification
const badClient = new RadosGWAdminClient({
  host: process.env.RGW_HOST ?? 'http://localhost',
  port: process.env.RGW_PORT ? Number(process.env.RGW_PORT) : 8080,
  accessKey: 'INVALID_ACCESS_KEY_XXXX',
  secretKey: 'INVALID_SECRET_KEY_YYYY',
});

const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const TEST_UID = `ct-users-${RUN_ID}`;
const TEST_UID_CAPS = `ct-users-caps-${RUN_ID}`;
const TEST_UID_TENANT = `ct-users-tenant-${RUN_ID}`;
// RGW tenant names must be alphanumeric only — strip hyphens and digits-only segments
const TEST_TENANT = `cttenant${RUN_ID.replaceAll(/[^a-z0-9]/gi, '')}`;

// ── Tests ────────────────────────────────────────────────────────────────────

async function run() {
  console.log('=== Integration Test: Users Module ===');
  console.log(`Run ID: ${RUN_ID}`);
  console.log(`Main UID: ${TEST_UID}`);

  // ── Pre-flight: Error paths ───────────────────────────────────────────────

  step(1, 'GET non-existent user → RGWNotFoundError (404)');
  try {
    await client.users.get(TEST_UID);
    throw new Error('Expected RGWNotFoundError but request succeeded');
  } catch (err) {
    assert(
      err instanceof RGWNotFoundError,
      `RGWNotFoundError thrown for unknown uid "${TEST_UID}"`,
    );
  }

  step(2, 'GET with invalid credentials → RGWAuthError (403)');
  try {
    await badClient.users.get('any-user');
    throw new Error('Expected RGWAuthError but request succeeded');
  } catch (err) {
    assert(err instanceof RGWAuthError, 'RGWAuthError thrown for invalid credentials');
  }

  // ── Create ───────────────────────────────────────────────────────────────

  step(3, 'Create user — response fields match input');
  const created = await client.users.create({
    uid: TEST_UID,
    displayName: 'Integration Test User',
    email: 'test@example.com',
    maxBuckets: 10,
  });
  assertEqual(created.userId, TEST_UID, 'created.userId');
  assertEqual(created.displayName, 'Integration Test User', 'created.displayName');
  assertEqual(created.email, 'test@example.com', 'created.email');
  assertEqual(created.maxBuckets, 10, 'created.maxBuckets');
  assertEqual(created.suspended, 0, 'created.suspended');

  step(4, 'Create user — auto-generated key shape is valid');
  assert(Array.isArray(created.keys) && created.keys.length > 0, 'created.keys is non-empty array');
  assertNotEmpty(created.keys[0]!.accessKey, 'created.keys[0].accessKey');
  assertNotEmpty(created.keys[0]!.secretKey, 'created.keys[0].secretKey');
  assertEqual(created.keys[0]!.user, TEST_UID, 'created.keys[0].user');

  step(5, 'Create user — array fields are all present and correct type');
  assert(Array.isArray(created.subusers), 'created.subusers is array');
  assert(Array.isArray(created.swiftKeys), 'created.swiftKeys is array');
  assert(Array.isArray(created.caps), 'created.caps is array');
  assert(typeof created.opMask === 'string', 'created.opMask is string');
  assert(typeof created.tenant === 'string', 'created.tenant is string');

  step(6, 'Duplicate create → RGWConflictError (409)');
  try {
    await client.users.create({ uid: TEST_UID, displayName: 'Duplicate' });
    throw new Error('Expected RGWConflictError but request succeeded');
  } catch (err) {
    assert(
      err instanceof RGWConflictError,
      `RGWConflictError thrown for duplicate uid "${TEST_UID}"`,
    );
  }

  // ── Get ───────────────────────────────────────────────────────────────────

  step(7, 'GET user — core fields match what was created');
  const fetched = await client.users.get(TEST_UID);
  assertEqual(fetched.userId, TEST_UID, 'fetched.userId');
  assertEqual(fetched.displayName, 'Integration Test User', 'fetched.displayName');
  assertEqual(fetched.email, 'test@example.com', 'fetched.email');
  assertEqual(fetched.maxBuckets, 10, 'fetched.maxBuckets');
  assertEqual(fetched.suspended, 0, 'fetched.suspended');

  step(8, 'GET user — full shape contract (all required fields present)');
  assert(Array.isArray(fetched.keys), 'fetched.keys is array');
  assert(Array.isArray(fetched.caps), 'fetched.caps is array');
  assert(Array.isArray(fetched.subusers), 'fetched.subusers is array');
  assert(Array.isArray(fetched.swiftKeys), 'fetched.swiftKeys is array');
  assert(typeof fetched.opMask === 'string', 'fetched.opMask is string');
  assert(typeof fetched.defaultPlacement === 'string', 'fetched.defaultPlacement is string');
  assert(typeof fetched.defaultStorageClass === 'string', 'fetched.defaultStorageClass is string');
  assert(typeof fetched.tenant === 'string', 'fetched.tenant is string');
  assert(typeof fetched.bucketQuota === 'object', 'fetched.bucketQuota is object');
  assert(typeof fetched.userQuota === 'object', 'fetched.userQuota is object');

  step(9, 'GET user — type field present (Ceph Pacific+ field, may be absent on older releases)');
  if (fetched.type !== undefined) {
    assert(typeof fetched.type === 'string', 'fetched.type is string when present');
    pass(`fetched.type = "${fetched.type}"`);
  } else {
    pass('fetched.type absent (pre-Pacific RGW — acceptable)');
  }

  // ── Get by access key ─────────────────────────────────────────────────────

  step(10, 'Get by access key — returns correct user');
  const accessKey = created.keys[0]!.accessKey;
  const byKey = await client.users.getByAccessKey(accessKey);
  assertEqual(byKey.userId, TEST_UID, 'getByAccessKey.userId');

  step(11, 'Get by access key — returned user has the queried key in its keys array');
  const matchingKey = byKey.keys.find((k) => k.accessKey === accessKey);
  assert(matchingKey !== undefined, `returned user's keys contain accessKey "${accessKey}"`);

  // ── List ──────────────────────────────────────────────────────────────────

  step(12, 'List users — returns array');
  const allUids = await client.users.list();
  assert(Array.isArray(allUids), 'list() returns array');

  step(13, 'List users — newly created user is present');
  assert(allUids.includes(TEST_UID), `list() includes "${TEST_UID}"`);

  // ── Modify ────────────────────────────────────────────────────────────────

  step(14, 'Modify displayName and maxBuckets — response reflects changes');
  const modifyResp = await client.users.modify({
    uid: TEST_UID,
    displayName: 'Modified Test User',
    maxBuckets: 50,
  });
  assertEqual(modifyResp.displayName, 'Modified Test User', 'modifyResp.displayName');
  assertEqual(modifyResp.maxBuckets, 50, 'modifyResp.maxBuckets');

  step(15, 'Modify displayName and maxBuckets — changes persisted (round-trip GET)');
  const afterModify = await client.users.get(TEST_UID);
  assertEqual(afterModify.displayName, 'Modified Test User', 'afterModify.displayName');
  assertEqual(afterModify.maxBuckets, 50, 'afterModify.maxBuckets');

  step(16, 'Modify opMask — response includes opMask string');
  const maskResp = await client.users.modify({ uid: TEST_UID, opMask: 'read' });
  assert(typeof maskResp.opMask === 'string', 'maskResp.opMask is string');
  assert(
    maskResp.opMask.includes('read'),
    `maskResp.opMask includes "read" (got "${maskResp.opMask}")`,
  );

  step(17, 'Modify opMask — value persisted (round-trip GET)');
  const afterMask = await client.users.get(TEST_UID);
  assert(
    afterMask.opMask.includes('read'),
    `afterMask.opMask includes "read" (got "${afterMask.opMask}")`,
  );

  // ── Suspend / Enable ──────────────────────────────────────────────────────

  step(18, 'Suspend user — response shows suspended=1');
  const suspendResp = await client.users.suspend(TEST_UID);
  assertEqual(suspendResp.suspended, 1, 'suspendResp.suspended');

  step(19, 'Suspend already-suspended user — idempotent (still suspended=1)');
  const suspendAgain = await client.users.suspend(TEST_UID);
  assertEqual(suspendAgain.suspended, 1, 'suspendAgain.suspended');

  step(20, 'Enable user — response shows suspended=0');
  const enableResp = await client.users.enable(TEST_UID);
  assertEqual(enableResp.suspended, 0, 'enableResp.suspended');

  step(21, 'Enable already-active user — idempotent (still suspended=0)');
  const enableAgain = await client.users.enable(TEST_UID);
  assertEqual(enableAgain.suspended, 0, 'enableAgain.suspended');

  // ── Stats ─────────────────────────────────────────────────────────────────

  step(22, 'getStats — returns both user fields and stats sub-object');
  const stats = await client.users.getStats(TEST_UID);
  assertEqual(stats.userId, TEST_UID, 'stats.userId (user fields preserved)');
  assertEqual(stats.displayName, 'Modified Test User', 'stats.displayName (user fields preserved)');
  assert(typeof stats.stats === 'object' && stats.stats !== null, 'stats.stats is object');

  step(23, 'getStats — all stat fields are non-negative numbers');
  assertNonNegativeNumber(stats.stats.size, 'stats.stats.size');
  assertNonNegativeNumber(stats.stats.sizeActual, 'stats.stats.sizeActual');
  assertNonNegativeNumber(stats.stats.sizeUtilized, 'stats.stats.sizeUtilized');
  assertNonNegativeNumber(stats.stats.sizeKb, 'stats.stats.sizeKb');
  assertNonNegativeNumber(stats.stats.sizeKbActual, 'stats.stats.sizeKbActual');
  assertNonNegativeNumber(stats.stats.sizeKbUtilized, 'stats.stats.sizeKbUtilized');
  assertNonNegativeNumber(stats.stats.numObjects, 'stats.stats.numObjects');

  step(24, 'getStats with sync=true — returns valid response with same shape');
  const statsSync = await client.users.getStats(TEST_UID, true);
  assertEqual(statsSync.userId, TEST_UID, 'statsSync.userId');
  assertNumber(statsSync.stats.numObjects, 'statsSync.stats.numObjects');
  assertNumber(statsSync.stats.size, 'statsSync.stats.size');

  // ── userCaps ──────────────────────────────────────────────────────────────

  step(25, 'Create user with userCaps — response userId correct');
  const withCaps = await client.users.create({
    uid: TEST_UID_CAPS,
    displayName: 'Caps Test User',
    userCaps: 'usage=read',
  });
  assertEqual(withCaps.userId, TEST_UID_CAPS, 'withCaps.userId');

  step(26, 'Create user with userCaps — caps array is non-empty');
  assert(
    Array.isArray(withCaps.caps) && withCaps.caps.length > 0,
    'withCaps.caps is non-empty array',
  );

  step(27, 'Create user with userCaps — caps array contains usage=read entry');
  const usageCap = withCaps.caps.find((c) => c.type === 'usage');
  assert(usageCap !== undefined, 'caps array contains entry with type="usage"');
  assert(
    usageCap!.perm === 'read' || usageCap!.perm.includes('read'),
    `usage cap perm includes "read" (got "${usageCap!.perm}")`,
  );

  step(28, 'Get caps user — caps persisted (round-trip GET)');
  const fetchedCaps = await client.users.get(TEST_UID_CAPS);
  const persistedCap = fetchedCaps.caps.find((c) => c.type === 'usage');
  assert(persistedCap !== undefined, 'persisted caps contain usage entry');
  assert(
    persistedCap!.perm === 'read' || persistedCap!.perm.includes('read'),
    `persisted usage cap perm includes "read" (got "${persistedCap!.perm}")`,
  );

  // ── Tenant (optional) ─────────────────────────────────────────────────────

  if (process.env.ENABLE_TENANT_TEST === '1') {
    step(29, 'Create tenant user (requires multi-tenancy enabled in RGW)');
    const tenantUser = await client.users.create({
      uid: TEST_UID_TENANT,
      displayName: 'Tenant Test User',
      tenant: TEST_TENANT,
    });
    assert(typeof tenantUser.userId === 'string', 'tenantUser.userId is string');

    step(30, 'Get tenant user via get(uid, tenant) — resolves to tenant$uid');
    const fetchedTenant = await client.users.get(TEST_UID_TENANT, TEST_TENANT);
    assert(
      fetchedTenant.userId === TEST_UID_TENANT ||
        fetchedTenant.userId === `${TEST_TENANT}$${TEST_UID_TENANT}`,
      `tenant user userId matches (got "${fetchedTenant.userId}")`,
    );

    step(31, 'Delete tenant user');
    await client.users.delete({ uid: `${TEST_TENANT}$${TEST_UID_TENANT}`, purgeData: true });
    pass('tenant user deleted');
  } else {
    console.log('\nSteps 29-31: SKIPPED (set ENABLE_TENANT_TEST=1 to run tenant tests)');
  }

  // ── Delete and verification ───────────────────────────────────────────────

  step(32, 'Delete main test user');
  await client.users.delete({ uid: TEST_UID, purgeData: true });
  pass(`"${TEST_UID}" deleted`);

  step(33, 'GET deleted user → RGWNotFoundError (404)');
  try {
    await client.users.get(TEST_UID);
    throw new Error('Expected RGWNotFoundError but request succeeded');
  } catch (err) {
    assert(
      err instanceof RGWNotFoundError,
      `RGWNotFoundError thrown for deleted uid "${TEST_UID}"`,
    );
  }

  step(34, 'List users — deleted user absent');
  const afterDelete = await client.users.list();
  assert(!afterDelete.includes(TEST_UID), `list() no longer includes "${TEST_UID}"`);

  console.log('\n' + '─'.repeat(60));
  console.log(`Passed: ${stepsPassed}  Failed: ${stepsFailed}`);
  console.log('=== All tests passed! ===\n');
}

// ── Cleanup — always runs, even on failure ───────────────────────────────────

async function cleanup() {
  const targets = [
    TEST_UID,
    TEST_UID_CAPS,
    // Tenant user uses the full tenant$uid notation for delete
    ...(process.env.ENABLE_TENANT_TEST === '1' ? [`${TEST_TENANT}$${TEST_UID_TENANT}`] : []),
  ];
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
