---
title: Keys Guide
sidebar_position: 2
description: Generate and revoke Ceph RGW S3 and Swift access keys programmatically with the radosgw-admin Node.js SDK.
---

# Keys Guide

The `keys` module manages S3 and Swift access keys for RGW users:

- generate new key pairs
- revoke existing keys

API reference: [Keys types and methods](../api/classes/RadosGWAdminClient)

## Prerequisites

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ADMIN_ACCESS_KEY!,
  secretKey: process.env.RGW_ADMIN_SECRET_KEY!,
});
```

## 1) Generate a Key

Auto-generate a new S3 key pair:

```ts
const allKeys = await rgw.keys.generate({ uid: 'alice' });
const newKey = allKeys[allKeys.length - 1]; // newest key is last
console.log('Access key:', newKey.accessKey);
console.log('Secret key:', newKey.secretKey);
```

Supply specific credentials instead of auto-generating:

```ts
const allKeys = await rgw.keys.generate({
  uid: 'alice',
  accessKey: 'MY_ACCESS_KEY',
  secretKey: 'MY_SECRET_KEY',
  generateKey: false,
});
```

:::info
`generate()` returns the user's **entire** key list after the operation, not just the new key.
:::

## 2) Revoke a Key

Revoke an S3 key by access key ID:

```ts
await rgw.keys.revoke({ accessKey: 'OLDKEY123' });
```

Revoke a Swift key (requires `uid` and `keyType`):

```ts
await rgw.keys.revoke({
  accessKey: 'SWIFTKEY',
  uid: 'alice',
  keyType: 'swift',
});
```

## Key Rotation Pattern

A common production pattern is to generate a new key, update your application config, then revoke the old one:

```ts
// 1. Get current keys
const user = await rgw.users.get('alice');
const oldKey = user.keys[0].accessKey;

// 2. Generate new key
const keys = await rgw.keys.generate({ uid: 'alice' });
const newKey = keys[keys.length - 1];

// 3. Update your application config with newKey.accessKey / newKey.secretKey
// ... deploy config change ...

// 4. Revoke old key
await rgw.keys.revoke({ accessKey: oldKey });
```

## Error Handling

```ts
import { RGWValidationError, RGWNotFoundError } from 'radosgw-admin';

try {
  await rgw.keys.generate({ uid: 'alice' });
} catch (error) {
  if (error instanceof RGWValidationError) {
    // uid is empty or invalid
  } else if (error instanceof RGWNotFoundError) {
    // user does not exist
  } else {
    throw error;
  }
}
```

## Production Notes

1. Always rotate keys rather than sharing a single key across services.
2. Store keys in a secrets manager, never in source code or environment files committed to git.
3. Revoke keys immediately when a service is decommissioned or a key is compromised.
4. Keep at least one active key per user to avoid locking out applications.
