# test-module

## Purpose
Generate, improve, or audit unit tests for a specific module. Ensures comprehensive coverage following the project's established mock pattern.

## When To Use
- A module has missing or incomplete tests
- After adding new methods to a module
- Before a release to ensure coverage targets are met
- When a contributor submits a PR with insufficient tests

## Canonical References
- Test pattern: `tests/unit/users.test.ts` (most comprehensive example)
- Mock setup: `createMockClient()` returning `{ request: vi.fn() }`
- Coverage config: `vitest.config.ts` (90% lines/functions/statements, 80% branches)
- Error classes: `src/errors.ts`

## Input
The user provides:
- Module name (e.g., `users`, `buckets`, `quota`)
- Optionally: specific methods to focus on

## Steps

### 1. Read the module source
Read `src/modules/<name>.ts` to understand:
- Every public method and its signature
- Input validation logic (what throws `RGWValidationError`)
- HTTP calls made (`this.client.request()` params)
- Destructive operations (`console.warn` calls)
- Return type transformations

### 2. Read existing tests
Read `tests/unit/<name>.test.ts` to understand:
- What's already covered
- The mock pattern used
- Any gaps in coverage

### 3. Identify gaps
For each public method, verify tests exist for:

**Happy path:**
- Correct HTTP method (GET/POST/PUT/DELETE) is used
- Correct path is called (e.g., `/user`, `/bucket`)
- Correct query params are sent (camelCase → snake_case conversion)
- Response is returned with correct shape

**Input validation:**
- Empty/missing required fields throw `RGWValidationError`
- Whitespace-only strings throw `RGWValidationError`
- Invalid enum values throw `RGWValidationError`
- Validation fires BEFORE any HTTP call (`client.request` not called)

**Destructive operations:**
- `console.warn` is called with appropriate message
- Verify using `vi.spyOn(console, 'warn')`

**Edge cases:**
- Optional parameters omitted — verify they're not sent in query
- Tenant prefixing (for user methods)
- Date normalization (for usage methods)
- Size string parsing (for quota methods)

### 4. Generate missing tests
Follow the established pattern:

```typescript
describe('<ModuleName>', () => {
  let client: BaseClient & { request: ReturnType<typeof vi.fn> };
  let mod: ModuleClass;

  beforeEach(() => {
    client = createMockClient();
    mod = new ModuleClass(client);
  });

  describe('methodName', () => {
    it('should call correct endpoint with correct params', async () => {
      client.request.mockResolvedValue(expectedResponse);
      const result = await mod.methodName(input);
      expect(client.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/expected/path',
        query: { expected: 'params' },
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should throw RGWValidationError when uid is empty', async () => {
      await expect(mod.methodName({ uid: '' }))
        .rejects.toThrow(RGWValidationError);
      expect(client.request).not.toHaveBeenCalled();
    });
  });
});
```

### 5. Run and verify
```bash
npm test                    # all tests pass
npm run test:coverage       # check coverage meets thresholds
```

## Coverage Targets
- Lines: >= 90%
- Functions: >= 90%
- Statements: >= 90%
- Branches: >= 80%

## Output
- List of tests added/improved
- Coverage report showing improvement
- Confirmation all tests pass
