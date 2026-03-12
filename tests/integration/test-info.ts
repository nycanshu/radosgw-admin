/**
 * Integration Test: Info Module
 *
 * Tests cluster info retrieval against a live RGW server.
 * Requires .env with RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY, etc.
 *
 * Usage:
 *   npx tsx tests/integration/test-info.ts
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

async function run() {
  console.log('=== Integration Test: Info Module ===\n');

  // 1. Get cluster info
  console.log('1. Getting cluster info...');
  const result = await client.info.get();

  // 2. Verify response structure
  console.log('2. Verifying response structure...');
  if (typeof result !== 'object' || result === null) {
    throw new Error('Expected result to be an object');
  }
  if (typeof result.info !== 'object' || result.info === null) {
    throw new Error('Expected result.info to be an object');
  }
  if (!Array.isArray(result.info.storageBackends)) {
    throw new Error('Expected result.info.storageBackends to be an array');
  }
  if (result.info.storageBackends.length === 0) {
    throw new Error('Expected at least one storage backend');
  }
  const backend = result.info.storageBackends[0]!;
  if (typeof backend.name !== 'string' || backend.name.trim().length === 0) {
    throw new Error('Expected backend.name to be a non-empty string');
  }
  if (typeof backend.clusterId !== 'string' || backend.clusterId.trim().length === 0) {
    throw new Error('Expected backend.clusterId to be a non-empty string');
  }
  console.log(`   Backend: ${backend.name}, Cluster FSID: ${backend.clusterId}`);

  // 3. Verify idempotency (calling twice returns same FSID)
  console.log('\n3. Verifying idempotency (second call returns same FSID)...');
  const result2 = await client.info.get();
  const fsid2 = result2.info.storageBackends[0]!.clusterId;
  if (fsid2 !== backend.clusterId) {
    throw new Error(
      `Expected same clusterId on second call, got "${fsid2}" vs "${backend.clusterId}"`,
    );
  }
  console.log('   Confirmed: same FSID returned');

  console.log('\n=== All tests passed! ===');
}

run().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
