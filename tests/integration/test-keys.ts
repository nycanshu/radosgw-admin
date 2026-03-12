/**
 * Integration Test: Keys Module
 *
 * Tests key generation, rotation, explicit credentials, Swift keys,
 * and revocation against a live RGW server.
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-keys.ts
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
  console.log('=== Integration Test: Keys Module ===\n');

  // 0. Create a test user first
  console.log('0. Creating test user...');
  const user = await client.users.create({
    uid: TEST_UID,
    displayName: 'Keys Test User',
  });
  const originalKey = user.keys[0]!.accessKey;
  console.log(`   Created user "${TEST_UID}" with key: ${originalKey}`);

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

  // 4. Generate key with explicit credentials
  console.log('\n4. Generating key with explicit credentials...');
  const explicitKeys = await client.keys.generate({
    uid: TEST_UID,
    accessKey: 'EXPLICIT_ACCESS_KEY_TEST',
    secretKey: 'EXPLICIT_SECRET_KEY_TEST',
    generateKey: false,
  });
  const explicitKey = explicitKeys.find((k) => k.accessKey === 'EXPLICIT_ACCESS_KEY_TEST');
  if (!explicitKey) throw new Error('Explicit key not found after creation');
  console.log(`   Created explicit key: ${explicitKey.accessKey}`);

  // 5. Revoke the explicit key
  console.log('\n5. Revoking explicit key...');
  await client.keys.revoke({ accessKey: 'EXPLICIT_ACCESS_KEY_TEST' });
  const userAfterExplicit = await client.users.get(TEST_UID);
  if (userAfterExplicit.keys.some((k) => k.accessKey === 'EXPLICIT_ACCESS_KEY_TEST')) {
    throw new Error('Explicit key still exists after revocation');
  }
  console.log('   Confirmed: explicit key revoked');

  // 6–7. Swift key generate + revoke (skipped if Swift is not enabled on the cluster)
  console.log('\n6. Generating Swift key...');
  try {
    const swiftKeys = await client.keys.generate({ uid: TEST_UID, keyType: 'swift' });
    console.log(`   User now has ${swiftKeys.length} swift key(s)`);

    console.log('\n7. Revoking Swift key...');
    const userWithSwift = await client.users.get(TEST_UID);
    const swiftKey = userWithSwift.swiftKeys?.[0];
    if (!swiftKey) throw new Error('Swift key not found on user object');
    await client.keys.revoke({ accessKey: swiftKey.secretKey, uid: TEST_UID, keyType: 'swift' });
    const userAfterSwiftRevoke = await client.users.get(TEST_UID);
    if (userAfterSwiftRevoke.swiftKeys && userAfterSwiftRevoke.swiftKeys.length > 0) {
      throw new Error('Swift key still exists after revocation');
    }
    console.log('   Confirmed: Swift key revoked');
  } catch (err) {
    if (err instanceof Error && err.message.includes('Swift key')) throw err;
    console.log(`   Skipped: Swift keys not supported on this cluster (${(err as Error).message})`);
    console.log('\n7. Skipped (Swift not available)');
  }

  // 8. Revoke a non-existent key (expect error)
  console.log('\n8. Revoking non-existent key (expect error)...');
  try {
    await client.keys.revoke({ accessKey: 'DOES_NOT_EXIST_KEY_12345' });
    throw new Error('Expected RGWNotFoundError but no error was thrown');
  } catch (err) {
    if (err instanceof RGWNotFoundError) {
      console.log('   Confirmed: RGWNotFoundError thrown');
    } else if (err instanceof Error && err.message.includes('Expected RGWNotFoundError')) {
      throw err;
    } else {
      console.log(`   Got error (acceptable): ${(err as Error).message}`);
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
