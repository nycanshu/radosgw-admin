/**
 * Integration Test: Buckets Module
 *
 * Tests bucket listing, inspection, ownership transfer, index check,
 * and deletion against a live RGW server.
 *
 * Creates a test bucket via the S3 API (using our own signer) to enable
 * full lifecycle testing without external dependencies.
 *
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-buckets.ts
 */

import { RadosGWAdminClient, RGWNotFoundError, RGWError } from '../../src/index.js';
import { signRequest } from '../../src/signer.js';
import { config } from 'dotenv';

config();

const HOST = process.env.RGW_HOST!;
const PORT = Number(process.env.RGW_PORT);
const ACCESS_KEY = process.env.RGW_ACCESS_KEY!;
const SECRET_KEY = process.env.RGW_SECRET_KEY!;
const REGION = process.env.RGW_REGION ?? 'us-east-1';

const client = new RadosGWAdminClient({
  host: HOST,
  port: PORT,
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
  region: REGION,
});

const TEST_UID_A = `test-buckets-a-${Date.now()}`;
const TEST_UID_B = `test-buckets-b-${Date.now()}`;
const TEST_BUCKET = `test-bucket-${Date.now()}`;

/**
 * Creates a bucket via the S3 API using our signer.
 */
async function createS3Bucket(
  bucketName: string,
  accessKey: string,
  secretKey: string,
): Promise<void> {
  const baseUrl = PORT ? `${HOST}:${PORT}` : HOST;
  const url = new URL(`/${bucketName}`, baseUrl);

  const headers: Record<string, string> = {
    'Content-Type': 'application/xml',
  };

  const signedHeaders = signRequest({
    method: 'PUT',
    url,
    headers,
    accessKey,
    secretKey,
    region: REGION,
  });

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: { ...headers, ...signedHeaders },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create bucket "${bucketName}": ${response.status} ${text}`);
  }
}

async function run() {
  console.log('=== Integration Test: Buckets Module ===\n');

  // 0. Create two test users (A for bucket owner, B for ownership transfer)
  console.log('0. Creating test users...');
  const userA = await client.users.create({
    uid: TEST_UID_A,
    displayName: 'Bucket Test User A',
  });
  await client.users.create({
    uid: TEST_UID_B,
    displayName: 'Bucket Test User B',
  });
  const keyA = userA.keys[0]!;
  console.log(`   Created users "${TEST_UID_A}" and "${TEST_UID_B}"`);

  // 1. Create a bucket via S3 API using user A's credentials
  console.log(`\n1. Creating bucket "${TEST_BUCKET}" via S3 API...`);
  await createS3Bucket(TEST_BUCKET, keyA.accessKey, keyA.secretKey);
  console.log(`   Created bucket "${TEST_BUCKET}"`);

  // 2. List all buckets (should include test bucket)
  console.log('\n2. Listing all buckets...');
  const allBuckets = await client.buckets.list();
  console.log(`   Found ${allBuckets.length} buckets in cluster`);
  if (!allBuckets.includes(TEST_BUCKET)) {
    throw new Error(`Test bucket "${TEST_BUCKET}" not found in cluster list`);
  }
  console.log(`   Confirmed: "${TEST_BUCKET}" present in list`);

  // 3. List buckets for user A (should include test bucket)
  console.log(`\n3. Listing buckets for "${TEST_UID_A}"...`);
  const userBuckets = await client.buckets.listByUser(TEST_UID_A);
  if (!userBuckets.includes(TEST_BUCKET)) {
    throw new Error('Test bucket not found in user A bucket list');
  }
  console.log(`   Found ${userBuckets.length} bucket(s) for user A`);

  // 4. Get bucket info
  console.log(`\n4. Getting info for "${TEST_BUCKET}"...`);
  const info = await client.buckets.getInfo(TEST_BUCKET);
  if (info.owner !== TEST_UID_A) {
    throw new Error(`Expected owner "${TEST_UID_A}", got "${info.owner}"`);
  }
  console.log(`   Owner: ${info.owner}, ID: ${info.id}`);

  // 5. Verify index (dry run)
  console.log(`\n5. Verifying index for "${TEST_BUCKET}" (dry run)...`);
  try {
    const checkResult = await client.buckets.verifyIndex({
      bucket: TEST_BUCKET,
      checkObjects: false,
      fix: false,
    });
    console.log(`   Invalid entries: ${checkResult.invalidMultipartEntries?.length ?? 0}`);
  } catch (err) {
    console.log(`   Index check not supported (${(err as Error).message})`);
  }

  // 6. Transfer ownership to user B
  console.log(`\n6. Transferring ownership to "${TEST_UID_B}"...`);
  await client.buckets.transferOwnership({
    bucket: TEST_BUCKET,
    bucketId: info.id,
    uid: TEST_UID_B,
  });
  const infoAfterTransfer = await client.buckets.getInfo(TEST_BUCKET);
  if (infoAfterTransfer.owner !== TEST_UID_B) {
    throw new Error(`Expected owner "${TEST_UID_B}", got "${infoAfterTransfer.owner}"`);
  }
  console.log(`   Confirmed: owner is now "${infoAfterTransfer.owner}"`);

  // 7. Verify user B now owns the bucket
  console.log('\n7. Verifying user B bucket list...');
  const userBBuckets = await client.buckets.listByUser(TEST_UID_B);
  if (!userBBuckets.includes(TEST_BUCKET)) {
    throw new Error('Test bucket not found in user B bucket list after transfer');
  }
  console.log(`   Confirmed: "${TEST_BUCKET}" in user B's list`);

  // 8. Remove ownership (unlink) — bucket becomes orphaned
  console.log(`\n8. Removing ownership from "${TEST_UID_B}"...`);
  await client.buckets.removeOwnership({
    bucket: TEST_BUCKET,
    uid: TEST_UID_B,
  });
  const userBBucketsAfter = await client.buckets.listByUser(TEST_UID_B);
  if (userBBucketsAfter.includes(TEST_BUCKET)) {
    throw new Error('Test bucket still in user B list after removeOwnership');
  }
  console.log('   Confirmed: bucket unlinked from user B');

  // 9. Re-link to user A so we can delete it cleanly
  console.log(`\n9. Re-linking bucket to "${TEST_UID_A}" for cleanup...`);
  await client.buckets.transferOwnership({
    bucket: TEST_BUCKET,
    bucketId: info.id,
    uid: TEST_UID_A,
  });
  console.log('   Re-linked.');

  // 10. Delete the bucket
  console.log(`\n10. Deleting bucket "${TEST_BUCKET}"...`);
  await client.buckets.delete({ bucket: TEST_BUCKET, purgeObjects: true });
  console.log('   Deleted.');

  // 11. Verify bucket is gone
  console.log('\n11. Verifying bucket is deleted...');
  try {
    await client.buckets.getInfo(TEST_BUCKET);
    throw new Error('Expected RGWNotFoundError but bucket still exists');
  } catch (err) {
    if (err instanceof RGWNotFoundError) {
      console.log('   Confirmed: RGWNotFoundError thrown');
    } else if (err instanceof RGWError) {
      console.log(`   Got RGWError (acceptable): ${err.message}`);
    } else if (err instanceof Error && err.message.includes('Expected RGWNotFoundError')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // ── Cleanup ───────────────────────────────────────────

  console.log('\n12. Cleaning up test users...');
  await client.users.delete({ uid: TEST_UID_A, purgeData: true });
  await client.users.delete({ uid: TEST_UID_B, purgeData: true });
  console.log('   Deleted both test users.');

  console.log('\n=== All tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  // Best-effort cleanup
  client.buckets.delete({ bucket: TEST_BUCKET, purgeObjects: true }).catch(() => {});
  client.users.delete({ uid: TEST_UID_A, purgeData: true }).catch(() => {});
  client.users.delete({ uid: TEST_UID_B, purgeData: true }).catch(() => {});
  process.exit(1);
});
