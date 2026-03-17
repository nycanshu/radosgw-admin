---
sidebar_position: 10
title: OpenShift Data Foundation
description: Connect radosgw-admin to OpenShift Data Foundation (ODF). Get admin credentials from ODF secrets, find the RGW route, and manage S3 users and buckets.
keywords: [openshift data foundation, odf, rgw, admin ops, ceph, openshift, red hat, node.js, s3 admin]
---

# OpenShift Data Foundation (ODF)

Connect `radosgw-admin` to the RADOS Gateway managed by [OpenShift Data Foundation](https://www.redhat.com/en/technologies/cloud-computing/openshift-data-foundation) (formerly OpenShift Container Storage).

## Prerequisites

- An OpenShift cluster with ODF installed
- A `CephObjectStore` resource deployed by ODF
- `oc` CLI with cluster access
- Node.js >= 18

## Get Admin Credentials

ODF creates an admin user automatically when a `CephObjectStore` is provisioned. The credentials are stored in a Kubernetes Secret in the `openshift-storage` namespace.

```bash
# Find the admin ops secret
oc get secrets -n openshift-storage | grep rgw-admin-ops-user

# The default secret name:
# ocs-storagecluster-ceph-rgw-admin-ops-user

# Extract credentials
export RGW_ACCESS_KEY=$(oc get secret \
  ocs-storagecluster-ceph-rgw-admin-ops-user \
  -n openshift-storage \
  -o jsonpath='{.data.AccessKey}' | base64 -d)

export RGW_SECRET_KEY=$(oc get secret \
  ocs-storagecluster-ceph-rgw-admin-ops-user \
  -n openshift-storage \
  -o jsonpath='{.data.SecretKey}' | base64 -d)
```

## Find the RGW Endpoint

ODF exposes the RGW via an OpenShift Route or internal Service.

### Internal Service (in-cluster access)

```bash
oc get svc -n openshift-storage | grep rgw
```

The internal endpoint is typically:
```
http://rook-ceph-rgw-ocs-storagecluster-cephobjectstore.openshift-storage.svc:80
```

### External Route (outside the cluster)

```bash
oc get route -n openshift-storage | grep rgw
```

If no route exists, create one:

```bash
oc expose svc/rook-ceph-rgw-ocs-storagecluster-cephobjectstore -n openshift-storage
```

## Connect from Local Machine

Use `oc port-forward` or the external Route:

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

// Option 1: via port-forward
// oc port-forward svc/rook-ceph-rgw-ocs-storagecluster-cephobjectstore \
//   -n openshift-storage 8080:80

const rgw = new RadosGWAdminClient({
  host: 'http://localhost',
  port: 8080,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
});

// Option 2: via external Route (TLS)
const rgwExternal = new RadosGWAdminClient({
  host: 'https://rgw-openshift-storage.apps.mycluster.example.com',
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
});

const info = await rgw.info.get();
console.log('Connected to ODF cluster:', info.fsid);
```

## Connect from Inside the Cluster

When your app runs as a Pod on OpenShift, use the internal Service DNS:

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'http://rook-ceph-rgw-ocs-storagecluster-cephobjectstore.openshift-storage.svc',
  port: 80,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
});
```

### Inject Credentials via DeploymentConfig

```yaml
env:
  - name: RGW_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: ocs-storagecluster-ceph-rgw-admin-ops-user
        key: AccessKey
  - name: RGW_SECRET_KEY
    valueFrom:
      secretKeyRef:
        name: ocs-storagecluster-ceph-rgw-admin-ops-user
        key: SecretKey
```

## Full Example: Manage S3 Tenants on ODF

A complete script for provisioning and managing S3 tenants on ODF:

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: process.env.RGW_HOST ||
    'http://rook-ceph-rgw-ocs-storagecluster-cephobjectstore.openshift-storage.svc',
  port: Number(process.env.RGW_PORT) || 80,
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
});

// Create an S3 user for a team
const user = await rgw.users.create({
  uid: 'team-platform',
  displayName: 'Platform Team',
  email: 'platform@company.com',
  maxBuckets: 10,
});

console.log('Created user:', user.userId);
console.log('S3 Access Key:', user.keys[0].accessKey);
console.log('S3 Secret Key:', user.keys[0].secretKey);

// Enforce 100 GB quota
await rgw.quota.setUserQuota({
  uid: 'team-platform',
  maxSize: '100G',
  enabled: true,
});

// List all buckets in the cluster
const buckets = await rgw.buckets.list();
console.log('Total buckets:', buckets.length);

// Get usage stats
const usage = await rgw.usage.get({
  uid: 'team-platform',
  showSummary: true,
});
console.log('Usage:', usage.summary);
```

## Troubleshooting

### Secret not found

On some ODF versions, the admin ops secret name may differ. Search for it:

```bash
oc get secrets -n openshift-storage | grep -i admin
```

### Self-signed TLS certificates

If ODF uses self-signed certs on the Route, disable TLS verification:

```ts
const rgw = new RadosGWAdminClient({
  host: 'https://rgw-route.apps.mycluster.example.com',
  accessKey: process.env.RGW_ACCESS_KEY!,
  secretKey: process.env.RGW_SECRET_KEY!,
  insecure: true, // Skip TLS verification (dev only!)
});
```

### Finding the correct namespace

ODF typically uses `openshift-storage`, but verify:

```bash
oc get cephobjectstore -A
```
