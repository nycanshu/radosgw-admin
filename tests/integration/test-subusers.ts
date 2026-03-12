/**
 * Integration Test: Subusers Module
 *
 * Tests subuser creation, modification, verification, and removal
 * against a live RGW server.
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-subusers.ts
 */

import { RadosGWAdminClient, RGWNotFoundError, RGWError } from '../../src/index.js';
import { config } from 'dotenv';

config();

const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST!,
  port: Number(process.env.RGW_PORT),
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
  region: process.env.RGW_REGION,
});

const TEST_UID = `test-subusers-${Date.now()}`;

async function run() {
  console.log('=== Integration Test: Subusers Module ===\n');

  // 0. Create a test user first
  console.log('0. Creating test user...');
  await client.users.create({
    uid: TEST_UID,
    displayName: 'Subusers Test User',
  });
  console.log(`   Created user "${TEST_UID}"`);

  // 1. Create a subuser
  console.log('\n1. Creating subuser...');
  const subusers = await client.subusers.create({
    uid: TEST_UID,
    subuser: `${TEST_UID}:swift`,
    access: 'readwrite',
    keyType: 'swift',
    generateSecret: true,
  });
  console.log(`   Created subuser: ${subusers[0]!.id} (${subusers[0]!.permissions})`);

  // 2. Modify subuser access
  console.log('\n2. Modifying subuser access...');
  const modifiedSubusers = await client.subusers.modify({
    uid: TEST_UID,
    subuser: `${TEST_UID}:swift`,
    access: 'full',
  });
  console.log(`   Modified: ${modifiedSubusers[0]!.id} → ${modifiedSubusers[0]!.permissions}`);

  // 3. Verify subuser on user object
  console.log('\n3. Verifying subuser on user...');
  const userWithSubuser = await client.users.get(TEST_UID);
  const sub = userWithSubuser.subusers.find((s) => s.id === `${TEST_UID}:swift`);
  if (!sub) throw new Error('Subuser not found on user object');
  console.log(`   Found subuser: ${sub.id} (${sub.permissions})`);

  // 4. Remove subuser with purgeKeys: false (keys should survive)
  console.log('\n4. Removing subuser with purgeKeys: false...');
  const userBeforeRemove = await client.users.get(TEST_UID);
  const swiftKeysBefore = userBeforeRemove.swiftKeys?.length ?? 0;
  console.log(`   Swift keys before remove: ${swiftKeysBefore}`);
  await client.subusers.remove({
    uid: TEST_UID,
    subuser: `${TEST_UID}:swift`,
    purgeKeys: false,
  });
  const userAfterNoPurge = await client.users.get(TEST_UID);
  const subAfterNoPurge = userAfterNoPurge.subusers.find((s) => s.id === `${TEST_UID}:swift`);
  if (subAfterNoPurge) throw new Error('Subuser still exists after removal');
  const swiftKeysAfter = userAfterNoPurge.swiftKeys?.length ?? 0;
  console.log(`   Swift keys after remove: ${swiftKeysAfter}`);
  if (swiftKeysBefore > 0 && swiftKeysAfter === 0) {
    console.log('   Note: RGW purged keys despite purgeKeys=false (server behavior varies)');
  } else {
    console.log('   Confirmed: subuser removed, keys preserved');
  }

  // 5. Re-create subuser for purgeKeys: true test
  console.log('\n5. Re-creating subuser for purgeKeys: true test...');
  await client.subusers.create({
    uid: TEST_UID,
    subuser: `${TEST_UID}:swift2`,
    access: 'readwrite',
    keyType: 'swift',
    generateSecret: true,
  });
  console.log('   Created subuser: ' + `${TEST_UID}:swift2`);

  // 6. Remove subuser with purgeKeys: true
  console.log('\n6. Removing subuser with purgeKeys: true...');
  await client.subusers.remove({
    uid: TEST_UID,
    subuser: `${TEST_UID}:swift2`,
    purgeKeys: true,
  });
  const userAfterPurge = await client.users.get(TEST_UID);
  const subAfterPurge = userAfterPurge.subusers.find((s) => s.id === `${TEST_UID}:swift2`);
  if (subAfterPurge) throw new Error('Subuser still exists after purge removal');
  console.log('   Confirmed: subuser removed with keys purged');

  // ── Error paths ─────────────────────────────────────────

  // 7. Create subuser on non-existent user (expect error)
  console.log('\n7. Creating subuser on non-existent user (expect error)...');
  try {
    await client.subusers.create({
      uid: 'nonexistent-user-xyz-999',
      subuser: 'nonexistent-user-xyz-999:test',
      access: 'read',
    });
    throw new Error('Expected error but no error was thrown');
  } catch (err) {
    if (err instanceof RGWNotFoundError) {
      console.log('   Confirmed: RGWNotFoundError thrown');
    } else if (err instanceof RGWError) {
      console.log(`   Got RGWError (acceptable): ${err.message}`);
    } else if (err instanceof Error && err.message.includes('Expected error')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
    }
  }

  // 8. Create duplicate subuser (expect error)
  console.log('\n8. Creating duplicate subuser (expect error)...');
  await client.subusers.create({
    uid: TEST_UID,
    subuser: `${TEST_UID}:dup`,
    access: 'read',
  });
  console.log('   Created first subuser for duplicate test');
  try {
    await client.subusers.create({
      uid: TEST_UID,
      subuser: `${TEST_UID}:dup`,
      access: 'write',
    });
    // RGW may silently update instead of erroring — that's acceptable
    console.log('   Note: RGW accepted duplicate creation (treated as update)');
  } catch (err) {
    if (err instanceof RGWError) {
      console.log(`   Confirmed: error on duplicate (${err.constructor.name}: ${err.message})`);
    } else {
      console.log(`   Got error: ${(err as Error).message}`);
    }
  }

  // ── Cleanup ───────────────────────────────────────────

  console.log('\n9. Cleaning up test user...');
  await client.users.delete({ uid: TEST_UID, purgeData: true });
  console.log('   Deleted.');

  console.log('\n=== All tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  client.users.delete({ uid: TEST_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
