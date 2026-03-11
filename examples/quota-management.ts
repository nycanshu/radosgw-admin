/**
 * Quota Management — radosgw-admin
 *
 * Demonstrates user-level and bucket-level quota operations.
 *
 * Usage:
 *   RGW_HOST=http://192.168.1.100 \
 *   RGW_ACCESS_KEY=ADMIN_KEY \
 *   RGW_SECRET_KEY=ADMIN_SECRET \
 *   npx tsx examples/quota-management.ts
 */

import { RadosGWAdminClient } from 'radosgw-admin';

// ── Client setup ────────────────────────────────────────────────────
const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST ?? 'http://192.168.1.100',
  accessKey: process.env.RGW_ACCESS_KEY ?? 'ADMIN_ACCESS_KEY',
  secretKey: process.env.RGW_SECRET_KEY ?? 'ADMIN_SECRET_KEY',
});

const DEMO_UID = 'demo-quota';

// ── Helpers ─────────────────────────────────────────────────────────
function log(step: string, detail?: unknown) {
  console.log(`\n  [${step}]`, detail ?? '');
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== radosgw-admin · Quota Management Example ===');

  // Setup: create a demo user
  await client.users.create({
    uid: DEMO_UID,
    displayName: 'Quota Demo User',
  });
  log('Setup', `Created user "${DEMO_UID}"`);

  // ── User Quota ──────────────────────────────────────

  // Set a 10GB user quota with 50k object limit
  await client.quota.setUserQuota({
    uid: DEMO_UID,
    maxSize: '10G', // accepts "10G", "500M", "1T", or bytes
    maxObjects: 50000,
    enabled: true,
  });
  log('Set User Quota', '10GB / 50k objects');

  // Read it back
  const userQuota = await client.quota.getUserQuota(DEMO_UID);
  log('Get User Quota', {
    enabled: userQuota.enabled,
    maxSize: userQuota.maxSize,
    maxObjects: userQuota.maxObjects,
  });

  // Disable quota temporarily (preserves values)
  await client.quota.disableUserQuota(DEMO_UID);
  log('Disable User Quota', 'Quota disabled without changing values');

  // Re-enable
  await client.quota.enableUserQuota(DEMO_UID);
  log('Enable User Quota', 'Quota re-enabled');

  // ── Bucket Quota ────────────────────────────────────

  // Set a 1GB per-bucket quota for the user
  await client.quota.setBucketQuota({
    uid: DEMO_UID,
    maxSize: '1G',
    maxObjects: 10000,
  });
  log('Set Bucket Quota', '1GB / 10k objects per bucket');

  // Read it back
  const bucketQuota = await client.quota.getBucketQuota(DEMO_UID);
  log('Get Bucket Quota', {
    enabled: bucketQuota.enabled,
    maxSize: bucketQuota.maxSize,
    maxObjects: bucketQuota.maxObjects,
  });

  // ── Cleanup ─────────────────────────────────────────
  await client.users.delete({ uid: DEMO_UID, purgeData: true });
  log('Cleanup', `Deleted user "${DEMO_UID}"`);

  console.log('\n=== Done ===\n');
}

main().catch((err) => {
  console.error('\nExample failed:', err);
  client.users.delete({ uid: DEMO_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
