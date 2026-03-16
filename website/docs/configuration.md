---
sidebar_position: 3
title: Configuration
description: Configure the radosgw-admin Node.js SDK — host, access keys, port, timeouts, retries, TLS and debug options for Ceph RGW.
---

# Configuration

```ts
const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  port: 443,
  accessKey: 'ADMIN_KEY',
  secretKey: 'ADMIN_SECRET',
  adminPath: '/admin',
  timeout: 15000,
  region: 'us-east-1',
  insecure: false,
  debug: false,
  maxRetries: 3,
  retryDelay: 200,
});
```

## Notes
- `insecure: true` disables TLS verification and is not recommended in production.
- Increase `timeout` and tune `maxRetries`/`retryDelay` for unstable networks.
