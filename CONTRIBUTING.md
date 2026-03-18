# Contributing

Contributions are welcome. This document covers the process and standards for contributing to `radosgw-admin`.

## Before You Start

- Check [open issues](https://github.com/nycanshu/radosgw-admin/issues) to avoid duplicate work
- For non-trivial changes, open an issue first to discuss the approach
- Read the [Code of Conduct](CODE_OF_CONDUCT.md)

## Setup

```bash
git clone https://github.com/nycanshu/radosgw-admin.git
cd radosgw-admin
npm install
```

Verify everything works:

```bash
npm run check   # typecheck + lint + format + test
```

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, release-ready code |
| `feature/*` | New features (branch from `main`) |
| `fix/*` | Bug fixes (branch from `main`) |

## Code Standards

**TypeScript**
- Strict mode (`strict: true`, `noImplicitAny: true`, `exactOptionalPropertyTypes: true`)
- No use of `any` — use `unknown` with type narrowing instead
- All public methods require JSDoc with `@param`, `@returns`, `@throws`, `@example`

**Architecture**
- Each API domain lives in its own module under `src/modules/`
- Types are co-located in `src/types/<domain>.types.ts`
- Modules receive `BaseClient` via constructor injection — no global state
- Input validation throws `RGWValidationError` *before* any HTTP call
- All RGW snake_case responses are converted to camelCase automatically

**Testing**
- Unit tests in `tests/unit/` using vitest
- Mock the HTTP layer — never make real RGW calls in tests
- Cover: happy path, validation errors, HTTP error mapping, edge cases
- Target: >= 80% line coverage on `src/modules/`

## Adding a New API Module

```
src/types/buckets.types.ts       # Input/output type definitions
src/modules/buckets.ts           # Module class with all methods
src/index.ts                     # Wire up: this.buckets = new BucketsModule(this._client)
tests/unit/buckets.test.ts       # Unit tests
```

Each module method follows this pattern:

```typescript
async create(input: CreateBucketInput): Promise<RGWBucket> {
  // 1. Validate required fields → throw RGWValidationError
  // 2. Call this.client.request({ method, path, query })
  // 3. Return typed response
}
```

## Commit Convention

```
<type>: <short summary>

Types: feat | fix | refactor | test | docs | chore | ci
```

Examples:
```
feat: implement bucket lifecycle operations
fix: handle empty key list in user response
test: add coverage for quota edge cases
refactor: extract request signing into standalone module
```

Keep commits atomic — one logical change per commit.

## Pull Requests

1. Branch from `main`, keep changes focused
2. Ensure `npm run check` passes (CI will verify this)
3. Include tests for new or changed behavior
4. Update `README.md` if the public API surface changes
5. Fill out the PR template — summary, changes, test plan

PRs are squash-merged into `main`.

## Versioning & Deprecation

This project follows [Semantic Versioning](https://semver.org/):

- **Patch** (`0.1.x`) — bug fixes, no API changes
- **Minor** (`0.x.0`) — new features, backwards-compatible
- **Major** (`x.0.0`) — breaking changes

**Deprecation policy:**

1. Deprecated methods/options are marked with `@deprecated` in JSDoc and emit a `console.warn` on first use.
2. Deprecated features are listed in the CHANGELOG under a `### Deprecated` section.
3. Deprecated features are removed no sooner than the **next major version**.
4. Migration guidance is provided in the CHANGELOG and/or docs when deprecating.

During the `0.x` pre-1.0 phase, minor versions may include breaking changes with clear CHANGELOG documentation. After `1.0.0`, the full deprecation cycle applies.

## Reporting Issues

- **Bugs:** Use the [bug report template](https://github.com/nycanshu/radosgw-admin/issues/new?template=bug_report.md). Include RGW version, Node.js version, and a minimal reproduction.
- **Features:** Use the [feature request template](https://github.com/nycanshu/radosgw-admin/issues/new?template=feature_request.md). Describe the use case, not just the solution.
- **Security:** See [SECURITY.md](SECURITY.md). Do not open public issues for vulnerabilities.
