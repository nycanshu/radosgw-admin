/**
 * Basic User Management — radosgw-admin
 *
 * Demonstrates the full user lifecycle: provisioning, inspection,
 * modification, suspension, statistics, and cleanup.
 *
 * Usage:
 *   RGW_HOST=http://192.168.1.100 \
 *   RGW_ACCESS_KEY=ADMIN_KEY \
 *   RGW_SECRET_KEY=ADMIN_SECRET \
 *   npx tsx examples/basic-user-management.ts
 */

import { RadosGWAdminClient, RGWNotFoundError } from 'radosgw-admin';

// ── Client setup ────────────────────────────────────────────────────
const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST ?? 'http://192.168.1.100',
  accessKey: process.env.RGW_ACCESS_KEY ?? 'ADMIN_ACCESS_KEY',
  secretKey: process.env.RGW_SECRET_KEY ?? 'ADMIN_SECRET_KEY',
});

const TEST_UID = 'demo-alice';

// ── Helpers ─────────────────────────────────────────────────────────
function log(step: string, detail?: unknown) {
  console.log(`\n  [${step}]`, detail ?? '');
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== radosgw-admin · User Management Example ===');

  // 1. Provision a new user
  const user = await client.users.create({
    uid: TEST_UID,
    displayName: 'Alice Example',
    email: 'alice@example.com',
    maxBuckets: 50,
  });
  log('Create', {
    userId: user.userId,
    accessKey: user.keys[0]?.accessKey,
    maxBuckets: user.maxBuckets,
  });

  // 2. Retrieve full user profile (keys, caps, quotas)
  const profile = await client.users.get(TEST_UID);
  log('Get', {
    displayName: profile.displayName,
    email: profile.email,
    keys: profile.keys.length,
    suspended: profile.suspended === 1,
  });

  // 3. Update user properties
  const modified = await client.users.modify({
    uid: TEST_UID,
    displayName: 'Alice (Updated)',
    maxBuckets: 200,
  });
  log('Modify', {
    displayName: modified.displayName,
    maxBuckets: modified.maxBuckets,
  });

  // 4. Suspend access (data preserved, API access denied)
  const suspended = await client.users.suspend(TEST_UID);
  log('Suspend', { suspended: suspended.suspended === 1 });

  // 5. Re-enable the account
  const enabled = await client.users.enable(TEST_UID);
  log('Enable', { suspended: enabled.suspended === 1 });

  // 6. Check storage statistics
  const { stats } = await client.users.getStats({ uid: TEST_UID, sync: true });
  log('Stats', {
    objects: stats.numObjects,
    sizeKb: stats.sizeKb,
  });

  // 7. List all users in the cluster
  const allUids = await client.users.list();
  log('List', `${allUids.length} users in cluster`);

  // 8. Cleanup — delete user and purge all data
  await client.users.delete({ uid: TEST_UID, purgeData: true });
  log('Delete', `user "${TEST_UID}" removed`);

  // 9. Verify deletion
  try {
    await client.users.get(TEST_UID);
    log('Verify', 'ERROR — user still exists');
  } catch (err) {
    if (err instanceof RGWNotFoundError) {
      log('Verify', 'confirmed deleted (404)');
    } else {
      throw err;
    }
  }

  console.log('\n=== Done ===\n');
}

main().catch((err) => {
  console.error('\nExample failed:', err);
  client.users.delete({ uid: TEST_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
