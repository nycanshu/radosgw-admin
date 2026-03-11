---
sidebar_position: 1
slug: /
---

# radosgw-admin

Modern, zero-dependency TypeScript SDK for the **Ceph RADOS Gateway Admin Ops REST API**.

```bash
npm install radosgw-admin
```

---

## Why this package?

The only existing npm package for RGW Admin Ops (`rgw-admin-client`) was last published **7 years ago** — no TypeScript, no ESM, no maintenance. This package fills that gap.

| Feature | radosgw-admin |
|---|---|
| TypeScript | Full strict types, no `any` |
| Dependencies | Zero runtime deps |
| Auth | AWS SigV4 via `node:crypto` |
| Module format | ESM + CJS dual build |
| Error handling | Typed error class hierarchy |
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
