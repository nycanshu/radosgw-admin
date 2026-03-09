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
- Full [RGW Admin Ops API](https://docs.ceph.com/en/latest/radosgw/adminops/) coverage — users, keys, subusers, buckets, quotas, rate limits, usage
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
  host: 'https://ceph-rgw.example.com',  // Required — RGW endpoint
  port: 443,                               // Optional — defaults by protocol
  accessKey: 'ADMIN_KEY',                  // Required — admin user access key
  secretKey: 'ADMIN_SECRET',              // Required — admin user secret key
  adminPath: '/admin',                     // Optional — API prefix (default: "/admin")
  timeout: 15000,                          // Optional — request timeout in ms (default: 10000)
  region: 'us-east-1',                     // Optional — SigV4 region (default: "us-east-1")
});
```

## API Reference

### Users

```typescript
rgw.users.create(input)       // Create a new RGW user
rgw.users.get(uid)            // Get full user info (keys, caps, quotas)
rgw.users.modify(input)       // Update display name, email, max buckets, etc.
rgw.users.delete(input)       // Delete user (optionally purge all data)
rgw.users.list()              // List all user IDs in the cluster
rgw.users.suspend(uid)        // Suspend a user account
rgw.users.enable(uid)         // Re-enable a suspended user
rgw.users.getStats(input)     // Get storage usage statistics
```

### Keys

```typescript
rgw.keys.create(input)        // Generate or assign S3/Swift keys
rgw.keys.delete(input)        // Remove a key pair
```

### Buckets

```typescript
rgw.buckets.list()            // List all buckets (optionally filter by user)
rgw.buckets.get(bucket)       // Get bucket metadata and stats
rgw.buckets.delete(input)     // Delete a bucket (optionally purge objects)
rgw.buckets.link(input)       // Link a bucket to a different user
rgw.buckets.unlink(input)     // Unlink a bucket from its owner
rgw.buckets.check(input)      // Check and optionally repair bucket index
rgw.buckets.getPolicy(input)  // Get bucket access policy
```

### Quotas

```typescript
rgw.quotas.getUserQuota(uid)       // Get user-level quota
rgw.quotas.setUserQuota(input)     // Set user-level quota
rgw.quotas.getBucketQuota(uid)     // Get bucket-level quota
rgw.quotas.setBucketQuota(input)   // Set bucket-level quota
```

### Usage

```typescript
rgw.usage.get(input)          // Retrieve usage data for a time range
rgw.usage.trim(input)         // Trim (delete) usage log entries
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

| Error Class | HTTP Status | Condition |
|---|---|---|
| `RGWValidationError` | *(pre-request)* | Invalid input (missing uid, bad params) |
| `RGWNotFoundError` | 404 | Resource does not exist |
| `RGWConflictError` | 409 | Resource already exists |
| `RGWAuthError` | 403 | Insufficient credentials or capabilities |
| `RGWError` | 5xx | Server-side failure |

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
