---
sidebar_position: 9
title: Rook-Ceph Integration
description: Connect radosgw-admin to a Rook-Ceph RGW instance running on Kubernetes. Get admin credentials, port-forward for local dev, and connect from in-cluster pods.
keywords: [rook-ceph, rgw, admin ops, kubernetes, node.js, ceph object storage, rook ceph admin api]
---

# Rook-Ceph Integration

Connect `radosgw-admin` to the RADOS Gateway running inside a [Rook-Ceph](https://rook.io/) cluster on Kubernetes.

## Prerequisites

- A Kubernetes cluster with Rook-Ceph deployed
- A `CephObjectStore` resource (e.g. `my-store`) with the Admin Ops API enabled
- `kubectl` access to the `rook-ceph` namespace
- Node.js >= 18

## Get Admin Credentials

Rook creates a Kubernetes Secret for each `CephObjectStoreUser`. The admin user secret contains the access key and secret key needed for the Admin Ops API.

```bash
# Find the admin user secret
kubectl get secrets -n rook-ceph | grep object-user

# Extract credentials
export RGW_ACCESS_KEY=$(kubectl get secret \
  rook-ceph-object-user-my-store-admin \
  -n rook-ceph \
  -o jsonpath='{.data.AccessKey}' | base64 -d)

export RGW_SECRET_KEY=$(kubectl get secret \
  rook-ceph-object-user-my-store-admin \
  -n rook-ceph \
  -o jsonpath='{.data.SecretKey}' | base64 -d)
```

If you don't have an admin user yet, create one:

```yaml
apiVersion: ceph.rook.io/v1
kind: CephObjectStoreUser
metadata:
  name: admin
  namespace: rook-ceph
spec:
  store: my-store
  displayName: "Admin User"
  capabilities:
    user: "*"
    bucket: "*"
    metadata: "*"
    usage: "*"
    zone: "*"
```

## Connect from Local Machine (port-forward)

For local development, forward the RGW Service port to your machine:

```bash
kubectl port-forward svc/rook-ceph-rgw-my-store -n rook-ceph 8080:80
```

Then connect:

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'http://localhost',
  port: 8080,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
});

// Verify connectivity
const info = await rgw.info.get();
console.log('Cluster FSID:', info.fsid);
```

## Connect from Inside the Cluster

When your Node.js app runs as a Pod in the same Kubernetes cluster, use the RGW Service DNS name directly. No port-forward needed.

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  // Rook-Ceph RGW service DNS:
  // rook-ceph-rgw-<store-name>.<namespace>.svc
  host: 'http://rook-ceph-rgw-my-store.rook-ceph.svc',
  port: 80,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
});
```

### Inject Credentials via Environment

Mount the Rook secret as environment variables in your Pod spec:

```yaml
env:
  - name: RGW_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: rook-ceph-object-user-my-store-admin
        key: AccessKey
  - name: RGW_SECRET_KEY
    valueFrom:
      secretKeyRef:
        name: rook-ceph-object-user-my-store-admin
        key: SecretKey
```

## Full Example: Provision Users on Rook-Ceph

A complete script that connects to Rook-Ceph and provisions a tenant with quotas and rate limits:

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: process.env.RGW_HOST || 'http://rook-ceph-rgw-my-store.rook-ceph.svc',
  port: Number(process.env.RGW_PORT) || 80,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
});

// Create tenant user
const user = await rgw.users.create({
  uid: 'tenant-acme',
  displayName: 'ACME Corp',
  email: 'admin@acme.com',
  maxBuckets: 20,
});

console.log('Created user:', user.userId);
console.log('Access key:', user.keys[0].accessKey);

// Set 50 GB storage quota
await rgw.quota.setUserQuota({
  uid: 'tenant-acme',
  maxSize: '50G',
  maxObjects: 1000000,
  enabled: true,
});

// Set rate limits (100 read ops/min, 50 write ops/min)
await rgw.rateLimit.setUserLimit({
  uid: 'tenant-acme',
  maxReadOps: 100,
  maxWriteOps: 50,
  enabled: true,
});

console.log('Tenant provisioned with quota and rate limits');
```

## Troubleshooting

### Connection refused on port-forward

Make sure the RGW pod is running:

```bash
kubectl get pods -n rook-ceph -l app=rook-ceph-rgw
```

### 403 Forbidden on Admin Ops calls

The `CephObjectStoreUser` needs admin capabilities. Verify:

```bash
kubectl get cephobjectstoreuser admin -n rook-ceph -o yaml
```

Ensure `capabilities` includes `user: "*"` and `bucket: "*"` at minimum.

### Finding the correct service name

```bash
kubectl get svc -n rook-ceph | grep rgw
```

The service name follows the pattern `rook-ceph-rgw-<store-name>`.
