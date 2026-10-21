# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing unreleased._

## [0.2.2] - 2026-10-21

> **Behavior change — review before upgrading:** if your code passes `userCaps` to `users.modify()`, those capabilities are now **actually granted**. Before 0.2.2 RGW silently ignored them, so the call succeeded without changing anything. The call itself is unchanged; the SDK now sends the caps to RGW's dedicated caps endpoint. Audit those calls — especially broad grants like `users=*` or `buckets=*` — before upgrading. See [#86](https://github.com/nycanshu/radosgw-admin/issues/86).

### Added

- **`users.addCaps(uid, caps)` and `users.removeCaps(uid, caps)`** ([#86](https://github.com/nycanshu/radosgw-admin/issues/86)) — grant and revoke admin capabilities through RGW's dedicated caps endpoints. Permissions merge on add and subtract on remove; both return the user's full updated caps list.

### Fixed

- **`users.modify({ userCaps })` silently did nothing** ([#86](https://github.com/nycanshu/radosgw-admin/issues/86)) — RGW's Modify User operation ignores capabilities, so the call succeeded without changing them. `modify()` now applies `userCaps` through the add-caps endpoint (merging, as a second request), and the option is deprecated in favour of `addCaps()` / `removeCaps()`.

- **SigV4 signature mismatch for query values containing `! ' ( ) *`** ([#83](https://github.com/nycanshu/radosgw-admin/issues/83)) — requests such as `users.create` / `users.modify` with a display name like `Backup (prod)` failed with `RGWAuthError` (`SignatureDoesNotMatch`). The canonical query string now uses strict RFC 3986 encoding as required by SigV4, and parameters are sorted by byte order of their encoded names instead of `localeCompare`. Thanks to @mantala96 for the report.
- **Package failed to load on Node.js 20** — the unreleased `undici` 8 upgrade on `main` requires Node.js >= 22.19 and crashed on import under Node.js 20. The runtime dependency stays on `undici` 7 (`^7.30.1`), the same major line shipped in 0.2.1.

### Deprecated

- **`userCaps` option of `users.modify()`** — use `users.addCaps()` / `users.removeCaps()` instead. It keeps working (adding caps, never replacing them) and will emit a runtime deprecation warning in 0.3.0 before being removed in 1.0.

### Changed

- **`engines.node` corrected to `>=20.18.1`** — previously declared `>=18`, but `undici` 7 (a dependency since 0.2.1) already requires Node.js 20.18.1, so 0.2.1 could not run on Node.js 18 either. This documents existing behavior; no supported runtime is dropped.

## [0.2.1] - 2026-03-28

### Fixed

- **TLS race condition with `insecure: true`** — previously set `NODE_TLS_REJECT_UNAUTHORIZED=0` as a process-wide environment variable, so concurrent requests from other client instances (with `insecure: false`) could skip TLS verification. TLS verification is now disabled only for that client's own requests via a scoped `undici` `Agent` dispatcher. The `insecure: true` API is unchanged.

### Added

- **`undici` runtime dependency** (1 package, 0 transitive dependencies) — the HTTP client maintained by the Node.js core team and used internally by Node's built-in `fetch`; required for the scoped TLS dispatcher.

## [0.2.0] - 2026-03-18

### Added

- **Request/response hooks** — `onBeforeRequest` and `onAfterResponse` callbacks in client config for logging, metrics, and telemetry. Hooks never break requests (errors are swallowed).
- **Health check** — `rgw.healthCheck()` returns `true`/`false` for one-liner connectivity verification.
- **Custom User-Agent** — sends `radosgw-admin/<version> node/<nodeVersion>` by default, configurable via `userAgent` option. Helps RGW operators identify SDK traffic in access logs.
- **AbortSignal support** — pass `signal` in request options for external request cancellation. Node 18 compatible.
- **Rook-Ceph integration guide** — standalone docs page with credential extraction, port-forward, in-cluster examples.
- **ODF integration guide** — standalone docs page for OpenShift Data Foundation deployments.
- **`llms.txt` on docs site** — AI crawlers can now discover the SDK at the docs URL.
- **Hook types exported** — `BeforeRequestHook`, `AfterResponseHook`, `HookContext` available for consumers.

- **`RGWRateLimitError`** — new error class for 429 Too Many Requests. Automatically retried when `maxRetries > 0`.
- **`RGWServiceError`** — new error class for 5xx server errors, distinct from network errors.
- **RGW error code passthrough** — errors now preserve the actual RGW code (`NoSuchUser`, `BucketAlreadyExists`, `SlowDown`, etc.) on the `code` property instead of generic codes.
- **Comprehensive error docs** — full error reference with RGW code tables, retry behavior, and usage examples.

### Changed

- **Retry backoff now uses full jitter** — `base + random(0, base)` instead of fixed exponential delay. Prevents thundering herd in multi-client production setups. Non-breaking behavioral change.
- **429 responses are now retryable** — rate limit errors are automatically retried with backoff alongside 5xx and network errors.
- **Error constructors accept RGW codes** — `RGWNotFoundError`, `RGWAuthError`, `RGWConflictError` now accept an optional `code` parameter for the actual RGW error code.
- **Homepage** now points to documentation site instead of GitHub README.
- **SDK version injected at build time** via tsup `define` for User-Agent header.

## [0.1.0] - 2026-03-12

### Added

- **Core client** with AWS SigV4 signing (zero external dependencies, `node:crypto` only)
- **User management** — `create`, `get`, `getByAccessKey`, `modify`, `delete`, `list`, `suspend`, `enable`, `getStats`
- **Key management** — `generate`, `revoke` (S3/Swift keys)
- **Subuser management** — `create`, `modify`, `remove`
- **Bucket management** — `list`, `listByUser`, `getInfo`, `delete`, `transferOwnership`, `removeOwnership`, `verifyIndex`
- **Quota management** — `getUserQuota`, `setUserQuota`, `enableUserQuota`, `disableUserQuota`, `getBucketQuota`, `setBucketQuota`, `enableBucketQuota`, `disableBucketQuota` (with human-readable size strings like `"10G"`)
- **Rate limit management** — `getUserLimit`, `setUserLimit`, `disableUserLimit`, `getBucketLimit`, `setBucketLimit`, `disableBucketLimit`, `getGlobal`, `setGlobal`
- **Usage & analytics** — `usage.get`, `usage.trim` with date range filtering
- **Cluster info** — `info.get` for FSID and storage backend discovery
- **Retry logic** with configurable exponential backoff (`maxRetries`, `retryDelay`)
- **Debug logging** via `debug: true` config option
- **Insecure TLS** support via `insecure: true` for self-signed certificates
- **Error hierarchy** — `RGWError`, `RGWNotFoundError`, `RGWValidationError`, `RGWAuthError`, `RGWConflictError`
- **Automatic case conversion** — snake_case responses → camelCase, camelCase params → snake_case
- **Input validation** — throws `RGWValidationError` before HTTP calls for missing/invalid params
- **Destructive operation warnings** — `console.warn` emitted for `purgeData`, `purgeObjects`, `removeAll`
- **Dual ESM + CJS build** with full TypeScript declarations
- **CI pipeline** — typecheck, lint, format, test (Node 18/20/22), publint, attw
- **npm publish pipeline** with provenance attestation
- **6 runnable examples** covering all modules
- **Full JSDoc** on all 39 public methods with `@param`, `@returns`, `@throws`, `@example`
- **CODE_OF_CONDUCT.md**, **CONTRIBUTING.md**, **SECURITY.md**
