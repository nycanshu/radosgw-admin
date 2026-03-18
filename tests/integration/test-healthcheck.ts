/**
 * Integration Test: Quick Health Check
 *
 * A minimal connectivity test — useful as a smoke test before running
 * the full integration suite. Verifies the RGW is reachable and responds
 * to the Admin Ops API.
 *
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-healthcheck.ts
 */

import { RadosGWAdminClient } from '../../src/index.js';
import { config } from 'dotenv';

config();

async function run() {
  console.log('=== Quick Health Check ===\n');

  const client = new RadosGWAdminClient({
    host: process.env.RGW_HOST!,
    port: Number(process.env.RGW_PORT),
    accessKey: process.env.RGW_ACCESS_KEY!,
    secretKey: process.env.RGW_SECRET_KEY!,
    region: process.env.RGW_REGION,
  });

  // 1. healthCheck()
  console.log('1. Running healthCheck()...');
  const ok = await client.healthCheck();
  if (!ok) {
    throw new Error(
      'healthCheck() returned false — RGW is unreachable.\n' +
        `   Host: ${process.env.RGW_HOST}:${process.env.RGW_PORT}\n` +
        '   Check that the RGW daemon is running and credentials are correct.',
    );
  }
  console.log('   ✅ RGW is reachable');

  // 2. Get cluster info
  console.log('\n2. Getting cluster info...');
  const info = await client.info.get();
  const backend = info.info.storageBackends[0];
  if (!backend) {
    throw new Error('No storage backends found');
  }
  console.log(`   ✅ Backend: ${backend.name}, FSID: ${backend.clusterId}`);

  // 3. List users (verify admin caps)
  console.log('\n3. Listing users (verifies admin capabilities)...');
  const users = await client.users.list();
  console.log(`   ✅ ${users.length} users found`);

  console.log('\n=== Health check passed — RGW is ready for integration tests ===');
}

run().catch((err) => {
  console.error('\n❌ Health check failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
