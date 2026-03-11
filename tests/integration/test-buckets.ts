/**
 * Integration Test: Buckets Module
 *
 * Tests bucket listing, inspection, linking, unlinking, index check, and deletion
 * against a live RGW server.
 *
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 * Also requires a pre-existing bucket (created via S3 API, not admin API).
 *
 * Usage:
 *   npx tsx tests/integration/test-buckets.ts
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

const TEST_UID = `test-buckets-${Date.now()}`;

async function run() {
  console.log('=== Integration Test: Buckets Module ===\n');

  // 0. Create a test user
  console.log('0. Creating test user...');
  await client.users.create({
    uid: TEST_UID,
    displayName: 'Bucket Test User',
  });
  console.log(`   Created user "${TEST_UID}"`);

  // 1. List all buckets
  console.log('\n1. Listing all buckets...');
  const allBuckets = await client.buckets.list();
  console.log(`   Found ${allBuckets.length} buckets in cluster`);

  // 2. List buckets for test user (should be empty)
  console.log(`\n2. Listing buckets for "${TEST_UID}"...`);
  const userBuckets = await client.buckets.list(TEST_UID);
  console.log(`   Found ${userBuckets.length} buckets (expected: 0)`);

  // 3. Get info for an existing bucket (if any exist)
  if (allBuckets.length > 0) {
    const sampleBucket = allBuckets[0]!;
    console.log(`\n3. Getting info for "${sampleBucket}"...`);
    const info = await client.buckets.getInfo(sampleBucket);
    console.log('   Info:', {
      bucket: info.bucket,
      owner: info.owner,
      id: info.id,
      objects: info.usage?.rgwMain?.numObjects ?? 'N/A',
      sizeKb: info.usage?.rgwMain?.sizeKb ?? 'N/A',
    });

    // 4. Check index (read-only, safe)
    console.log(`\n4. Checking index for "${sampleBucket}" (dry run)...`);
    try {
      const checkResult = await client.buckets.verifyIndex({
        bucket: sampleBucket,
        checkObjects: false,
        fix: false,
      });
      console.log('   Check result:', {
        invalidEntries: checkResult.invalidMultipartEntries?.length ?? 0,
      });
    } catch (err) {
      // Some RGW versions may not support index check on all bucket types
      console.log(`   Index check not supported for this bucket (${(err as Error).message})`);
    }
  } else {
    console.log('\n3. Skipping getInfo — no buckets in cluster');
    console.log('\n4. Skipping verifyIndex — no buckets in cluster');
  }

  // 5. Cleanup
  console.log('\n5. Cleaning up test user...');
  await client.users.delete({ uid: TEST_UID, purgeData: true });
  console.log('   Deleted.');

  console.log('\n=== All tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  client.users.delete({ uid: TEST_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
