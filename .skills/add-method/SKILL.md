# add-method

## Purpose
Add a new method to an existing module with all required artifacts: types, JSDoc, tests, example update, and docs update.

## When To Use
- Implementing a new RGW Admin Ops endpoint in an existing module
- Adding a convenience method that wraps an existing endpoint

## Canonical References
- Module pattern: see the target module in `src/modules/`
- Naming conventions: `CLAUDE.md` → Method Naming section
- Test pattern: corresponding file in `tests/unit/`

## Input
The user provides:
- Target module (e.g., `users`, `buckets`)
- Method name and description
- HTTP verb and endpoint path
- Input parameters and output shape
- Whether it's a destructive operation

## Steps

### 1. Add input/output types
**File:** `src/types/<module>.types.ts`

- Add input interface (e.g., `NewMethodInput`) with required and optional fields
- Add output interface if the response has a new shape
- Use `exactOptionalPropertyTypes` — only `?` for truly optional fields
- Export the new types

### 2. Add the method to the module
**File:** `src/modules/<module>.ts`

Requirements:
- Full JSDoc with `@param`, `@returns`, `@throws`, `@example`
- Validate required input fields before HTTP call (throw `RGWValidationError`)
- If destructive: emit `console.warn` before executing
- If void return: use `Promise<void>`
- Method name must be self-documenting — no Ceph jargon
- Follow naming conventions: domain verbs, scope suffixes for multi-scope modules

### 3. Export new types
**File:** `src/index.ts`

- Add `export type { NewType }` if any new public types were created

### 4. Add unit tests
**File:** `tests/unit/<module>.test.ts`

Add tests for:
- **Happy path**: correct HTTP method, path, query params; correct response shape
- **Input validation**: throws `RGWValidationError` for each required field
- **Destructive warning**: `console.warn` called if applicable
- **Error propagation**: verify SDK errors bubble up correctly

Use the existing mock pattern in the test file.

### 5. Update example
**File:** `examples/<module>-management.ts`

- Add a section demonstrating the new method
- Include realistic parameter values

### 6. Update docs
- Add method to the module's section in `README.md`
- Update CHANGELOG.md under `### Added`

### 7. Verify
```bash
npm run check   # all must pass
```

## Method Naming Rules
- **Self-documenting** — developer understands without reading docs
- **Domain verbs** — `generate`/`revoke` for keys, `transferOwnership` for bucket linking
- **Scope suffixes** — `getUserQuota()`, `setBucketQuota()` when module handles multiple scopes
- **No Ceph jargon** — `transferOwnership` not `link`, `removeOwnership` not `unlink`
- **Consistent CRUD** — `create`, `get`, `modify`, `delete` for standard ops

## Output
Confirmation that the method is implemented, tested, documented, and `npm run check` passes.
