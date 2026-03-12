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

  // 4. Delete subuser
  console.log('\n4. Deleting subuser...');
  await client.subusers.remove({
    uid: TEST_UID,
    subuser: `${TEST_UID}:swift`,
    purgeKeys: true,
  });
  console.log('   Deleted.');

  // 5. Verify subuser removed
  console.log('\n5. Verifying subuser removed...');
  const userAfterDelete = await client.users.get(TEST_UID);
  const removedSub = userAfterDelete.subusers.find((s) => s.id === `${TEST_UID}:swift`);
  if (removedSub) throw new Error('Subuser still exists after deletion');
  console.log('   Confirmed: subuser removed');

  // ── Cleanup ───────────────────────────────────────────

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
