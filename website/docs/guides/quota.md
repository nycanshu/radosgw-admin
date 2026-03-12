---
title: Quota Guide
sidebar_position: 5
---

# Quota Guide

The `quota` module manages user-level and bucket-level quotas:

- get/set user quotas
- get/set bucket quotas (applied per-user to all their buckets)
- enable/disable quotas without changing limits

API reference: [Quota types and methods](../api/classes/RadosGWAdminClient)

## Prerequisites

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ADMIN_ACCESS_KEY!,
  secretKey: process.env.RGW_ADMIN_SECRET_KEY!,
});
```

## User Quotas

### Get User Quota

```ts
const quota = await rgw.quota.getUserQuota('alice');
console.log('Enabled:', quota.enabled);
console.log('Max size:', quota.maxSize, 'bytes');
console.log('Max objects:', quota.maxObjects);
```

### Set User Quota

The `maxSize` field accepts human-readable strings:

```ts
await rgw.quota.setUserQuota({
  uid: 'alice',
  maxSize: '10G',       // 10 GiB
  maxObjects: 50000,
  enabled: true,
});
```

Supported size formats: `"500M"`, `"10G"`, `"1T"`, `"1024K"`, or a raw number in bytes.

### Enable / Disable

Toggle a quota on or off without changing the configured limits:

```ts
await rgw.quota.enableUserQuota('alice');
await rgw.quota.disableUserQuota('alice');
```

## Bucket Quotas

Bucket quotas are configured **per-user** and apply to all buckets that user owns.

### Get Bucket Quota

```ts
const quota = await rgw.quota.getBucketQuota('alice');
console.log('Bucket quota enabled:', quota.enabled);
```

### Set Bucket Quota

```ts
await rgw.quota.setBucketQuota({
  uid: 'alice',
  maxSize: '1G',
  maxObjects: 10000,
  enabled: true,
});
```

### Enable / Disable

```ts
await rgw.quota.enableBucketQuota('alice');
await rgw.quota.disableBucketQuota('alice');
```

## Quota Values

| Value | Meaning |
|---|---|
| `-1` | Unlimited (no restriction) |
| `0` | Zero (effectively blocks writes) |
| `> 0` | Specific limit |

## Multi-Tenant Quota Pattern

Apply standard quotas when onboarding new users:

```ts
async function onboardUser(uid: string, displayName: string) {
  // Create user
  await rgw.users.create({ uid, displayName });

  // Set user-level quota (total storage)
  await rgw.quota.setUserQuota({
    uid,
    maxSize: '50G',
    maxObjects: 100000,
    enabled: true,
  });

  // Set per-bucket quota
  await rgw.quota.setBucketQuota({
    uid,
    maxSize: '10G',
    maxObjects: 25000,
    enabled: true,
  });
}
```

## Error Handling

```ts
import { RGWValidationError, RGWNotFoundError } from 'radosgw-admin';

try {
  await rgw.quota.setUserQuota({ uid: 'alice', maxSize: '10G' });
} catch (error) {
  if (error instanceof RGWValidationError) {
    // uid is empty, or size format is invalid
  } else if (error instanceof RGWNotFoundError) {
    // user does not exist
  } else {
    throw error;
  }
}
```

## Production Notes

1. RGW enforces quotas asynchronously — there may be a brief delay before writes are blocked.
2. Bucket quotas are per-user, not per-bucket. All buckets owned by a user share the same bucket quota config.
3. Use `-1` for unlimited rather than omitting the field — this makes intent explicit.
4. Monitor quota usage via `users.getStats()` to alert before users hit limits.
5. Quota values of `-2` or lower are invalid and will throw `RGWValidationError`.
