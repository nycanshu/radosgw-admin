/**
 * Integration Test: Keys & Subusers Module
 *
 * Tests key rotation and subuser lifecycle against a live RGW server.
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-keys-subusers.ts
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

const TEST_UID = `test-keys-${Date.now()}`;

async function run() {
  console.log('=== Integration Test: Keys & Subusers Module ===\n');

  // 0. Create a test user first
  console.log('0. Creating test user...');
  const user = await client.users.create({
    uid: TEST_UID,
    displayName: 'Keys Test User',
  });
  const originalKey = user.keys[0]!.accessKey;
  console.log(`   Created user "${TEST_UID}" with key: ${originalKey}`);

  // ── Keys ──────────────────────────────────────────────

  // 1. Create a new key (key rotation step 1)
  console.log('\n1. Creating new S3 key...');
  const keysAfterCreate = await client.keys.generate({ uid: TEST_UID });
  console.log(`   User now has ${keysAfterCreate.length} keys`);
  const newKey = keysAfterCreate.find((k) => k.accessKey !== originalKey);
  if (!newKey) throw new Error('New key not found after creation');
  console.log(`   New key: ${newKey.accessKey}`);

  // 2. Delete the old key (key rotation step 2)
  console.log('\n2. Deleting old key (rotation)...');
  await client.keys.revoke({ accessKey: originalKey });
  console.log(`   Deleted key: ${originalKey}`);

  // 3. Verify only new key remains
  console.log('\n3. Verifying key rotation...');
  const userAfterRotation = await client.users.get(TEST_UID);
  if (userAfterRotation.keys.length !== 1) {
    throw new Error(`Expected 1 key, got ${userAfterRotation.keys.length}`);
  }
  if (userAfterRotation.keys[0]!.accessKey !== newKey.accessKey) {
    throw new Error('Remaining key does not match new key');
  }
  console.log(`   Confirmed: 1 key remaining (${newKey.accessKey})`);

  // ── Subusers ──────────────────────────────────────────

  // 4. Create a subuser
  console.log('\n4. Creating subuser...');
  const subusers = await client.subusers.create({
    uid: TEST_UID,
    subuser: `${TEST_UID}:swift`,
    access: 'readwrite',
    keyType: 'swift',
    generateSecret: true,
  });
  console.log(`   Created subuser: ${subusers[0]!.id} (${subusers[0]!.permissions})`);

  // 5. Modify subuser access
  console.log('\n5. Modifying subuser access...');
  const modifiedSubusers = await client.subusers.modify({
    uid: TEST_UID,
    subuser: `${TEST_UID}:swift`,
    access: 'full',
  });
  console.log(`   Modified: ${modifiedSubusers[0]!.id} → ${modifiedSubusers[0]!.permissions}`);

  // 6. Verify subuser on user object
  console.log('\n6. Verifying subuser on user...');
  const userWithSubuser = await client.users.get(TEST_UID);
  const sub = userWithSubuser.subusers.find((s) => s.id === `${TEST_UID}:swift`);
  if (!sub) throw new Error('Subuser not found on user object');
  console.log(`   Found subuser: ${sub.id} (${sub.permissions})`);

  // 7. Delete subuser
  console.log('\n7. Deleting subuser...');
  await client.subusers.remove({
    uid: TEST_UID,
    subuser: `${TEST_UID}:swift`,
    purgeKeys: true,
  });
  console.log('   Deleted.');

  // 8. Verify subuser removed
  console.log('\n8. Verifying subuser removed...');
  const userAfterDelete = await client.users.get(TEST_UID);
  const removedSub = userAfterDelete.subusers.find((s) => s.id === `${TEST_UID}:swift`);
  if (removedSub) throw new Error('Subuser still exists after deletion');
  console.log('   Confirmed: subuser removed');

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
