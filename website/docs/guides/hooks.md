---
sidebar_position: 11
title: Hooks & Observability
description: Use request/response hooks in radosgw-admin for logging, metrics, telemetry, and debugging. Includes examples for Prometheus, audit logging, and performance monitoring.
keywords: [hooks, observability, logging, metrics, prometheus, telemetry, radosgw-admin, ceph rgw]
---

# Hooks & Observability

`radosgw-admin` provides request lifecycle hooks that let you add logging, metrics, and telemetry without modifying the SDK internals.

## How Hooks Work

Hooks are callbacks configured when creating the client. They run on **every HTTP request** across all 8 modules — users, keys, subusers, buckets, quotas, rate limits, usage, and info.

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'http://rgw:8080',
  accessKey: '...',
  secretKey: '...',
  onBeforeRequest: [
    (ctx) => console.log(`→ ${ctx.method} ${ctx.path}`),
  ],
  onAfterResponse: [
    (ctx) => console.log(`← ${ctx.status} in ${ctx.durationMs}ms`),
  ],
});

await rgw.users.list();
// → GET /user
// ← 200 in 45ms
```

## Hook Context

### `onBeforeRequest` receives:

| Field | Type | Description |
|---|---|---|
| `method` | `'GET' \| 'POST' \| 'PUT' \| 'DELETE'` | HTTP method |
| `path` | `string` | RGW Admin API path (e.g. `/user`) |
| `url` | `string` | Full request URL with query params |
| `query` | `Record<string, ...>` | Query parameters (if any) |
| `attempt` | `number` | 0-based retry attempt number |
| `startTime` | `number` | `Date.now()` when the request started |

### `onAfterResponse` receives all of the above, plus:

| Field | Type | Description |
|---|---|---|
| `status` | `number \| undefined` | HTTP status code (undefined for network errors) |
| `durationMs` | `number` | Request duration in milliseconds |
| `error` | `Error \| undefined` | Error if the request failed |

## Error Handling in Hooks

**Hooks never break RGW operations.** If a hook throws, the error is silently caught and logged (when `debug: true`). The actual request/response continues normally.

```ts
onBeforeRequest: [
  () => { throw new Error('hook crashed'); },
  // ↑ swallowed — request still fires
],
```

## Hooks and Retries

When `maxRetries > 0`, hooks fire on **every attempt**, not just the first. The `attempt` field tells you which attempt it is:

```ts
onBeforeRequest: [
  (ctx) => {
    if (ctx.attempt > 0) {
      console.warn(`Retry #${ctx.attempt} for ${ctx.method} ${ctx.path}`);
    }
  },
],
```

## Examples

### Request Logging

```ts
const rgw = new RadosGWAdminClient({
  host: 'http://rgw:8080',
  accessKey: '...',
  secretKey: '...',
  onBeforeRequest: [
    (ctx) => console.log(`[RGW] → ${ctx.method} ${ctx.path}`),
  ],
  onAfterResponse: [
    (ctx) => {
      const status = ctx.error ? `ERROR: ${ctx.error.message}` : ctx.status;
      console.log(`[RGW] ← ${status} (${ctx.durationMs}ms)`);
    },
  ],
});
```

### Prometheus Metrics

```ts
import { Histogram, Counter } from 'prom-client';

const requestDuration = new Histogram({
  name: 'rgw_admin_request_duration_ms',
  help: 'RGW Admin API request duration',
  labelNames: ['method', 'path', 'status'],
});

const requestErrors = new Counter({
  name: 'rgw_admin_request_errors_total',
  help: 'RGW Admin API request errors',
  labelNames: ['method', 'path'],
});

const rgw = new RadosGWAdminClient({
  host: 'http://rgw:8080',
  accessKey: '...',
  secretKey: '...',
  onAfterResponse: [
    (ctx) => {
      requestDuration.observe(
        { method: ctx.method, path: ctx.path, status: String(ctx.status ?? 'network_error') },
        ctx.durationMs,
      );
      if (ctx.error) {
        requestErrors.inc({ method: ctx.method, path: ctx.path });
      }
    },
  ],
});
```

### Audit Logging

```ts
import { appendFileSync } from 'node:fs';

const rgw = new RadosGWAdminClient({
  host: 'http://rgw:8080',
  accessKey: '...',
  secretKey: '...',
  onAfterResponse: [
    (ctx) => {
      const entry = JSON.stringify({
        timestamp: new Date(ctx.startTime).toISOString(),
        method: ctx.method,
        path: ctx.path,
        status: ctx.status,
        durationMs: ctx.durationMs,
        error: ctx.error?.message,
      });
      appendFileSync('/var/log/rgw-admin-audit.jsonl', entry + '\n');
    },
  ],
});
```

### Performance Monitoring (Slow Request Warning)

```ts
const rgw = new RadosGWAdminClient({
  host: 'http://rgw:8080',
  accessKey: '...',
  secretKey: '...',
  onAfterResponse: [
    (ctx) => {
      if (ctx.durationMs > 2000) {
        console.warn(
          `[SLOW] ${ctx.method} ${ctx.path} took ${ctx.durationMs}ms`,
        );
      }
    },
  ],
});
```

## Security: Redacting Sensitive Data

Hook context includes the full request URL. When creating users with pre-specified credentials, the URL may contain `secret-key` as a query parameter. **If you send hook data to external systems, redact sensitive fields:**

```ts
onAfterResponse: [
  (ctx) => {
    // Redact secret-key from URL before logging
    const safeUrl = ctx.url.replace(/([?&]secret-key=)[^&]*/gi, '$1[REDACTED]');
    logger.info({ method: ctx.method, url: safeUrl, status: ctx.status });
  },
],
```

The SDK already redacts `secret-key` from its own `debug` logs, but hooks receive the raw URL so you have full control.

## Non-Blocking Hooks

If your hook sends data over the network (e.g. to a metrics server), avoid blocking RGW requests by not `await`ing the network call:

```ts
onAfterResponse: [
  (ctx) => {
    // Fire-and-forget — don't await
    metricsServer.send(ctx.durationMs).catch(() => {});
  },
],
```

## TypeScript Types

All hook types are exported for consumers:

```ts
import type {
  BeforeRequestHook,
  AfterResponseHook,
  HookContext,
} from 'radosgw-admin';
```
