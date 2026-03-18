# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing unreleased._

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

### Changed

- **Retry backoff now uses full jitter** — `base + random(0, base)` instead of fixed exponential delay. Prevents thundering herd in multi-client production setups. Non-breaking behavioral change.
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
