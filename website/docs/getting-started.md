---
sidebar_position: 2
title: Getting Started
description: Install radosgw-admin and make your first request to the Ceph RADOS Gateway Admin Ops API in minutes.
---

# Getting Started

## Install

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="npm" label="npm" default>

```bash
npm install radosgw-admin
```

  </TabItem>
  <TabItem value="yarn" label="yarn">

```bash
yarn add radosgw-admin
```

  </TabItem>
  <TabItem value="pnpm" label="pnpm">

```bash
pnpm add radosgw-admin
```

  </TabItem>
  <TabItem value="bun" label="bun">

```bash
bun add radosgw-admin
```

  </TabItem>
</Tabs>

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
