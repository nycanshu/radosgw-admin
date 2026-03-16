---
sidebar_position: 2
title: Getting Started
description: Install radosgw-admin and make your first request to the Ceph RADOS Gateway Admin Ops API in minutes.
---

# Getting Started

## Install

```bash
npm install radosgw-admin
```

## Basic Usage

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ADMIN_ACCESS_KEY!,
  secretKey: process.env.RGW_ADMIN_SECRET_KEY!,
});

await rgw.users.create({
  uid: 'alice',
  displayName: 'Alice',
});
```

## Common Next Steps
- Set user/bucket quotas
- Rotate keys
- Collect usage reports
