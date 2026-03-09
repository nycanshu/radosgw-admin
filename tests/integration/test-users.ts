import { RadosGWAdminClient, RGWNotFoundError, RGWConflictError } from '../../src/index.js';
import { config } from 'dotenv';

config();

const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST!,
  port: Number(process.env.RGW_PORT),
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
  region: process.env.RGW_REGION,
});

const TEST_UID = `test-user-${Date.now()}`;

async function run() {
  console.log('=== Integration Test: Users Module ===\n');

  // 1. List users (before)
  console.log('1. Listing users...');
  const usersBefore = await client.users.list();
  console.log(`   Found ${usersBefore.length} users:`, usersBefore);

  // 2. Create user
  console.log(`\n2. Creating user "${TEST_UID}"...`);
  const created = await client.users.create({
    uid: TEST_UID,
    displayName: 'Integration Test User',
    email: 'test@example.com',
    maxBuckets: 10,
  });
  console.log('   Created:', {
    userId: created.userId,
    displayName: created.displayName,
    email: created.email,
    keys: created.keys?.length,
    maxBuckets: created.maxBuckets,
  });

  // 3. Get user
  console.log(`\n3. Getting user "${TEST_UID}"...`);
  const fetched = await client.users.get(TEST_UID);
  console.log('   Fetched:', {
    userId: fetched.userId,
    displayName: fetched.displayName,
    suspended: fetched.suspended,
  });

  // 4. Modify user
  console.log(`\n4. Modifying user "${TEST_UID}"...`);
  const modified = await client.users.modify({
    uid: TEST_UID,
    displayName: 'Modified Test User',
    maxBuckets: 50,
  });
  console.log('   Modified:', {
    displayName: modified.displayName,
    maxBuckets: modified.maxBuckets,
  });

  // 5. Suspend user
  console.log(`\n5. Suspending user "${TEST_UID}"...`);
  const suspended = await client.users.suspend(TEST_UID);
  console.log('   Suspended:', suspended.suspended);

  // 6. Enable user
  console.log(`\n6. Enabling user "${TEST_UID}"...`);
  const enabled = await client.users.enable(TEST_UID);
  console.log('   Suspended:', enabled.suspended);

  // 7. Get stats
  console.log(`\n7. Getting stats for "${TEST_UID}"...`);
  const stats = await client.users.getStats({ uid: TEST_UID });
  console.log('   Stats:', stats.stats);

  // 8. Delete user
  console.log(`\n8. Deleting user "${TEST_UID}"...`);
  await client.users.delete({ uid: TEST_UID, purgeData: true });
  console.log('   Deleted.');

  // 9. Verify deletion
  console.log(`\n9. Verifying deletion...`);
  try {
    await client.users.get(TEST_UID);
    console.log('   ERROR: User still exists!');
  } catch (err) {
    if (err instanceof RGWNotFoundError) {
      console.log('   Confirmed: user not found (expected).');
    } else {
      throw err;
    }
  }

  console.log('\n=== All tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  // Cleanup on failure
  client.users.delete({ uid: TEST_UID, purgeData: true }).catch(() => {});
  process.exit(1);
});
