---
title: Changelog
sidebar_label: Changelog
sidebar_position: 99
---

# Changelog

All notable changes to radosgw-admin are documented here and on the [GitHub Releases](https://github.com/nycanshu/radosgw-admin/releases) page.

---

## v0.2.1

**Released:** March 2026

### Bug Fixes

- **TLS race condition fix** — `insecure: true` mode previously set `NODE_TLS_REJECT_UNAUTHORIZED=0` as a process-wide environment variable, causing concurrent requests from other client instances (with `insecure: false`) to inadvertently skip TLS verification. Fixed by replacing the global env var mutation with a scoped [`undici`](https://github.com/nodejs/undici) `Agent` dispatcher, which confines the TLS setting to a single `fetch()` call. This is a safe, backwards-compatible change — the `insecure: true` API is unchanged.

### Dependencies

- Added `undici` as a runtime dependency (1 package, 0 transitive dependencies). `undici` is the HTTP client library maintained by the Node.js core team and used internally by Node.js itself for its built-in `fetch`. It was selected specifically to avoid adding any third-party supply chain risk.

---

## v0.2.0

**Released:** March 2026

### New Features

- **Request hooks** — `onBeforeRequest` and `onAfterResponse` callbacks on `ClientConfig`. Hooks run on every request across all modules. Errors in hooks are swallowed (never break requests).
- **Health check** — `rgw.healthCheck()` returns `Promise<boolean>` by calling `info.get()` internally.
- **Custom User-Agent** — `userAgent` option on `ClientConfig`. Default: `radosgw-admin/<version> node/<nodeVersion>`.
- **AbortSignal support** — `signal` field on `RequestOptions` for external request cancellation. Combined with internal timeout signal (Node 18 compatible).
- **Retry with jitter** — Full jitter on exponential backoff (`base + random * base`). Prevents thundering herd.

### Improvements

- Improved error handling across all modules
- Better TypeScript type exports
- Enhanced input validation

---

## v0.1.0

**Released:** February 2026

### Initial Release

- 8 modules: Users, Keys, Subusers, Buckets, Quota, Rate Limits, Usage, Info
- 40+ methods covering every RGW Admin Ops endpoint
- No third-party dependencies — AWS SigV4 signing uses only `node:crypto`
- Full TypeScript support with strict types
- ESM + CommonJS dual output
- Works with Rook-Ceph, OpenShift Data Foundation, and bare-metal Ceph clusters
- Typed error hierarchy: `RGWNotFoundError`, `RGWValidationError`, `RGWAuthError`, `RGWConflictError`, `RGWRateLimitError`, `RGWServiceError`
- `snake_case` ↔ `camelCase` automatic transformation for API compatibility
