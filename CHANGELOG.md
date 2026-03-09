# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-10

### Added

- **Core client** with AWS SigV4 signing (zero external dependencies, `node:crypto` only)
- **User management** — `create`, `get`, `modify`, `delete`, `list`, `suspend`, `enable`, `getStats`
- **Key management** — `create`, `delete` (S3/Swift keys)
- **Subuser management** — `create`, `modify`, `delete`
- **Bucket management** — `list`, `getInfo`, `delete`, `link`, `unlink`, `checkIndex`
- **Retry logic** with configurable exponential backoff (`maxRetries`, `retryDelay`)
- **Debug logging** via `debug: true` config option (logs requests/responses to `console.debug`)
- **Insecure TLS** support via `insecure: true` for self-signed certificates
- **Error hierarchy** — `RGWError`, `RGWNotFoundError`, `RGWValidationError`, `RGWAuthError`, `RGWConflictError`
- **Automatic case conversion** — snake_case/kebab-case/dot-separated responses to camelCase, camelCase params to kebab-case
- **Input validation** — throws `RGWValidationError` before HTTP calls for missing/invalid params
- **Destructive operation warnings** — `console.warn` emitted for `purgeData`, `purgeObjects`
- **Dual ESM + CJS build** with full TypeScript declarations
- **CI pipeline** — typecheck, lint, format, test (Node 18/20/22), publint, attw
- **118 unit tests** covering all modules, error paths, retry logic, debug logging, and TLS handling
