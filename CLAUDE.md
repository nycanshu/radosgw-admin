# CLAUDE.md — radosgw-admin

## Project Overview
Node.js SDK for the Ceph RADOS Gateway (RGW) Admin Ops REST API.
Full spec: `myplan/radosgw-admin-SRD.md`

## Commands
- `npm run build` — Build ESM + CJS with tsup
- `npm run typecheck` — TypeScript strict type checking
- `npm test` — Run vitest unit tests
- `npm run test:integration` — Run integration tests against a live RGW
- `npm run lint` — ESLint
- `npm run format` — Prettier format
- `npm run check` — Run all checks (typecheck + lint + format + test)

## Architecture
- **Entry point**: `src/index.ts` → exports `RadosGWAdminClient` class + `healthCheck()` method
- **Core client**: `src/client.ts` → `BaseClient` handles HTTP requests, SigV4 signing, response transforms, retry with jitter, request/response hooks, User-Agent header, AbortSignal support
- **Signer**: `src/signer.ts` → AWS Signature V4 implementation (zero external deps)
- **Modules**: `src/modules/*.ts` → Each module (users, keys, buckets, etc.) is attached to the client as a namespaced property
- **Types**: `src/types/*.types.ts` → One file per domain (user, bucket, quota, usage, common) + hook types (`BeforeRequestHook`, `AfterResponseHook`, `HookContext`)
- **Errors**: `src/errors.ts` → Error class hierarchy (RGWError → NotFound, Validation, Auth, Conflict, RateLimit, Service). All errors preserve RGW error codes via `code` field.
- **Version injection**: `tsup.config.ts` → injects `__SDK_VERSION__` at build time for User-Agent header

## Conventions
- **No `any`** — `strict: true`, `noImplicitAny: true` in tsconfig
- **snake_case → camelCase** — All RGW API responses are transformed via `toCamelCase()` in client.ts
- **camelCase → snake_case** — Outgoing query params are transformed via `toSnakeCase()` in client.ts
- **Input validation** — Throw `RGWValidationError` before any HTTP call for missing/invalid params
- **Destructive ops** — `purgeData`, `purgeObjects`, `removeAll` must emit `console.warn`
- **JSDoc** — Every public method needs `@param`, `@returns`, `@throws`, `@example`
- **Void returns** — Methods where RGW returns empty body use `Promise<void>`
- **Dates** — Accept `string | Date`, return ISO strings (never Date objects)

## Module Pattern
Each module follows this structure:
```typescript
export class UsersModule {
  constructor(private readonly client: BaseClient) {}

  async create(input: CreateUserInput): Promise<RGWUser> {
    // 1. Validate input
    // 2. Call this.client.request()
    // 3. Return typed result
  }
}
```
Then attached in RadosGWAdminClient constructor: `this.users = new UsersModule(this._client)`

## Method Naming
- **Self-documenting** — A developer should understand what a method does without reading docs: `rgw.keys.generate()` not `rgw.keys.create()`, `rgw.keys.revoke()` not `rgw.keys.delete()`
- **Domain verbs** — Use precise verbs that describe the operation: `generate`/`revoke` for keys, `transferOwnership`/`removeOwnership` for bucket linking, `verifyIndex` for index checks
- **Scope suffixes** — When a module handles multiple scopes (user/bucket), suffix method names with the scope noun to avoid confusion: `getUserQuota()`, `setBucketQuota()`, `disableUserLimit()`
- **No Ceph jargon** — Use user-facing language, not internal Ceph terms: `transferOwnership` not `link`, `removeOwnership` not `unlink`
- **Consistent CRUD verbs** — `create`, `get`, `modify`, `delete` for standard CRUD; specialized verbs (`generate`, `revoke`, `suspend`, `enable`) when they better describe the action

## Client Features (v0.2.0)
- **Request hooks** — `onBeforeRequest`/`onAfterResponse` callbacks on `ClientConfig`. Hooks run on every request across all modules. Errors in hooks are swallowed (never break requests).
- **Health check** — `rgw.healthCheck()` returns `Promise<boolean>` by calling `info.get()` internally.
- **Custom User-Agent** — `userAgent` option on `ClientConfig`. Default: `radosgw-admin/<version> node/<nodeVersion>`.
- **AbortSignal** — `signal` field on `RequestOptions` for external request cancellation. Combined with internal timeout signal (Node 18 compatible).
- **Retry with jitter** — Full jitter on exponential backoff (`base + random * base`). Prevents thundering herd.

## Testing
- Unit tests in `tests/unit/*.test.ts` — mock HTTP layer, fast, run on every commit
- Integration tests in `tests/integration/*.ts` — standalone `npx tsx` scripts against real RGW
- `tests/integration/run-all.ts` — sequential runner, starts with health check
- Cover happy paths + all error classes
- Target: >= 80% line coverage on `src/modules/`

## Skills
When adding or modifying any method in `src/modules/`, always follow the sync-docs skill:
`.skills/sync-docs/SKILL.md`

This enforces two things:
1. **Completeness** — every method is reflected across all 5 surfaces: `website/docs/guides/<module>.md`, `website/docs/modules.md`, `website/docs/intro.md`, `README.md`, `website/docs/changelog.md`
2. **Clarity** — every guide section is readable and self-contained: a developer who reads only that section can call the method correctly and safely on their first try

## Error Mapping
| HTTP Status | Thrown As | Retryable |
|---|---|---|
| 400 | `RGWValidationError` (codes: InvalidArgument, InvalidBucketName, MalformedPolicy) | No |
| 403 | `RGWAuthError` (codes: AccessDenied, InvalidAccessKeyId, SignatureDoesNotMatch) | No |
| 404 | `RGWNotFoundError` (codes: NoSuchUser, NoSuchBucket, NoSuchKey, NoSuchSubUser) | No |
| 409 | `RGWConflictError` (codes: UserAlreadyExists, BucketAlreadyExists, KeyExists, EmailExists) | No |
| 429 | `RGWRateLimitError` (codes: TooManyRequests, SlowDown) | Yes |
| 5xx | `RGWServiceError` (codes: InternalError, ServiceUnavailable) | Yes |
| Network | `RGWError` (code: NetworkError) | Yes |
| Timeout | `RGWError` (code: Timeout) | Yes |
