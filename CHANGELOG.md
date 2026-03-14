# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_No package changes yet. Next release will be v0.2.0._

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
