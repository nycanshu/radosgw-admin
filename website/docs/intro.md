---
sidebar_position: 1
---

# radosgw-admin

Node.js SDK for the **Ceph RADOS Gateway Admin Ops API**. Manage users, buckets, quotas, rate limits and access keys programmatically — with modern TypeScript support.

```bash
npm install radosgw-admin
```

---

## Why this package?

There was no actively maintained Node.js SDK for the Ceph RGW Admin Ops API. Meanwhile, Ceph adoption in Kubernetes (Rook-Ceph, OpenShift Data Foundation) keeps growing and teams need to automate RGW admin tasks from Node.js. This package fills that gap.

| Feature | radosgw-admin |
|---|---|
| API coverage | 8 modules, 45+ methods across all Admin Ops endpoints |
| Auth | AWS SigV4 signing via `node:crypto` (no third-party deps) |
| Error handling | Typed error class hierarchy — `RGWNotFoundError`, `RGWAuthError`, etc. |
| TypeScript | Full strict types, no `any` |
| Module format | ESM + CJS dual build |
| Response shape | Auto camelCase conversion |

---

## Quick example

```typescript
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'http://ceph-rgw.example.com',
  port: 8080,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
});

// Create a user
const user = await rgw.users.create({
  uid: 'alice',
  displayName: 'Alice',
  email: 'alice@example.com',
  maxBuckets: 100,
});

// Set a quota
await rgw.quota.setUserQuota({
  uid: 'alice',
  maxSizeKb: 10 * 1024 * 1024, // 10 GB
  maxObjects: 1_000_000,
  enabled: true,
});

// Delete the user
await rgw.users.delete({ uid: 'alice' });
```

---

## What's covered

| Module | Operations |
|---|---|
| `rgw.users` | create, get, modify, delete, list, suspend, enable, getStats, getByAccessKey |
| `rgw.keys` | generate, revoke |
| `rgw.subusers` | create, modify, remove |
| `rgw.buckets` | get, list, delete, transferOwnership, removeOwnership, verifyIndex |
| `rgw.quota` | getUserQuota, setUserQuota, getBucketQuota, setBucketQuota, enable/disable |
| `rgw.rateLimit` | getUser, setUser, getBucket, setBucket, getGlobal, setGlobal |
| `rgw.usage` | get, trim |
| `rgw.info` | get |

---

## Next steps

- [Getting Started](./getting-started) — install and first request
- [Configuration](./configuration) — all client options
- [Error Handling](./error-handling) — typed error classes
- [API Reference](./api) — auto-generated from source
