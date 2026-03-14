# Examples

Runnable examples demonstrating all `radosgw-admin` SDK modules.

## Prerequisites

A running Ceph RGW instance with Admin Ops API enabled. Set these environment variables:

```bash
export RGW_HOST=http://localhost:8080
export RGW_ACCESS_KEY=your-admin-access-key
export RGW_SECRET_KEY=your-admin-secret-key
```

## Running

```bash
# Install tsx for running TypeScript directly
npm install -g tsx

# Run any example
npx tsx examples/basic-user-management.ts
npx tsx examples/key-subuser-management.ts
npx tsx examples/bucket-management.ts
npx tsx examples/quota-management.ts
npx tsx examples/ratelimit-management.ts
npx tsx examples/usage-reporting.ts
```

## Examples

| File | Module | What it covers |
|---|---|---|
| `basic-user-management.ts` | Users | Create, get, modify, suspend, enable, stats, list, delete |
| `key-subuser-management.ts` | Keys, Subusers | Generate/revoke keys, create/modify/remove subusers |
| `bucket-management.ts` | Buckets | List, getInfo, verifyIndex, transferOwnership, delete |
| `quota-management.ts` | Quota | User/bucket quotas with human-readable size strings |
| `ratelimit-management.ts` | Rate Limits | User/bucket/global rate limits |
| `usage-reporting.ts` | Usage, Info | Query usage reports, trim logs, cluster info |

## Quick test with Docker

Spin up a local Ceph demo container:

```bash
docker run -d --name ceph-demo -p 8080:8080 \
  -e CEPH_DEMO_UID=admin \
  -e CEPH_DEMO_ACCESS_KEY=testkey \
  -e CEPH_DEMO_SECRET_KEY=testsecret \
  quay.io/ceph/demo:latest-squid demo
```

Then:

```bash
export RGW_HOST=http://localhost:8080
export RGW_ACCESS_KEY=testkey
export RGW_SECRET_KEY=testsecret
npx tsx examples/basic-user-management.ts
```
