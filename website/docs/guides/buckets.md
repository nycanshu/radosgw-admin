---
title: Buckets Guide
sidebar_position: 4
description: List, inspect, delete and transfer ownership of Ceph RGW buckets with the radosgw-admin Node.js SDK.
---

# Buckets Guide

The `buckets` module manages RGW buckets at the admin level:

- list all buckets or per-user
- get detailed bucket metadata
- delete buckets
- transfer/remove bucket ownership
- verify and repair bucket indexes

API reference: [Bucket types and methods](../api/classes/RadosGWAdminClient)

## Prerequisites

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ADMIN_ACCESS_KEY!,
  secretKey: process.env.RGW_ADMIN_SECRET_KEY!,
});
```

## 1) List All Buckets

```ts
const all = await rgw.buckets.list();
console.log(`Cluster has ${all.length} buckets`);
```

## 2) List Buckets by User

```ts
const userBuckets = await rgw.buckets.listByUser('alice');
console.log(`alice has ${userBuckets.length} buckets`);
```

## 3) Get Bucket Info

```ts
const info = await rgw.buckets.getInfo('my-bucket');
console.log('Owner:', info.owner);
console.log('Objects:', info.usage.rgwMain.numObjects);
console.log('Size:', (info.usage.rgwMain.sizeKb / 1024).toFixed(2), 'MB');
```

## 4) Delete a Bucket

Safe delete (fails if bucket has objects):

```ts
await rgw.buckets.delete({ bucket: 'my-bucket' });
```

Force delete with object purge:

```ts
await rgw.buckets.delete({ bucket: 'my-bucket', purgeObjects: true });
```

:::warning
`purgeObjects: true` permanently deletes all objects in the bucket. This cannot be undone.
:::

## 5) Transfer Ownership

Move a bucket from one user to another:

```ts
const info = await rgw.buckets.getInfo('my-bucket');
await rgw.buckets.transferOwnership({
  bucket: 'my-bucket',
  bucketId: info.id,
  uid: 'bob',
});
```

:::info
You need the bucket's internal `id` (from `getInfo()`), not just the bucket name.
:::

## 6) Remove Ownership

Detach a bucket from its owner without deleting it:

```ts
await rgw.buckets.removeOwnership({
  bucket: 'my-bucket',
  uid: 'alice',
});
```

:::warning
This leaves the bucket orphaned — it can't be accessed via S3 until ownership is reassigned with `transferOwnership()`.
:::

## 7) Verify Bucket Index

Check for index inconsistencies (read-only):

```ts
const result = await rgw.buckets.verifyIndex({
  bucket: 'my-bucket',
  checkObjects: true,
  fix: false,
});
console.log('Invalid entries:', result.invalidMultipartEntries);
```

Repair detected issues:

```ts
await rgw.buckets.verifyIndex({
  bucket: 'my-bucket',
  fix: true,
});
```

## Error Handling

```ts
import {
  RGWValidationError,
  RGWNotFoundError,
} from 'radosgw-admin';

try {
  await rgw.buckets.delete({ bucket: 'my-bucket' });
} catch (error) {
  if (error instanceof RGWNotFoundError) {
    // bucket does not exist
  } else if (error instanceof RGWValidationError) {
    // bucket name is empty
  } else {
    throw error;
  }
}
```

## Production Notes

1. Always use `getInfo()` before `transferOwnership()` to get the correct `bucketId`.
2. Avoid `purgeObjects: true` in automated loops — add a manual confirmation step.
3. Run `verifyIndex({ fix: false })` first to assess damage before repairing.
4. The `list()` method fetches up to 100,000 entries. For very large clusters, check that the returned count matches expectations.
5. Bucket ownership transfers don't move objects — they update metadata only.
