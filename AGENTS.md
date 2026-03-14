# AGENTS.md — radosgw-admin

## Project Overview
Modern TypeScript client for the Ceph RADOS Gateway (RGW) Admin Ops REST API.
Full spec: `myplan/radosgw-admin-SRD.md`

## Commands
- `npm run build` — Build ESM + CJS with tsup
- `npm run typecheck` — TypeScript strict type checking
- `npm test` — Run vitest unit tests
- `npm run lint` — ESLint
- `npm run format` — Prettier format
- `npm run check` — Run all checks (typecheck + lint + format + test)

## Architecture
- **Entry point**: `src/index.ts` → exports `RadosGWAdminClient` class
- **Core client**: `src/client.ts` → `BaseClient` handles HTTP requests, SigV4 signing, response transforms
- **Signer**: `src/signer.ts` → AWS Signature V4 implementation (zero external deps)
- **Modules**: `src/modules/*.ts` → Each module (users, keys, buckets, etc.) is attached to the client as a namespaced property
- **Types**: `src/types/*.types.ts` → One file per domain (user, bucket, quota, usage, common)
- **Errors**: `src/errors.ts` → Error class hierarchy (RGWError → NotFound, Validation, Auth, Conflict)

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

## Testing
- Tests in `tests/unit/*.test.ts`
- Mock the HTTP layer, verify request params and response parsing
- Cover happy paths + all error classes
- Target: >= 80% line coverage on `src/modules/`

## Error Mapping
| HTTP Status | Thrown As |
|---|---|
| 404 | `RGWNotFoundError` |
| 409 | `RGWConflictError` |
| 403 | `RGWAuthError` |
| 400 | `RGWValidationError` |
| 5xx | `RGWError` (base) |
