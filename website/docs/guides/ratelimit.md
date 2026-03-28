---
title: Rate Limit Guide
sidebar_position: 6
description: Set per-user, per-bucket and global rate limits on Ceph RGW with the radosgw-admin Node.js SDK.
---

# Rate Limit Guide

The `rateLimit` module manages per-user, per-bucket, and global rate limits:

- get/set user rate limits
- get/set bucket rate limits
- get/set global rate limits (user, bucket, anonymous scopes)
- disable rate limits

Requires Ceph **Pacific (v16)** or later.

API reference: [Rate limit types and methods](../api/classes/RadosGWAdminClient)

## Prerequisites

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ADMIN_ACCESS_KEY!,
  secretKey: process.env.RGW_ADMIN_SECRET_KEY!,
});
```

## User Rate Limits

### Get User Limit

```ts
const limit = await rgw.rateLimit.getUserLimit('alice');
console.log('Read ops/min:', limit.maxReadOps);
console.log('Write ops/min:', limit.maxWriteOps);
console.log('Enabled:', limit.enabled);
```

### Set User Limit

```ts
await rgw.rateLimit.setUserLimit({
  uid: 'alice',
  maxReadOps: 100,
  maxWriteOps: 50,
  maxWriteBytes: 52428800, // 50 MB/min
  enabled: true,
});
```

### Disable User Limit

Disable without changing the configured values:

```ts
await rgw.rateLimit.disableUserLimit('alice');
```

## Bucket Rate Limits

### Get Bucket Limit

```ts
const limit = await rgw.rateLimit.getBucketLimit('my-bucket');
console.log('Read ops/min:', limit.maxReadOps);
```

### Set Bucket Limit

```ts
await rgw.rateLimit.setBucketLimit({
  bucket: 'my-bucket',
  maxReadOps: 200,
  maxWriteOps: 100,
  enabled: true,
});
```

### Disable Bucket Limit

```ts
await rgw.rateLimit.disableBucketLimit('my-bucket');
```

## Global Rate Limits

Global limits apply as defaults across the cluster for a given scope.

### Get Global Limits

```ts
const global = await rgw.rateLimit.getGlobal();
console.log('Anonymous read limit:', global.anonymous.maxReadOps);
console.log('User default:', global.user.maxReadOps);
console.log('Bucket default:', global.bucket.maxReadOps);
```

### Set Global Limit

```ts
// Limit anonymous access globally
await rgw.rateLimit.setGlobal({
  scope: 'anonymous',
  maxReadOps: 50,
  maxWriteOps: 0, // 0 = unlimited
  enabled: true,
});
```

Available scopes: `user`, `bucket`, `anonymous`.

## Rate Limit Values

| Value | Meaning |
|---|---|
| `0` | Unlimited (no restriction) |
| `> 0` | Ops per minute or bytes per minute |

:::info
Unlike quotas where `-1` means unlimited, rate limits use `0` for unlimited. Negative values are invalid.
:::

## Per-Instance Behaviour

Rate limits are enforced **per RGW instance**. If your cluster has 3 RGW daemons and you want a cluster-wide limit of 300 read ops/min, set `maxReadOps: 100` on each instance.

```ts
const RGW_INSTANCE_COUNT = 3;
const CLUSTER_WIDE_READ_LIMIT = 300;

await rgw.rateLimit.setUserLimit({
  uid: 'alice',
  maxReadOps: CLUSTER_WIDE_READ_LIMIT / RGW_INSTANCE_COUNT,
  enabled: true,
});
```

## Error Handling

```ts
import { RGWValidationError, RGWNotFoundError } from 'radosgw-admin';

try {
  await rgw.rateLimit.setUserLimit({ uid: 'alice', maxReadOps: 100 });
} catch (error) {
  if (error instanceof RGWValidationError) {
    // uid is empty or rate limit value is negative
  } else if (error instanceof RGWNotFoundError) {
    // user does not exist
  } else {
    throw error;
  }
}
```

## Production Notes

1. Rate limits are per-RGW-instance. Divide your target cluster-wide limit by the number of daemons.
2. Use `anonymous` scope to protect public-read buckets from abuse.
3. Set global defaults first, then override per-user or per-bucket as needed.
4. Disabling a limit preserves the configured values — re-enabling restores them instantly.
5. Monitor 429 (Too Many Requests) responses in your application to detect when limits are hit.
