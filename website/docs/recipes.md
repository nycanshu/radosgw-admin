---
sidebar_position: 6
title: Recipes
description: Common Ceph RGW admin patterns — provision users, enforce quotas, rotate keys, transfer buckets, and connect from Rook-Ceph or Kubernetes.
---

# Recipes

Common patterns for automating Ceph RGW administration with `radosgw-admin`.

## Connect from Rook-Ceph (Kubernetes)

When running inside a Kubernetes cluster with Rook-Ceph, the RGW endpoint is available as a Service. Fetch admin credentials from the Kubernetes Secret that Rook creates.

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

// Rook-Ceph stores admin credentials in a secret:
// kubectl get secret rook-ceph-object-user-my-store-my-user -n rook-ceph -o yaml
const rgw = new RadosGWAdminClient({
  host: 'http://rook-ceph-rgw-my-store.rook-ceph.svc',
  port: 80,
  accessKey: process.env.RGW_ACCESS_KEY,
  secretKey: process.env.RGW_SECRET_KEY,
});

const info = await rgw.info.get();
console.log('Connected to cluster:', info.fsid);
```

---

## Provision a User With Quota

Create a new S3 user and immediately enforce a storage quota — the standard onboarding pattern for multi-tenant RGW clusters.

```ts
await rgw.users.create({
  uid: 'alice',
  displayName: 'Alice',
  email: 'alice@example.com',
  maxBuckets: 10,
});

await rgw.quota.setUserQuota({
  uid: 'alice',
  maxSize: '10G',
  maxObjects: 100000,
  enabled: true,
});
```

---

## Bulk Quota Enforcement

Apply a quota to every user in the cluster — useful for enforcing new policies on existing users.

```ts
const uids = await rgw.users.list();

await Promise.all(
  uids.map(uid =>
    rgw.quota.setUserQuota({
      uid,
      maxSize: '20G',
      maxObjects: 500000,
      enabled: true,
    })
  )
);
```

---

## Rotate Access Keys

Generate a new key pair for a user and revoke the old one — for scheduled key rotation or security incidents.

```ts
const user = await rgw.users.get('alice');
const oldKey = user.keys[0].accessKey;

// Generate new key first
await rgw.keys.generate({ uid: 'alice' });

// Then revoke the old one
await rgw.keys.revoke({ accessKey: oldKey });
```

---

## Transfer Bucket Ownership

Move a bucket from one user to another — common when offboarding users or reorganising tenants.

```ts
const bucket = await rgw.buckets.getInfo('project-data');

await rgw.buckets.transferOwnership({
  bucket: 'project-data',
  bucketId: bucket.id,
  uid: 'bob',
});
```

---

## Suspend and Re-enable a User

Temporarily block access without deleting the user or their data.

```ts
await rgw.users.suspend('alice');

// Later, re-enable:
await rgw.users.enable('alice');
```

---

## Get Usage Report for a User

Check how much storage a specific user has consumed over a time range.

```ts
const report = await rgw.usage.get({
  uid: 'alice',
  start: '2024-01-01 00:00:00',
  end: '2024-12-31 23:59:59',
  showSummary: true,
  showEntries: false,
});

console.log(report.summary);
```

---

## Rate Limit a Tenant

Cap the request rate for a single user to prevent one tenant from overwhelming the cluster.

```ts
await rgw.rateLimit.setUserLimit({
  uid: 'alice',
  maxReadOps: 100,
  maxWriteOps: 50,
  maxReadBytes: 10 * 1024 * 1024, // 10 MB/s
  maxWriteBytes: 5 * 1024 * 1024, // 5 MB/s
  enabled: true,
});
```
