/**
 * Usage Reporting Example
 *
 * Demonstrates how to query and trim RGW usage logs.
 *
 * Prerequisites:
 *   - Usage logging must be enabled in ceph.conf:
 *       rgw enable usage log = true
 *   - After changing ceph.conf, restart the RGW daemons.
 */

import { RadosGWAdminClient } from 'radosgw-admin';

const client = new RadosGWAdminClient({
  host: 'http://192.168.1.100',
  port: 8080,
  accessKey: 'ADMIN_ACCESS_KEY',
  secretKey: 'ADMIN_SECRET_KEY',
});

// ── Query usage for a specific user within a date range ─────────────────────

const report = await client.usage.get({
  uid: 'alice',
  start: '2025-01-01',
  end: '2025-01-31',
});

// Print per-category stats from the summary
for (const summary of report.summary) {
  console.log(`\nUser: ${summary.user}`);
  for (const cat of summary.categories) {
    console.log(
      `  [${cat.category}]` +
        `  ops: ${cat.ops} (${cat.successfulOps} ok)` +
        `  sent: ${(cat.bytesSent / 1e6).toFixed(2)} MB` +
        `  received: ${(cat.bytesReceived / 1e6).toFixed(2)} MB`,
    );
  }
  console.log(`  Total sent:     ${(summary.total.bytesSent / 1e9).toFixed(3)} GB`);
  console.log(`  Total received: ${(summary.total.bytesReceived / 1e9).toFixed(3)} GB`);
}

// ── Query cluster-wide usage (all users, all time) ──────────────────────────

const all = await client.usage.get();
console.log(`\nCluster-wide users in usage log: ${all.summary.length}`);

// ── Trim old logs for a single user ────────────────────────────────────────

await client.usage.trim({
  uid: 'alice',
  end: '2024-12-31', // remove everything up to end of 2024
});
console.log('\nTrimmed alice usage logs before 2025.');

// ── ⚠️  Trim all logs before a date (cluster-wide) ─────────────────────────
// removeAll: true is required when no uid is provided.

await client.usage.trim({
  end: '2023-12-31',
  removeAll: true, // required — makes destructive intent explicit
});
console.log('Trimmed all cluster usage logs before 2024.');

// ── Cluster info ────────────────────────────────────────────────────────────

const info = await client.info.get();
console.log(`\nCluster FSID: ${info.info.clusterId}`);
