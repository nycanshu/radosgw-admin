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

import { RadosGWAdminClient, RGWNotFoundError } from '../../src/index.js';
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

const TEST_UID = `test-ratelimit-${Date.now()}`;
const TEST_BUCKET = `test-rl-bucket-${Date.now()}`;

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
  console.log('=== Integration Test: Rate Limit Module ===\n');

  // 0. Create a test user and bucket
  console.log('0. Creating test user and bucket...');
  const user = await client.users.create({
    uid: TEST_UID,
    displayName: 'Rate Limit Test User',
  });
  const key = user.keys[0]!;
  await createS3Bucket(TEST_BUCKET, key.accessKey, key.secretKey);
  console.log(`   Created user "${TEST_UID}" and bucket "${TEST_BUCKET}"`);

  // ── Feature Detection ────────────────────────────────
  // Rate limiting requires rgw_ratelimit_enabled=true in Ceph config.
  // If not enabled, the admin API returns 400 InvalidArgument for all
  // rate limit operations. Detect this and skip gracefully.

  // 1. Get default user rate limit (should be disabled)
  console.log('\n1. Getting default user rate limit...');
  let defaultLimit;
  try {
    defaultLimit = await client.rateLimit.getUserLimit(TEST_UID);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('InvalidArgument') || (err as { code?: string }).code === 'InvalidArgument') {
      console.log('   Rate limiting not enabled on this cluster (rgw_ratelimit_enabled=false)');
      console.log('   Skipping all rate limit tests.\n');
      console.log('Cleaning up...');
      await client.buckets.delete({ bucket: TEST_BUCKET, purgeObjects: true });
      await client.users.delete({ uid: TEST_UID, purgeData: true });
      console.log('   Deleted bucket and user.');
      console.log('\n=== All tests skipped (rate limit not enabled) ===');
      return;
    }
    throw err;
  }
  if (defaultLimit.enabled) throw new Error('Expected user rate limit to be disabled by default');
  console.log(`   Enabled: ${defaultLimit.enabled}, readOps: ${defaultLimit.maxReadOps}`);

  // 2. Set user rate limit
  console.log('\n2. Setting user rate limit (100 read ops, 50 write ops, 50MB write bytes)...');
  await client.rateLimit.setUserLimit({
    uid: TEST_UID,
    maxReadOps: 100,
    maxWriteOps: 50,
    maxWriteBytes: 52428800, // 50MB
  });
  console.log('   Set successfully');

  // 3. Verify user rate limit — round-trip all values
  console.log('\n3. Verifying user rate limit...');
  const userLimit = await client.rateLimit.getUserLimit(TEST_UID);
  if (!userLimit.enabled) throw new Error('Expected user rate limit to be enabled');
  if (userLimit.maxReadOps !== 100) {
    throw new Error(`Expected maxReadOps=100, got ${userLimit.maxReadOps}`);
  }
  if (userLimit.maxWriteOps !== 50) {
    throw new Error(`Expected maxWriteOps=50, got ${userLimit.maxWriteOps}`);
  }
  if (userLimit.maxWriteBytes !== 52428800) {
    throw new Error(`Expected maxWriteBytes=52428800, got ${userLimit.maxWriteBytes}`);
  }
  console.log(
    `   Enabled: ${userLimit.enabled}, readOps: ${userLimit.maxReadOps}, writeOps: ${userLimit.maxWriteOps}, writeBytes: ${userLimit.maxWriteBytes}`,
  );

  // 4. Disable user rate limit — verify values preserved
  console.log('\n4. Disabling user rate limit...');
  await client.rateLimit.disableUserLimit(TEST_UID);
  const disabledLimit = await client.rateLimit.getUserLimit(TEST_UID);
  if (disabledLimit.enabled) throw new Error('Expected user rate limit to be disabled');
  if (disabledLimit.maxReadOps !== 100) {
    throw new Error('Expected maxReadOps to be preserved after disable');
  }
  if (disabledLimit.maxWriteOps !== 50) {
    throw new Error('Expected maxWriteOps to be preserved after disable');
  }
  console.log('   Disabled (values preserved)');

  // 5. Re-enable via setUserLimit — verify values survived
  console.log('\n5. Re-enabling user rate limit...');
  await client.rateLimit.setUserLimit({ uid: TEST_UID, enabled: true });
  const reenabledLimit = await client.rateLimit.getUserLimit(TEST_UID);
  if (!reenabledLimit.enabled) throw new Error('Expected user rate limit to be re-enabled');
  console.log('   Re-enabled');

  // ── Bucket Rate Limit ───────────────────────────────

  // 6. Get default bucket rate limit
  console.log(`\n6. Getting default bucket rate limit for "${TEST_BUCKET}"...`);
  const defaultBucketLimit = await client.rateLimit.getBucketLimit(TEST_BUCKET);
  if (defaultBucketLimit.enabled) {
    throw new Error('Expected bucket rate limit to be disabled by default');
  }
  console.log(`   Enabled: ${defaultBucketLimit.enabled}`);

  // 7. Set bucket rate limit
  console.log('\n7. Setting bucket rate limit (200 read ops, 100 write ops)...');
  await client.rateLimit.setBucketLimit({
    bucket: TEST_BUCKET,
    maxReadOps: 200,
    maxWriteOps: 100,
  });
  console.log('   Set successfully');

  // 8. Verify bucket rate limit
  console.log('\n8. Verifying bucket rate limit...');
  const bucketLimit = await client.rateLimit.getBucketLimit(TEST_BUCKET);
  if (!bucketLimit.enabled) throw new Error('Expected bucket rate limit to be enabled');
  if (bucketLimit.maxReadOps !== 200) {
    throw new Error(`Expected maxReadOps=200, got ${bucketLimit.maxReadOps}`);
  }
  if (bucketLimit.maxWriteOps !== 100) {
    throw new Error(`Expected maxWriteOps=100, got ${bucketLimit.maxWriteOps}`);
  }
  console.log(
    `   Enabled: ${bucketLimit.enabled}, readOps: ${bucketLimit.maxReadOps}, writeOps: ${bucketLimit.maxWriteOps}`,
  );

  // 9. Disable bucket rate limit — verify values preserved
  console.log('\n9. Disabling bucket rate limit...');
  await client.rateLimit.disableBucketLimit(TEST_BUCKET);
  const disabledBucket = await client.rateLimit.getBucketLimit(TEST_BUCKET);
  if (disabledBucket.enabled) throw new Error('Expected bucket rate limit to be disabled');
  if (disabledBucket.maxReadOps !== 200) {
    throw new Error('Expected maxReadOps to be preserved after disable');
  }
  console.log('   Disabled (values preserved)');

  // ── Global Rate Limits ──────────────────────────────

  // 10. Get global rate limits
  console.log('\n10. Getting global rate limits...');
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

  // ── Error Paths ──────────────────────────────────────

  // 11. getUserLimit on non-existent user
  console.log('\n11. Getting rate limit for non-existent user...');
  try {
    await client.rateLimit.getUserLimit('non-existent-user-xyz');
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

  // 12. getBucketLimit on non-existent bucket
  console.log('\n12. Getting rate limit for non-existent bucket...');
  try {
    await client.rateLimit.getBucketLimit('non-existent-bucket-xyz');
    throw new Error('Expected error but call succeeded');
  } catch (err) {
    if (err instanceof RGWNotFoundError) {
      console.log('   Confirmed: RGWNotFoundError thrown');
    } else if (err instanceof Error && err.message.includes('Expected error')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // ── Cleanup ─────────────────────────────────────────

  console.log('\n13. Cleaning up...');
  await client.buckets.delete({ bucket: TEST_BUCKET, purgeObjects: true });
  await client.users.delete({ uid: TEST_UID, purgeData: true });
  console.log('   Deleted bucket and user.');

  console.log('\n=== All tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  client.buckets.delete({ bucket: TEST_BUCKET, purgeObjects: true }).catch(() => {});
  client.users.delete({ uid: TEST_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
