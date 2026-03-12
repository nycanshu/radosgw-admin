/**
 * Integration Test: Quota Module
 *
 * Tests user-level and bucket-level quota operations against a live RGW server.
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-quota.ts
 */

import { RadosGWAdminClient, RGWNotFoundError } from '../../src/index.js';
import { config } from 'dotenv';

config();

const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST!,
  port: Number(process.env.RGW_PORT),
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
  region: process.env.RGW_REGION,
});

const TEST_UID = `test-quota-${Date.now()}`;
const TEN_GB = 10 * 1024 ** 3; // 10737418240
const ONE_GB = 1024 ** 3; // 1073741824

async function run() {
  console.log('=== Integration Test: Quota Module ===\n');

  // 0. Create a test user
  console.log('0. Creating test user...');
  await client.users.create({
    uid: TEST_UID,
    displayName: 'Quota Test User',
  });
  console.log(`   Created user "${TEST_UID}"`);

  // ── User Quota ──────────────────────────────────────

  // 1. Get default user quota (should be disabled, unlimited)
  console.log('\n1. Getting default user quota...');
  const defaultQuota = await client.quota.getUserQuota(TEST_UID);
  if (defaultQuota.enabled) throw new Error('Expected user quota to be disabled by default');
  if (defaultQuota.maxSize !== -1) {
    throw new Error(`Expected default maxSize=-1 (unlimited), got ${defaultQuota.maxSize}`);
  }
  if (defaultQuota.maxObjects !== -1) {
    throw new Error(`Expected default maxObjects=-1 (unlimited), got ${defaultQuota.maxObjects}`);
  }
  console.log(
    `   Enabled: ${defaultQuota.enabled}, maxSize: ${defaultQuota.maxSize}, maxObjects: ${defaultQuota.maxObjects}`,
  );

  // 2. Set user quota with human-readable size string
  console.log('\n2. Setting user quota (10G string, 50k objects)...');
  await client.quota.setUserQuota({
    uid: TEST_UID,
    maxSize: '10G',
    maxObjects: 50000,
    enabled: true,
  });
  console.log('   Set successfully');

  // 3. Verify user quota — check both maxSize and maxObjects round-trip
  console.log('\n3. Verifying user quota...');
  const userQuota = await client.quota.getUserQuota(TEST_UID);
  if (!userQuota.enabled) throw new Error('Expected user quota to be enabled');
  if (userQuota.maxSize !== TEN_GB) {
    throw new Error(`Expected maxSize=${TEN_GB} (10G), got ${userQuota.maxSize}`);
  }
  if (userQuota.maxObjects !== 50000) {
    throw new Error(`Expected maxObjects=50000, got ${userQuota.maxObjects}`);
  }
  console.log(
    `   Enabled: ${userQuota.enabled}, maxSize: ${userQuota.maxSize}, maxObjects: ${userQuota.maxObjects}`,
  );

  // 4. Update quota with raw byte number (not a string)
  console.log('\n4. Setting user quota with raw bytes (1G number)...');
  await client.quota.setUserQuota({
    uid: TEST_UID,
    maxSize: ONE_GB,
    maxObjects: -1, // unlimited objects
  });
  const rawQuota = await client.quota.getUserQuota(TEST_UID);
  if (rawQuota.maxSize !== ONE_GB) {
    throw new Error(`Expected maxSize=${ONE_GB} (raw bytes), got ${rawQuota.maxSize}`);
  }
  if (rawQuota.maxObjects !== -1) {
    throw new Error(`Expected maxObjects=-1 (unlimited), got ${rawQuota.maxObjects}`);
  }
  console.log(
    `   maxSize: ${rawQuota.maxSize} (1G raw), maxObjects: ${rawQuota.maxObjects} (unlimited)`,
  );

  // 5. Disable user quota (preserve values)
  console.log('\n5. Disabling user quota...');
  await client.quota.disableUserQuota(TEST_UID);
  const disabledQuota = await client.quota.getUserQuota(TEST_UID);
  if (disabledQuota.enabled) throw new Error('Expected user quota to be disabled');
  if (disabledQuota.maxSize !== ONE_GB) {
    throw new Error('Expected maxSize to be preserved after disable');
  }
  if (disabledQuota.maxObjects !== -1) {
    throw new Error('Expected maxObjects to be preserved after disable');
  }
  console.log('   Disabled (values preserved)');

  // 6. Re-enable user quota
  console.log('\n6. Re-enabling user quota...');
  await client.quota.enableUserQuota(TEST_UID);
  const reenabledQuota = await client.quota.getUserQuota(TEST_UID);
  if (!reenabledQuota.enabled) throw new Error('Expected user quota to be re-enabled');
  if (reenabledQuota.maxSize !== ONE_GB) {
    throw new Error('Expected maxSize to be preserved after re-enable');
  }
  console.log('   Re-enabled (values still preserved)');

  // ── Bucket Quota ────────────────────────────────────

  // 7. Get default bucket quota (should be disabled)
  console.log('\n7. Getting default bucket quota...');
  const defaultBucketQuota = await client.quota.getBucketQuota(TEST_UID);
  if (defaultBucketQuota.enabled) {
    throw new Error('Expected bucket quota to be disabled by default');
  }
  console.log(`   Enabled: ${defaultBucketQuota.enabled}`);

  // 8. Set bucket quota
  console.log('\n8. Setting bucket quota (1G, 10k objects)...');
  await client.quota.setBucketQuota({
    uid: TEST_UID,
    maxSize: '1G',
    maxObjects: 10000,
  });
  console.log('   Set successfully');

  // 9. Verify bucket quota — check both fields
  console.log('\n9. Verifying bucket quota...');
  const bucketQuota = await client.quota.getBucketQuota(TEST_UID);
  if (!bucketQuota.enabled) throw new Error('Expected bucket quota to be enabled');
  if (bucketQuota.maxSize !== ONE_GB) {
    throw new Error(`Expected maxSize=${ONE_GB} (1G), got ${bucketQuota.maxSize}`);
  }
  if (bucketQuota.maxObjects !== 10000) {
    throw new Error(`Expected maxObjects=10000, got ${bucketQuota.maxObjects}`);
  }
  console.log(
    `   Enabled: ${bucketQuota.enabled}, maxSize: ${bucketQuota.maxSize}, maxObjects: ${bucketQuota.maxObjects}`,
  );

  // 10. Disable bucket quota
  console.log('\n10. Disabling bucket quota...');
  await client.quota.disableBucketQuota(TEST_UID);
  const disabledBucket = await client.quota.getBucketQuota(TEST_UID);
  if (disabledBucket.enabled) throw new Error('Expected bucket quota to be disabled');
  if (disabledBucket.maxObjects !== 10000) {
    throw new Error('Expected bucket quota values to be preserved after disable');
  }
  console.log('   Disabled (values preserved)');

  // 11. Re-enable bucket quota
  console.log('\n11. Re-enabling bucket quota...');
  await client.quota.enableBucketQuota(TEST_UID);
  const reenabledBucket = await client.quota.getBucketQuota(TEST_UID);
  if (!reenabledBucket.enabled) throw new Error('Expected bucket quota to be re-enabled');
  console.log('   Re-enabled');

  // ── Error Paths ──────────────────────────────────────

  // 12. getUserQuota on non-existent user
  console.log('\n12. Getting user quota for non-existent user...');
  try {
    await client.quota.getUserQuota('non-existent-user-xyz');
    throw new Error('Expected RGWNotFoundError but call succeeded');
  } catch (err) {
    if (err instanceof RGWNotFoundError) {
      console.log('   Confirmed: RGWNotFoundError thrown');
    } else if (err instanceof Error && err.message.includes('Expected RGWNotFoundError')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // 13. setUserQuota on non-existent user
  console.log('\n13. Setting user quota for non-existent user...');
  try {
    await client.quota.setUserQuota({ uid: 'non-existent-user-xyz', maxSize: '1G' });
    throw new Error('Expected RGWNotFoundError but call succeeded');
  } catch (err) {
    if (err instanceof RGWNotFoundError) {
      console.log('   Confirmed: RGWNotFoundError thrown');
    } else if (err instanceof Error && err.message.includes('Expected RGWNotFoundError')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // ── Cleanup ─────────────────────────────────────────

  console.log('\n14. Cleaning up test user...');
  await client.users.delete({ uid: TEST_UID, purgeData: true });
  console.log('   Deleted.');

  console.log('\n=== All tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  client.users.delete({ uid: TEST_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
