/**
 * Rate Limit Management — radosgw-admin
 *
 * Demonstrates user, bucket, and global rate limit operations.
 * Requires Ceph Pacific (v16) or later.
 *
 * Usage:
 *   RGW_HOST=http://192.168.1.100 \
 *   RGW_ACCESS_KEY=ADMIN_KEY \
 *   RGW_SECRET_KEY=ADMIN_SECRET \
 *   npx tsx examples/ratelimit-management.ts
 */

import { RadosGWAdminClient } from 'radosgw-admin';

// ── Client setup ────────────────────────────────────────────────────
const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST ?? 'http://192.168.1.100',
  accessKey: process.env.RGW_ACCESS_KEY ?? 'ADMIN_ACCESS_KEY',
  secretKey: process.env.RGW_SECRET_KEY ?? 'ADMIN_SECRET_KEY',
});

const DEMO_UID = 'demo-ratelimit';

// ── Helpers ─────────────────────────────────────────────────────────
function log(step: string, detail?: unknown) {
  console.log(`\n  [${step}]`, detail ?? '');
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== radosgw-admin · Rate Limit Management Example ===');

  // Setup: create a demo user
  await client.users.create({
    uid: DEMO_UID,
    displayName: 'Rate Limit Demo User',
  });
  log('Setup', `Created user "${DEMO_UID}"`);

  // ── User Rate Limit ─────────────────────────────────

  // Throttle to 100 read ops/min and 50 write ops/min per RGW instance
  await client.rateLimit.setUserLimit({
    uid: DEMO_UID,
    maxReadOps: 100,
    maxWriteOps: 50,
    maxWriteBytes: 52428800, // 50MB/min
  });
  log('Set User Limit', '100 read ops, 50 write ops, 50MB write/min');

  // Read it back
  const userLimit = await client.rateLimit.getUserLimit(DEMO_UID);
  log('Get User Limit', {
    enabled: userLimit.enabled,
    maxReadOps: userLimit.maxReadOps,
    maxWriteOps: userLimit.maxWriteOps,
  });

  // Disable rate limit temporarily (preserves config)
  await client.rateLimit.disableUserLimit(DEMO_UID);
  log('Disable User Limit', 'Rate limit disabled');

  // Re-enable by setting again
  await client.rateLimit.setUserLimit({
    uid: DEMO_UID,
    maxReadOps: 100,
    enabled: true,
  });
  log('Re-enable User Limit', 'Rate limit re-enabled');

  // ── Global Rate Limits ──────────────────────────────

  // View current global rate limits
  const global = await client.rateLimit.getGlobal();
  log('Get Global Limits', {
    userEnabled: global.user.enabled,
    bucketEnabled: global.bucket.enabled,
    anonymousEnabled: global.anonymous.enabled,
  });

  // Protect against anonymous abuse (uncomment to apply)
  // await client.rateLimit.setGlobal({
  //   scope: 'anonymous',
  //   maxReadOps: 50,
  //   maxWriteOps: 0,
  //   enabled: true,
  // });
  // log('Set Global Anonymous', 'Limited anonymous to 50 read ops/min');

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
