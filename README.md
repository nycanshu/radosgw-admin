# radosgw-admin

> Modern, zero-dependency TypeScript client for the Ceph RADOS Gateway Admin Ops API.

[![CI](https://github.com/nycanshu/radosgw-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/nycanshu/radosgw-admin/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/radosgw-admin)](https://www.npmjs.com/package/radosgw-admin)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)

---

## Why?

The only existing npm package for RGW Admin Ops (`rgw-admin-client`) was last published **7 years ago** — no TypeScript, no ESM, no maintenance. Meanwhile, Ceph adoption in Kubernetes (Rook-Ceph, OpenShift Data Foundation) keeps growing. This package fills that gap.

**What you get:**

- [RGW Admin Ops API](https://docs.ceph.com/en/latest/radosgw/adminops/) coverage — users, keys, subusers, buckets, quotas, rate limits
- Strict TypeScript with zero `any` — every request and response is fully typed
- Zero runtime dependencies — AWS SigV4 signing uses only `node:crypto`
- Dual ESM + CJS build — works in every Node.js environment
- Automatic snake_case/camelCase conversion — idiomatic JS API over RGW's REST interface
- Structured error hierarchy — catch specific failures, not generic HTTP errors

## Install

```bash
npm install radosgw-admin
```

Requires **Node.js >= 18** and a Ceph RGW instance with the Admin Ops API enabled.

## Quick Start

```typescript
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'http://ceph-rgw.example.com',
  port: 8080,
  accessKey: 'ADMIN_ACCESS_KEY',
  secretKey: 'ADMIN_SECRET_KEY',
});

// Create a user
const user = await rgw.users.create({
  uid: 'alice',
  displayName: 'Alice',
  email: 'alice@example.com',
  maxBuckets: 100,
});

// List all users
const uids = await rgw.users.list();

// Get user info with keys, caps, quotas
const info = await rgw.users.get('alice');

// Suspend / re-enable
await rgw.users.suspend('alice');
await rgw.users.enable('alice');

// Delete (with optional purge of all objects)
await rgw.users.delete({ uid: 'alice', purgeData: true });
```

## Configuration

```typescript
const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com', // Required — RGW endpoint
  port: 443, // Optional — omit to use host URL default
  accessKey: 'ADMIN_KEY', // Required — admin user access key
  secretKey: 'ADMIN_SECRET', // Required — admin user secret key
  adminPath: '/admin', // Optional — API prefix (default: "/admin")
  timeout: 15000, // Optional — request timeout in ms (default: 10000)
  region: 'us-east-1', // Optional — SigV4 region (default: "us-east-1")
  insecure: false, // Optional — skip TLS verification (default: false)
  debug: false, // Optional — enable request/response logging (default: false)
  maxRetries: 3, // Optional — retry transient errors (default: 0)
  retryDelay: 200, // Optional — base delay for exponential backoff in ms (default: 200)
});
```

## API Reference

### Users

```typescript
rgw.users.create(input);             // Create a new RGW user
rgw.users.get(uid, tenant?);         // Get full user info (keys, caps, quotas)
rgw.users.getByAccessKey(accessKey); // Look up a user by their S3 access key
rgw.users.modify(input);             // Update display name, email, max buckets, etc.
rgw.users.delete(input);             // Delete user (optionally purge all data)
rgw.users.list();                    // List all user IDs in the cluster
rgw.users.suspend(uid);              // Suspend a user account
rgw.users.enable(uid);               // Re-enable a suspended user
rgw.users.getStats(uid, sync?);      // Get storage usage statistics
```

### Keys

```typescript
rgw.keys.generate(input); // Generate or assign S3/Swift keys
rgw.keys.revoke(input);   // Revoke (delete) a key pair
```

### Subusers. 

```typescript
rgw.subusers.create(input); // Create a subuser for an existing user
rgw.subusers.modify(input); // Modify subuser permissions
rgw.subusers.remove(input); // Remove a subuser
```

<details>
<summary>Subuser examples</summary>

```typescript
// Create a Swift subuser with full access
await rgw.subusers.create({
  uid: 'alice',
  subuser: 'alice:swift',
  access: 'full',
  keyType: 'swift',
  generateSecret: true,
});

// Restrict to read-only
await rgw.subusers.modify({
  uid: 'alice',
  subuser: 'alice:swift',
  access: 'read',
});

// Remove the subuser
await rgw.subusers.remove({ uid: 'alice', subuser: 'alice:swift' });
```

</details>

### Buckets

```typescript
rgw.buckets.list();                // List all buckets (optionally filter by user)
rgw.buckets.getInfo(bucket);       // Get bucket metadata and stats
rgw.buckets.delete(input);         // Delete a bucket (optionally purge objects)
rgw.buckets.transferOwnership(input); // Transfer bucket to a different user
rgw.buckets.removeOwnership(input);   // Remove bucket ownership
rgw.buckets.verifyIndex(input);    // Check and optionally repair bucket index
```

<details>
<summary>Bucket examples</summary>

```typescript
// List all buckets in the cluster
const allBuckets = await rgw.buckets.list();

// List buckets owned by a specific user
const userBuckets = await rgw.buckets.list('alice');

// Get detailed bucket info
const info = await rgw.buckets.getInfo('my-bucket');
console.log(info.usage.rgwMain.numObjects);

// Transfer a bucket to a different user
await rgw.buckets.transferOwnership({
  bucket: 'my-bucket',
  bucketId: info.id,
  uid: 'bob',
});

// Check and repair bucket index
const result = await rgw.buckets.verifyIndex({
  bucket: 'my-bucket',
  checkObjects: true,
  fix: true,
});

// Delete bucket and all its objects
await rgw.buckets.delete({ bucket: 'my-bucket', purgeObjects: true });
```

</details>

### Quotas

```typescript
rgw.quota.getUserQuota(uid);        // Get user-level quota
rgw.quota.setUserQuota(input);      // Set user-level quota (accepts "10G" size strings)
rgw.quota.enableUserQuota(uid);     // Enable user quota without changing values
rgw.quota.disableUserQuota(uid);    // Disable user quota without changing values
rgw.quota.getBucketQuota(uid);      // Get bucket-level quota for a user
rgw.quota.setBucketQuota(input);    // Set bucket-level quota
rgw.quota.enableBucketQuota(uid);   // Enable bucket quota
rgw.quota.disableBucketQuota(uid);  // Disable bucket quota
```

<details>
<summary>Quota examples</summary>

`maxSize` accepts a number (bytes) or a human-readable string with binary (1024-based) units:

| Input | Bytes |
|-------|-------|
| `'1K'` / `'1KB'` | 1,024 |
| `'500M'` / `'500MB'` | 524,288,000 |
| `'10G'` / `'10GB'` | 10,737,418,240 |
| `'1T'` / `'1TB'` | 1,099,511,627,776 |
| `'1.5G'` | 1,610,612,736 |
| `1073741824` | 1,073,741,824 (raw bytes) |
| `-1` | Unlimited |

```typescript
// Set a 10GB user quota with 50k object limit
await rgw.quota.setUserQuota({
  uid: 'alice',
  maxSize: '10G',       // → 10737418240 bytes
  maxObjects: 50000,
  enabled: true,        // default: true when setting
});

// Size limit only, unlimited objects
await rgw.quota.setUserQuota({
  uid: 'alice',
  maxSize: '10G',
  maxObjects: -1,       // -1 = unlimited
});

// Check current quota — maxSize is always returned as bytes
const quota = await rgw.quota.getUserQuota('alice');
console.log('Enabled:', quota.enabled);
console.log('Max size:', quota.maxSize, 'bytes');

// Disable quota temporarily (preserves values)
await rgw.quota.disableUserQuota('alice');

// Set a 1GB per-bucket quota (applies to all buckets owned by the user)
await rgw.quota.setBucketQuota({
  uid: 'alice',         // uid, not bucket name — RGW bucket quotas are per-user
  maxSize: '1G',
  maxObjects: 10000,
});
```

</details>

### Rate Limits

> Requires Ceph **Pacific (v16)** or later. Values are per RGW instance — divide by the number of RGW daemons for cluster-wide limits.

```typescript
rgw.rateLimit.getUserLimit(uid);           // Get user rate limit
rgw.rateLimit.setUserLimit(input);         // Set user rate limit
rgw.rateLimit.disableUserLimit(uid);       // Disable user rate limit
rgw.rateLimit.getBucketLimit(bucket);      // Get bucket rate limit
rgw.rateLimit.setBucketLimit(input);       // Set bucket rate limit
rgw.rateLimit.disableBucketLimit(bucket);  // Disable bucket rate limit
rgw.rateLimit.getGlobal();                 // Get global rate limits (user/bucket/anonymous)
rgw.rateLimit.setGlobal(input);            // Set global rate limit for a scope
```

<details>
<summary>Rate limit examples</summary>

```typescript
// Throttle alice to 100 read ops/min and 50MB/min write per RGW instance
await rgw.rateLimit.setUserLimit({
  uid: 'alice',
  maxReadOps: 100,
  maxWriteOps: 50,
  maxWriteBytes: 52428800,  // 50MB
});

// Disable rate limit temporarily (preserves config)
await rgw.rateLimit.disableUserLimit('alice');

// Set a bucket-level rate limit
await rgw.rateLimit.setBucketLimit({
  bucket: 'public-assets',
  maxReadOps: 200,
  maxWriteOps: 10,
});

// Protect public-read buckets from anonymous abuse
await rgw.rateLimit.setGlobal({
  scope: 'anonymous',
  maxReadOps: 50,
  maxWriteOps: 0,
  enabled: true,
});

// View all global rate limits
const global = await rgw.rateLimit.getGlobal();
console.log('Anonymous:', global.anonymous);
console.log('User:', global.user);
console.log('Bucket:', global.bucket);
```

</details>

### Usage & Analytics

> **Prerequisite:** Usage logging must be enabled in `ceph.conf`: `rgw enable usage log = true`. Restart RGW daemons after changing the config.

```typescript
rgw.usage.get(input?);   // Query usage report (per-user or cluster-wide)
rgw.usage.trim(input?);  // Delete old usage logs — requires removeAll: true when no uid
```

<details>
<summary>Usage examples</summary>

```typescript
// Usage for alice in January 2025
const report = await rgw.usage.get({
  uid: 'alice',
  start: '2025-01-01',   // accepts 'YYYY-MM-DD' or Date object
  end: '2025-01-31',
});

for (const summary of report.summary) {
  for (const cat of summary.categories) {
    console.log(`[${cat.category}] ops: ${cat.ops} | sent: ${(cat.bytesSent / 1e6).toFixed(2)} MB`);
  }
  console.log('Total sent:', (summary.total.bytesSent / 1e9).toFixed(3), 'GB');
}

// Cluster-wide usage, all time (omit all filters)
const all = await rgw.usage.get();

// Trim a single user's logs up to end of 2024
await rgw.usage.trim({ uid: 'alice', end: '2024-12-31' });

// ⚠️  Trim all cluster usage logs — removeAll: true required when no uid
await rgw.usage.trim({ end: '2023-12-31', removeAll: true });
```

</details>

### Cluster Info

```typescript
rgw.info.get();   // Get cluster FSID and basic endpoint info
```

```typescript
const info = await rgw.info.get();
console.log('Cluster FSID:', info.info.clusterId);
```

## Error Handling

Every error thrown is an instance of `RGWError` with structured properties:

```typescript
import { RGWNotFoundError, RGWConflictError, RGWAuthError } from 'radosgw-admin';

try {
  await rgw.users.get('nonexistent');
} catch (error) {
  if (error instanceof RGWNotFoundError) {
    // 404 — user does not exist
  } else if (error instanceof RGWAuthError) {
    // 403 — check admin credentials / caps
  }
}
```

| Error Class          | HTTP Status     | Condition                                |
| -------------------- | --------------- | ---------------------------------------- |
| `RGWValidationError` | _(pre-request)_ | Invalid input (missing uid, bad params)  |
| `RGWNotFoundError`   | 404             | Resource does not exist                  |
| `RGWConflictError`   | 409             | Resource already exists                  |
| `RGWAuthError`       | 403             | Insufficient credentials or capabilities |
| `RGWError`           | 5xx             | Server-side failure                      |

> **Note:** Destructive operations (`purgeData`, `purgeObjects`) emit a `console.warn` before executing. To suppress in CI/automation, redirect stderr or patch `console.warn`.

## Compatibility

Tested against Ceph **Quincy (v17)** and **Reef (v18)**. The Admin Ops API is available in all Ceph releases with RGW.

**Prerequisites:**

- The RGW admin user must have `users=*`, `buckets=*` capabilities
- Admin Ops API must be accessible (default path: `/admin`)
- For `insecure: true` — only use with self-signed certificates in dev/test environments

## Development

```bash
git clone https://github.com/nycanshu/radosgw-admin.git
cd radosgw-admin
npm install

npm run build        # ESM + CJS via tsup
npm run typecheck    # tsc --noEmit (strict)
npm test             # vitest
npm run lint         # eslint
npm run format       # prettier
npm run check        # all of the above
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) &copy; nycanshu
