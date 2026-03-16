---
title: Users Guide
sidebar_position: 1
description: Manage Ceph RGW users from Node.js — create, get, modify, suspend, enable and delete users with the radosgw-admin SDK.
---

# Users Guide

The `users` module manages the full user lifecycle in Ceph RGW:

- create users
- fetch user details
- modify user metadata
- suspend/enable accounts
- list users
- fetch storage stats
- delete users (optionally purging all data)

API reference: [Users types and methods](../api/classes/RadosGWAdminClient)

## Prerequisites

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ADMIN_ACCESS_KEY!,
  secretKey: process.env.RGW_ADMIN_SECRET_KEY!,
  timeout: 15000,
  maxRetries: 2,
});
```

## 1) Create User

```ts
const user = await rgw.users.create({
  uid: 'alice',
  displayName: 'Alice Example',
  email: 'alice@example.com',
  maxBuckets: 100,
});
```

When to use:
- tenant onboarding
- programmatic user provisioning

## 2) Get User

```ts
const user = await rgw.users.get('alice');
console.log(user.displayName, user.keys.length, user.userQuota.enabled);
```

Use this for audits and policy validation.

## 3) Modify User

```ts
const updated = await rgw.users.modify({
  uid: 'alice',
  displayName: 'Alice Production',
  maxBuckets: 200,
});
```

Common updates:
- display name
- max buckets
- suspend flag
- email

## 4) Suspend and Enable

```ts
await rgw.users.suspend('alice');
await rgw.users.enable('alice');
```

Use suspension for temporary policy enforcement without deleting data.

## 5) List Users

```ts
const uids = await rgw.users.list();
console.log('Total users:', uids.length);
```

Useful for inventory and reconciliation jobs.

## 6) Fetch User Stats

```ts
const stats = await rgw.users.getStats({ uid: 'alice', sync: true });
console.log(stats.stats.numObjects, stats.stats.sizeKbActual);
```

Use this in billing and quota reporting flows.

## 7) Delete User Safely

Safe delete:

```ts
await rgw.users.delete({ uid: 'alice' });
```

Force delete with data purge (destructive):

```ts
await rgw.users.delete({ uid: 'alice', purgeData: true });
```

`purgeData: true` permanently deletes user-owned objects. Use only after explicit operator approval.

## Error Handling Pattern

```ts
import {
  RGWValidationError,
  RGWNotFoundError,
  RGWConflictError,
  RGWAuthError,
} from 'radosgw-admin';

try {
  await rgw.users.create({ uid: 'alice', displayName: 'Alice' });
} catch (error) {
  if (error instanceof RGWConflictError) {
    // user already exists
  } else if (error instanceof RGWValidationError) {
    // input invalid
  } else if (error instanceof RGWAuthError) {
    // credentials/caps issue
  } else if (error instanceof RGWNotFoundError) {
    // referenced entity missing
  } else {
    throw error;
  }
}
```

## Production Notes

1. Avoid destructive calls in automated retry loops.
2. Use unique, policy-compliant user IDs from your identity source of truth.
3. Keep admin keys out of logs and rotate them periodically.
4. Pair create/delete operations with audit logs in your application.
5. Validate business constraints before SDK calls to fail fast.
