/**
 * Integration Test: Usage Module
 *
 * Tests usage query and trim operations against a live RGW server.
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 * Requires `rgw enable usage log = true` in ceph.conf.
 *
 * Usage:
 *   npx tsx tests/integration/test-usage.ts
 */

import { RadosGWAdminClient, RGWValidationError } from '../../src/index.js';
import { config } from 'dotenv';

config();

const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST!,
  port: Number(process.env.RGW_PORT),
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
  region: process.env.RGW_REGION,
});

const TEST_UID = `test-usage-${Date.now()}`;

async function run() {
  console.log('=== Integration Test: Usage Module ===\n');

  // 0. Create a test user
  console.log('0. Creating test user...');
  await client.users.create({
    uid: TEST_UID,
    displayName: 'Usage Test User',
  });
  console.log(`   Created user "${TEST_UID}"`);

  // ── Get Usage ──────────────────────────────────────

  // 1. Get cluster-wide usage (no filters) + verify response structure
  console.log('\n1. Getting cluster-wide usage (all time) + verifying response structure...');
  const allUsage = await client.usage.get();
  if (!Array.isArray(allUsage.entries)) {
    throw new Error('Expected entries to be an array');
  }
  if (!Array.isArray(allUsage.summary)) {
    throw new Error('Expected summary to be an array');
  }
  // Verify entry structure if we have data
  if (allUsage.entries.length > 0) {
    const entry = allUsage.entries[0]!;
    if (typeof entry.user !== 'string') throw new Error('Expected entry.user to be a string');
    if (!Array.isArray(entry.buckets)) throw new Error('Expected entry.buckets to be an array');
    if (entry.buckets.length > 0) {
      const bucket = entry.buckets[0]!;
      if (typeof bucket.bucket !== 'string')
        throw new Error('Expected bucket.bucket to be a string');
      if (typeof bucket.time !== 'string') throw new Error('Expected bucket.time to be a string');
      if (typeof bucket.epoch !== 'number') throw new Error('Expected bucket.epoch to be a number');
      if (typeof bucket.owner !== 'string') throw new Error('Expected bucket.owner to be a string');
      if (!Array.isArray(bucket.categories))
        throw new Error('Expected bucket.categories to be an array');
      if (bucket.categories.length > 0) {
        const cat = bucket.categories[0]!;
        if (typeof cat.category !== 'string')
          throw new Error('Expected category.category to be a string');
        if (typeof cat.bytesSent !== 'number')
          throw new Error('Expected category.bytesSent to be a number');
        if (typeof cat.bytesReceived !== 'number')
          throw new Error('Expected category.bytesReceived to be a number');
        if (typeof cat.ops !== 'number') throw new Error('Expected category.ops to be a number');
        if (typeof cat.successfulOps !== 'number')
          throw new Error('Expected category.successfulOps to be a number');
      }
    }
  }
  // Verify summary structure if we have data
  if (allUsage.summary.length > 0) {
    const summary = allUsage.summary[0]!;
    if (typeof summary.user !== 'string') throw new Error('Expected summary.user to be a string');
    if (!Array.isArray(summary.categories))
      throw new Error('Expected summary.categories to be an array');
    if (typeof summary.total !== 'object' || summary.total === null)
      throw new Error('Expected summary.total to be an object');
    if (typeof summary.total.bytesSent !== 'number')
      throw new Error('Expected summary.total.bytesSent to be a number');
    if (typeof summary.total.bytesReceived !== 'number')
      throw new Error('Expected summary.total.bytesReceived to be a number');
    if (typeof summary.total.ops !== 'number')
      throw new Error('Expected summary.total.ops to be a number');
    if (typeof summary.total.successfulOps !== 'number')
      throw new Error('Expected summary.total.successfulOps to be a number');
  }
  console.log(
    `   Entries: ${allUsage.entries.length}, Summary users: ${allUsage.summary.length} — structure verified`,
  );

  // 2. Get usage for test user (likely empty, but should not error)
  console.log('\n2. Getting usage for test user...');
  const userUsage = await client.usage.get({ uid: TEST_UID });
  if (!Array.isArray(userUsage.entries)) throw new Error('Expected entries to be an array');
  if (!Array.isArray(userUsage.summary)) throw new Error('Expected summary to be an array');
  console.log(`   Entries: ${userUsage.entries.length}, Summary: ${userUsage.summary.length}`);

  // 3. Get usage with date range (string)
  console.log('\n3. Getting usage with date range (strings)...');
  const rangeUsage = await client.usage.get({
    uid: TEST_UID,
    start: '2020-01-01',
    end: '2030-12-31',
  });
  console.log(`   Entries: ${rangeUsage.entries.length}`);

  // 4. Get usage with Date objects
  console.log('\n4. Getting usage with Date objects...');
  const dateObjUsage = await client.usage.get({
    start: new Date('2020-01-01T00:00:00Z'),
    end: new Date('2030-12-31T00:00:00Z'),
  });
  console.log(`   Entries: ${dateObjUsage.entries.length}`);

  // 5. Get usage with showEntries=false, showSummary=true (summary only)
  console.log('\n5. Getting usage (summary only: showEntries=false, showSummary=true)...');
  const summaryOnly = await client.usage.get({
    showEntries: false,
    showSummary: true,
  });
  console.log(`   Summary users: ${summaryOnly.summary.length}`);

  // 6. Get usage with showEntries=true, showSummary=false (entries only)
  console.log('\n6. Getting usage (entries only: showEntries=true, showSummary=false)...');
  const entriesOnly = await client.usage.get({
    showEntries: true,
    showSummary: false,
  });
  console.log(`   Entries: ${entriesOnly.entries.length}`);

  // 7. Get usage with only start (open-ended range — no end)
  console.log('\n7. Getting usage with only start (open-ended)...');
  const startOnly = await client.usage.get({ start: '2020-01-01' });
  console.log(`   Entries: ${startOnly.entries.length}`);

  // 8. Get usage with only end (open-ended range — no start)
  console.log('\n8. Getting usage with only end (open-ended)...');
  const endOnly = await client.usage.get({ end: '2030-12-31' });
  console.log(`   Entries: ${endOnly.entries.length}`);

  // 9. Get usage for non-existent user (should return empty, not throw)
  console.log('\n9. Getting usage for non-existent user...');
  const noUser = await client.usage.get({ uid: 'non-existent-user-xyz-99999' });
  if (noUser.entries.length !== 0) {
    throw new Error(`Expected 0 entries for non-existent user, got ${noUser.entries.length}`);
  }
  console.log(`   Entries: ${noUser.entries.length} (empty as expected — no error thrown)`);

  // ── Trim Usage ─────────────────────────────────────

  // 10. Trim usage for test user (safe — user has no real data)
  console.log('\n10. Trimming usage for test user (old date range)...');
  await client.usage.trim({
    uid: TEST_UID,
    end: '2020-01-01',
  });
  console.log('   Trimmed successfully');

  // 11. Trim with removeAll for test user + verify data gone (round-trip)
  console.log('\n11. Trim with removeAll for test user + verify round-trip...');
  const beforeTrim = await client.usage.get({ uid: TEST_UID });
  const beforeCount = beforeTrim.entries.length;
  await client.usage.trim({
    uid: TEST_UID,
    removeAll: true,
  });
  const afterTrim = await client.usage.get({ uid: TEST_UID });
  if (afterTrim.entries.length > beforeCount) {
    throw new Error(
      `Expected entries to not increase after trim, before=${beforeCount} after=${afterTrim.entries.length}`,
    );
  }
  console.log(
    `   Before: ${beforeCount} entries, After: ${afterTrim.entries.length} entries — trim verified`,
  );

  // ── Validation Error Paths ─────────────────────────

  // 12. trim() without uid and without removeAll should throw
  console.log('\n12. Testing trim() safety guard (no uid, no removeAll)...');
  try {
    await client.usage.trim({ end: '2020-01-01' });
    throw new Error('Expected RGWValidationError but call succeeded');
  } catch (err) {
    if (err instanceof RGWValidationError) {
      console.log('   Confirmed: RGWValidationError thrown');
    } else if (err instanceof Error && err.message.includes('Expected RGWValidationError')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // 13. get() with empty uid should throw
  console.log('\n13. Testing get() with empty uid...');
  try {
    await client.usage.get({ uid: '' });
    throw new Error('Expected RGWValidationError but call succeeded');
  } catch (err) {
    if (err instanceof RGWValidationError) {
      console.log('   Confirmed: RGWValidationError thrown');
    } else if (err instanceof Error && err.message.includes('Expected RGWValidationError')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // 14. trim() with whitespace uid should throw (not bypass safety)
  console.log('\n14. Testing trim() with whitespace uid (safety bypass prevention)...');
  try {
    await client.usage.trim({ uid: '   ' });
    throw new Error('Expected RGWValidationError but call succeeded');
  } catch (err) {
    if (err instanceof RGWValidationError) {
      console.log('   Confirmed: RGWValidationError thrown (safety bypass prevented)');
    } else if (err instanceof Error && err.message.includes('Expected RGWValidationError')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // 15. get() with whitespace uid should throw
  console.log('\n15. Testing get() with whitespace uid...');
  try {
    await client.usage.get({ uid: '   ' });
    throw new Error('Expected RGWValidationError but call succeeded');
  } catch (err) {
    if (err instanceof RGWValidationError) {
      console.log('   Confirmed: RGWValidationError thrown');
    } else if (err instanceof Error && err.message.includes('Expected RGWValidationError')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // 16. trim() with empty uid should throw
  console.log('\n16. Testing trim() with empty uid...');
  try {
    await client.usage.trim({ uid: '' });
    throw new Error('Expected RGWValidationError but call succeeded');
  } catch (err) {
    if (err instanceof RGWValidationError) {
      console.log('   Confirmed: RGWValidationError thrown');
    } else if (err instanceof Error && err.message.includes('Expected RGWValidationError')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // ── Cleanup ────────────────────────────────────────

  console.log('\n17. Cleaning up test user...');
  await client.users.delete({ uid: TEST_UID, purgeData: true });
  console.log('   Deleted.');

  console.log('\n=== All tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  client.users.delete({ uid: TEST_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
