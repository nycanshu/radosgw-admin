---
title: Info Guide
sidebar_position: 8
description: Retrieve Ceph RGW cluster info — FSID and storage backends — with the radosgw-admin Node.js SDK.
---

# Info Guide

The `info` module retrieves basic cluster information from the RGW endpoint:

- cluster FSID (unique identifier)
- storage backends

API reference: [Info types and methods](../api/classes/RadosGWAdminClient)

## Prerequisites

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ADMIN_ACCESS_KEY!,
  secretKey: process.env.RGW_ADMIN_SECRET_KEY!,
});
```

## Get Cluster Info

```ts
const info = await rgw.info.get();

for (const backend of info.info.storageBackends) {
  console.log('Backend:', backend.name);
  console.log('Cluster ID:', backend.clusterId);
}
```

## Health Check Pattern

Use `info.get()` as a lightweight connectivity and auth check:

```ts
async function healthCheck(): Promise<{ ok: boolean; clusterId?: string }> {
  try {
    const info = await rgw.info.get();
    return {
      ok: true,
      clusterId: info.info.storageBackends[0]?.clusterId,
    };
  } catch {
    return { ok: false };
  }
}
```

## Multi-Cluster Identification

When managing multiple Ceph clusters, use the cluster ID to confirm which cluster a client is connected to:

```ts
const EXPECTED_CLUSTERS: Record<string, string> = {
  production: 'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
  staging: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
};

const info = await rgw.info.get();
const clusterId = info.info.storageBackends[0]?.clusterId;

const env = Object.entries(EXPECTED_CLUSTERS).find(([, id]) => id === clusterId);
console.log('Connected to:', env?.[0] ?? 'unknown cluster');
```

## Error Handling

```ts
import { RGWAuthError } from 'radosgw-admin';

try {
  await rgw.info.get();
} catch (error) {
  if (error instanceof RGWAuthError) {
    // credentials are invalid or lack permission
  } else {
    throw error;
  }
}
```

## Production Notes

1. `info.get()` is the lightest API call — ideal for readiness probes and health checks.
2. The cluster FSID is stable across restarts and daemon changes. Use it as a unique identifier.
3. This endpoint only requires read permissions on the admin caps.
