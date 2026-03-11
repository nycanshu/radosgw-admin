/**
 * Key & Subuser Management — radosgw-admin
 *
 * Demonstrates S3 key rotation and Swift subuser lifecycle.
 *
 * Usage:
 *   RGW_HOST=http://192.168.1.100 \
 *   RGW_ACCESS_KEY=ADMIN_KEY \
 *   RGW_SECRET_KEY=ADMIN_SECRET \
 *   npx tsx examples/key-subuser-management.ts
 */

import { RadosGWAdminClient } from 'radosgw-admin';

// ── Client setup ────────────────────────────────────────────────────
const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST ?? 'http://192.168.1.100',
  accessKey: process.env.RGW_ACCESS_KEY ?? 'ADMIN_ACCESS_KEY',
  secretKey: process.env.RGW_SECRET_KEY ?? 'ADMIN_SECRET_KEY',
});

const DEMO_UID = 'demo-keymgmt';

// ── Helpers ─────────────────────────────────────────────────────────
function log(step: string, detail?: unknown) {
  console.log(`\n  [${step}]`, detail ?? '');
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== radosgw-admin · Key & Subuser Management Example ===');

  // Setup: create a demo user
  const user = await client.users.create({
    uid: DEMO_UID,
    displayName: 'Key Management Demo',
  });
  const originalKey = user.keys[0]!.accessKey;
  log('Setup', `Created user "${DEMO_UID}" with key: ${originalKey}`);

  // ── Key Rotation ──────────────────────────────────────

  // Step 1: Generate a new key
  const keysAfterCreate = await client.keys.generate({ uid: DEMO_UID });
  const newKey = keysAfterCreate.find((k) => k.accessKey !== originalKey)!;
  log('Rotate: Create', `New key: ${newKey.accessKey} (${keysAfterCreate.length} total)`);

  // Step 2: Delete the old key
  await client.keys.revoke({ accessKey: originalKey });
  log('Rotate: Delete', `Revoked old key: ${originalKey}`);

  // Verify rotation
  const rotatedUser = await client.users.get(DEMO_UID);
  log(
    'Rotate: Verify',
    `${rotatedUser.keys.length} key remaining: ${rotatedUser.keys[0]!.accessKey}`,
  );

  // ── Subuser Lifecycle ─────────────────────────────────

  // Create a Swift subuser
  const subusers = await client.subusers.create({
    uid: DEMO_UID,
    subuser: `${DEMO_UID}:swift`,
    access: 'readwrite',
    keyType: 'swift',
    generateSecret: true,
  });
  log('Subuser: Create', `${subusers[0]!.id} → ${subusers[0]!.permissions}`);

  // Modify access level
  const modified = await client.subusers.modify({
    uid: DEMO_UID,
    subuser: `${DEMO_UID}:swift`,
    access: 'full',
  });
  log('Subuser: Modify', `${modified[0]!.id} → ${modified[0]!.permissions}`);

  // Delete subuser
  await client.subusers.remove({
    uid: DEMO_UID,
    subuser: `${DEMO_UID}:swift`,
    purgeKeys: true,
  });
  log('Subuser: Delete', 'Removed with key purge');

  // ── Cleanup ───────────────────────────────────────────
  await client.users.delete({ uid: DEMO_UID, purgeData: true });
  log('Cleanup', `Deleted user "${DEMO_UID}"`);

  console.log('\n=== Done ===\n');
}

main().catch((err) => {
  console.error('\nExample failed:', err);
  client.users.delete({ uid: DEMO_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
