# add-module

## Purpose
Scaffold a complete new module following the established architecture pattern. Creates all required files (module, types, tests, example, docs) and wires everything together.

## When To Use
- Adding a new API domain (e.g., roles, zones, lifecycle)
- Expanding the SDK with a new RGW Admin Ops endpoint group

## Canonical References
- Module pattern: `src/modules/users.ts` (reference implementation)
- Types pattern: `src/types/user.types.ts`
- Test pattern: `tests/unit/users.test.ts`
- Example pattern: `examples/basic-user-management.ts`
- Client wiring: `src/index.ts`

## Input
The user provides:
- Module name (e.g., `roles`, `zones`, `lifecycle`)
- List of methods with their HTTP verb, endpoint path, and description
- Input/output type shapes (or Ceph Admin Ops doc link to derive them)

## Steps

### 1. Create the types file
**File:** `src/types/<name>.types.ts`

- Define input interfaces for each method (e.g., `CreateRoleInput`, `GetRoleInput`)
- Define output interfaces matching the RGW JSON response (use camelCase — the client transforms automatically)
- Follow `exactOptionalPropertyTypes` — use `field?: T` only when the field is truly optional
- Export all types

### 2. Create the module file
**File:** `src/modules/<name>.ts`

```typescript
import { BaseClient } from '../client.js';
// import types...

export class <Name>Module {
  constructor(private readonly client: BaseClient) {}

  /**
   * Method description.
   *
   * @param input - Description
   * @returns Description
   * @throws {RGWValidationError} When input is invalid
   * @throws {RGWNotFoundError} When resource not found
   * @example
   * ```typescript
   * const result = await rgw.<name>.methodName({ ... });
   * ```
   */
  async methodName(input: InputType): Promise<OutputType> {
    // 1. Validate input (throw RGWValidationError before HTTP)
    // 2. Call this.client.request()
    // 3. Return typed result
  }
}
```

Rules:
- Every public method needs full JSDoc (`@param`, `@returns`, `@throws`, `@example`)
- Validate required fields before any HTTP call
- Destructive operations must emit `console.warn`
- `Promise<void>` for endpoints returning empty body
- No `any` types — strict TypeScript throughout
- Method naming: self-documenting, no Ceph jargon, domain verbs

### 3. Wire into the client
**File:** `src/index.ts`

- Import the new module class
- Add `readonly <name>: <Name>Module` property to `RadosGWAdminClient`
- Initialize in constructor: `this.<name> = new <Name>Module(this._client)`
- Add type re-exports for all public types

### 4. Create unit tests
**File:** `tests/unit/<name>.test.ts`

Follow the existing mock pattern:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseClient } from '../../src/client.js';
import { <Name>Module } from '../../src/modules/<name>.js';

function createMockClient() {
  return {
    request: vi.fn(),
  } as unknown as BaseClient & { request: ReturnType<typeof vi.fn> };
}

describe('<Name>Module', () => {
  let client: BaseClient & { request: ReturnType<typeof vi.fn> };
  let mod: <Name>Module;

  beforeEach(() => {
    client = createMockClient();
    mod = new <Name>Module(client);
  });

  // For each method, test:
  // 1. Happy path — correct HTTP method, path, query params sent; response returned
  // 2. Input validation — throws RGWValidationError for missing/invalid params
  // 3. Destructive ops — console.warn emitted
});
```

Target: >= 80% line coverage on the new module.

### 5. Create example file
**File:** `examples/<name>-management.ts`

- Use `process.env` for RGW_HOST, RGW_ACCESS_KEY, RGW_SECRET_KEY
- Include setup instructions in comments
- Demonstrate all key methods with realistic scenarios
- Show error handling patterns

### 6. Update documentation
- Add module to `README.md` API Reference section
- Add module to website sidebar if Docusaurus is set up
- Update CHANGELOG.md with the new module under `### Added`

### 7. Verify
```bash
npm run check   # typecheck + lint + format + test — all must pass
```

## Output
A checklist confirming all files created, tests passing, and `npm run check` green.
