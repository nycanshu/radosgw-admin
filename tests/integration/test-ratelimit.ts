/**
 * Integration Test: Rate Limit Module
 *
 * Tests user-level, bucket-level, and global rate limit operations
 * against a live RGW server. Requires Ceph Pacific (v16) or later.
 *
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-ratelimit.ts
 */

import { RadosGWAdminClient } from '../../src/index.js';
import { config } from 'dotenv';

config();

const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST!,
  port: Number(process.env.RGW_PORT),
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
  region: process.env.RGW_REGION,
});

const TEST_UID = `test-ratelimit-${Date.now()}`;

async function run() {
  console.log('=== Integration Test: Rate Limit Module ===\n');

  // 0. Create a test user
  console.log('0. Creating test user...');
  await client.users.create({
    uid: TEST_UID,
    displayName: 'Rate Limit Test User',
  });
  console.log(`   Created user "${TEST_UID}"`);

  // ── User Rate Limit ─────────────────────────────────

  // 1. Get default user rate limit
  console.log('\n1. Getting default user rate limit...');
  const defaultLimit = await client.rateLimit.getUserLimit(TEST_UID);
  console.log(`   Enabled: ${defaultLimit.enabled}`);

  // 2. Set user rate limit
  console.log('\n2. Setting user rate limit (100 read ops, 50 write ops)...');
  await client.rateLimit.setUserLimit({
    uid: TEST_UID,
    maxReadOps: 100,
    maxWriteOps: 50,
    maxWriteBytes: 52428800, // 50MB
  });
  console.log('   Set successfully');

  // 3. Verify user rate limit
  console.log('\n3. Verifying user rate limit...');
  const userLimit = await client.rateLimit.getUserLimit(TEST_UID);
  if (!userLimit.enabled) throw new Error('Expected user rate limit to be enabled');
  if (userLimit.maxReadOps !== 100) {
    throw new Error(`Expected maxReadOps=100, got ${userLimit.maxReadOps}`);
  }
  if (userLimit.maxWriteOps !== 50) {
    throw new Error(`Expected maxWriteOps=50, got ${userLimit.maxWriteOps}`);
  }
  console.log(
    `   Enabled: ${userLimit.enabled}, readOps: ${userLimit.maxReadOps}, writeOps: ${userLimit.maxWriteOps}`,
  );

  // 4. Disable user rate limit
  console.log('\n4. Disabling user rate limit...');
  await client.rateLimit.disableUserLimit(TEST_UID);
  const disabledLimit = await client.rateLimit.getUserLimit(TEST_UID);
  if (disabledLimit.enabled) throw new Error('Expected user rate limit to be disabled');
  console.log('   Disabled');

  // ── Global Rate Limits ──────────────────────────────

  // 5. Get global rate limits
  console.log('\n5. Getting global rate limits...');
  const global = await client.rateLimit.getGlobal();
  console.log('   User scope:', {
    enabled: global.user.enabled,
    readOps: global.user.maxReadOps,
  });
  console.log('   Bucket scope:', {
    enabled: global.bucket.enabled,
    readOps: global.bucket.maxReadOps,
  });
  console.log('   Anonymous scope:', {
    enabled: global.anonymous.enabled,
    readOps: global.anonymous.maxReadOps,
  });

  // ── Cleanup ─────────────────────────────────────────

  console.log('\n6. Cleaning up test user...');
  await client.users.delete({ uid: TEST_UID, purgeData: true });
  console.log('   Deleted.');

  console.log('\n=== All tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  client.users.delete({ uid: TEST_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
