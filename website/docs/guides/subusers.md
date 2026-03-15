---
title: Subusers Guide
sidebar_position: 3
description: Create, modify and remove Ceph RGW subusers with the radosgw-admin Node.js SDK.
---

# Subusers Guide

The `subusers` module manages Swift subusers attached to RGW users:

- create subusers with Swift access
- modify subuser permissions
- remove subusers

API reference: [Subuser types and methods](../api/classes/RadosGWAdminClient)

## Prerequisites

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ADMIN_ACCESS_KEY!,
  secretKey: process.env.RGW_ADMIN_SECRET_KEY!,
});
```

## 1) Create a Subuser

```ts
const subusers = await rgw.subusers.create({
  uid: 'alice',
  subuser: 'alice:swift',
  access: 'readwrite',
  keyType: 'swift',
  generateSecret: true,
});
console.log(subusers[0].id, subusers[0].permissions);
```

:::info
The `subuser` field must be in `uid:name` format (e.g., `"alice:swift"`).
`create()` returns the user's **entire** subuser list, not just the new one.
:::

## 2) Modify a Subuser

Change a subuser's access level:

```ts
const subusers = await rgw.subusers.modify({
  uid: 'alice',
  subuser: 'alice:swift',
  access: 'full',
});
```

Available access levels: `read`, `write`, `readwrite`, `full`.

## 3) Remove a Subuser

Remove and purge keys (default):

```ts
await rgw.subusers.remove({
  uid: 'alice',
  subuser: 'alice:swift',
});
```

Remove but keep keys:

```ts
await rgw.subusers.remove({
  uid: 'alice',
  subuser: 'alice:swift',
  purgeKeys: false,
});
```

## Error Handling

```ts
import { RGWValidationError, RGWNotFoundError } from 'radosgw-admin';

try {
  await rgw.subusers.create({
    uid: 'alice',
    subuser: 'alice:swift',
    access: 'readwrite',
  });
} catch (error) {
  if (error instanceof RGWValidationError) {
    // uid or subuser format is invalid
  } else if (error instanceof RGWNotFoundError) {
    // parent user does not exist
  } else {
    throw error;
  }
}
```

## Production Notes

1. Subusers are primarily used for Swift API access. Use S3 keys for S3 workloads.
2. The `subuser` ID must always include the parent uid prefix (e.g., `alice:swift`, not just `swift`).
3. Use `purgeKeys: false` when removing a subuser if the keys are still referenced by running applications.
4. Audit subuser permissions regularly — `full` access includes admin operations.
