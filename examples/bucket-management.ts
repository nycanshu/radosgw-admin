/**
 * Bucket Management — radosgw-admin
 *
 * Demonstrates bucket listing, inspection, index checking,
 * ownership transfer, and deletion.
 *
 * Usage:
 *   RGW_HOST=http://192.168.1.100 \
 *   RGW_ACCESS_KEY=ADMIN_KEY \
 *   RGW_SECRET_KEY=ADMIN_SECRET \
 *   npx tsx examples/bucket-management.ts
 */

import { RadosGWAdminClient } from 'radosgw-admin';

// ── Client setup ────────────────────────────────────────────────────
const client = new RadosGWAdminClient({
  host: process.env.RGW_HOST ?? 'http://192.168.1.100',
  accessKey: process.env.RGW_ACCESS_KEY ?? 'ADMIN_ACCESS_KEY',
  secretKey: process.env.RGW_SECRET_KEY ?? 'ADMIN_SECRET_KEY',
});

// ── Helpers ─────────────────────────────────────────────────────────
function log(step: string, detail?: unknown) {
  console.log(`\n  [${step}]`, detail ?? '');
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== radosgw-admin · Bucket Management Example ===');

  // List all buckets in the cluster
  const allBuckets = await client.buckets.list();
  log('List All', `${allBuckets.length} buckets`);

  if (allBuckets.length === 0) {
    log('Info', 'No buckets found — create one via S3 API first');
    console.log('\n=== Done ===\n');
    return;
  }

  // List buckets for a specific user
  const sampleBucket = allBuckets[0]!;
  const info = await client.buckets.getInfo(sampleBucket);
  log('Get Info', {
    bucket: info.bucket,
    owner: info.owner,
    objects: info.usage.rgwMain.numObjects,
    sizeMb: (info.usage.rgwMain.sizeKb / 1024).toFixed(2),
  });

  // Check bucket index (safe, read-only)
  try {
    const result = await client.buckets.checkIndex({
      bucket: sampleBucket,
      checkObjects: true,
      fix: false, // dry run
    });
    log('Check Index', {
      invalidEntries: result.invalidMultipartEntries.length,
    });
  } catch {
    log('Check Index', 'Not supported for this bucket type');
  }

  // Transfer ownership example (link/unlink)
  // NOTE: Uncomment below to test — requires two existing users
  //
  // await client.buckets.link({
  //   bucket: 'my-bucket',
  //   bucketId: info.id,
  //   uid: 'new-owner',
  // });
  // log('Link', 'Transferred ownership to new-owner');

  // Delete a bucket (DESTRUCTIVE — uncomment to test)
  //
  // await client.buckets.delete({
  //   bucket: 'test-bucket',
  //   purgeObjects: true,
  // });
  // log('Delete', 'Bucket deleted with object purge');

  console.log('\n=== Done ===\n');
}

main().catch((err) => {
  console.error('\nExample failed:', err);
  process.exit(1);
});
