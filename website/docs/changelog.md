---
title: Changelog
sidebar_label: Changelog
sidebar_position: 99
---

# Changelog

All notable changes to radosgw-admin are documented here and on the [GitHub Releases](https://github.com/nycanshu/radosgw-admin/releases) page.

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
- 45+ methods covering every RGW Admin Ops endpoint
- Zero runtime dependencies — AWS SigV4 signing uses only `node:crypto`
- Full TypeScript support with strict types
- ESM + CommonJS dual output
- Works with Rook-Ceph, OpenShift Data Foundation, and bare-metal Ceph clusters
- Typed error hierarchy: `RGWNotFoundError`, `RGWValidationError`, `RGWAuthError`, `RGWConflictError`, `RGWRateLimitError`, `RGWServiceError`
- `snake_case` ↔ `camelCase` automatic transformation for API compatibility
