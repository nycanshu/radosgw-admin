---
title: Changelog
sidebar_label: Changelog
sidebar_position: 99
---

# Changelog

All notable changes to radosgw-admin are documented here and on the [GitHub Releases](https://github.com/nycanshu/radosgw-admin/releases) page.

---

## v0.2.2

**Released:** October 21, 2026

:::warning Behavior change — review before upgrading
If your code passes `userCaps` to `users.modify()`, those capabilities are now **actually granted**. Before v0.2.2, RGW silently ignored them, so the call succeeded without changing anything. Your code does not need to change — the SDK now sends the caps to RGW's dedicated caps endpoint — but the same call now has a real effect. Audit those calls, especially broad grants like `users=*` or `buckets=*`, before upgrading. See [#86](https://github.com/nycanshu/radosgw-admin/issues/86).
:::

### New Features

- **users.addCaps(uid, caps)** / **users.removeCaps(uid, caps)** ([#86](https://github.com/nycanshu/radosgw-admin/issues/86)) — grant and revoke admin capabilities (for example `usage=read` for a billing exporter) without recreating the user. Both return the user's full updated caps list. See [Grant and Revoke Capabilities](./guides/users#5-grant-and-revoke-capabilities).

### Bug Fixes

- **`users.modify({ userCaps })` now actually changes capabilities** ([#86](https://github.com/nycanshu/radosgw-admin/issues/86)) — RGW ignores capabilities on its Modify User operation, so previously the call succeeded but the caps never changed. They are now added (merged with existing caps) through the caps endpoint. Passing `userCaps` to `modify()` is deprecated — use `addCaps()` / `removeCaps()`.

- **SigV4 signature fix for special characters** ([#83](https://github.com/nycanshu/radosgw-admin/issues/83)) — any request whose parameters contained `!`, `'`, `(`, `)` or `*` (for example a display name like `Backup (prod)`) was rejected by RGW with `RGWAuthError` / `SignatureDoesNotMatch`. The request signer now percent-encodes these characters as AWS Signature V4 requires and sorts query parameters in byte order. No API changes — affected calls now simply succeed.

### Deprecations

- **`userCaps` option of `users.modify()`** — use `users.addCaps()` / `users.removeCaps()` instead. It keeps working (adding caps, never replacing them); v0.3.0 will add a runtime deprecation warning, and it will be removed in v1.0.

### Compatibility

- **Node.js requirement corrected to >= 20.18.1** — the package previously declared Node.js >= 18, but its `undici` 7 dependency (added in v0.2.1) already required Node.js 20.18.1, so Node.js 18 never worked. Nothing that worked before stops working. Node.js 20 is end-of-life upstream; v0.3.0 will move to Node.js 22+.

---

## v0.2.1

**Released:** March 28, 2026

### Bug Fixes

- **TLS race condition fix** — `insecure: true` mode previously set `NODE_TLS_REJECT_UNAUTHORIZED=0` as a process-wide environment variable, causing concurrent requests from other client instances (with `insecure: false`) to inadvertently skip TLS verification. Fixed by replacing the global env var mutation with a scoped [`undici`](https://github.com/nodejs/undici) `Agent` dispatcher, which confines the TLS setting to a single `fetch()` call. This is a safe, backwards-compatible change — the `insecure: true` API is unchanged.

### Dependencies

- Added `undici` as a runtime dependency (1 package, 0 transitive dependencies). `undici` is the HTTP client library maintained by the Node.js core team and used internally by Node.js itself for its built-in `fetch`. It was selected specifically to avoid adding any third-party supply chain risk.

---

## v0.2.0

**Released:** March 18, 2026

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

**Released:** March 12, 2026

### Initial Release

- 8 modules: Users, Keys, Subusers, Buckets, Quota, Rate Limits, Usage, Info
- 40+ methods covering every RGW Admin Ops endpoint
- No third-party dependencies — AWS SigV4 signing uses only `node:crypto`
- Full TypeScript support with strict types
- ESM + CommonJS dual output
- Works with Rook-Ceph, OpenShift Data Foundation, and bare-metal Ceph clusters
- Typed error hierarchy: `RGWNotFoundError`, `RGWValidationError`, `RGWAuthError`, `RGWConflictError`, `RGWRateLimitError`, `RGWServiceError`
- `snake_case` ↔ `camelCase` automatic transformation for API compatibility
