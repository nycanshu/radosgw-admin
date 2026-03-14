# jsdoc-audit

## Purpose
Audit all public methods across the SDK for complete, accurate JSDoc documentation. Reports missing or incomplete tags and optionally auto-fixes them.

## When To Use
- Before a release to verify documentation completeness
- After adding or renaming methods
- When a contributor submits a PR with new public methods
- Periodic quality check

## Requirements
Every public method in `src/modules/*.ts` MUST have:

1. **Description** — one-line summary of what the method does
2. **`@param`** — for every parameter, with type and description
3. **`@returns`** — what the method returns, including the Promise type
4. **`@throws`** — every error class the method can throw:
   - `{RGWValidationError}` — if it validates input
   - `{RGWNotFoundError}` — if 404 is possible
   - `{RGWConflictError}` — if 409 is possible
   - `{RGWAuthError}` — if 403 is possible
   - `{RGWError}` — for server errors
5. **`@example`** — a working TypeScript code block showing usage

## Steps

### 1. Scan all module files
Read every file in `src/modules/*.ts` and extract all public methods (non-private, non-protected).

### 2. Check each method
For each method, verify all 5 required JSDoc tags are present and accurate:

| Check | Pass Criteria |
|---|---|
| Description | Non-empty, describes what the method does |
| `@param` | One entry per parameter, type matches signature |
| `@returns` | Present, matches actual return type |
| `@throws` | Lists all applicable error classes |
| `@example` | Contains a TypeScript code block that would compile |

### 3. Cross-reference with implementation
- Verify `@throws` tags match actual error paths in the method body
- Verify `@param` types match the TypeScript signature
- Verify `@returns` matches the actual return type
- Check that `@example` uses current method name and parameter shape

### 4. Report findings
Output a table:

```
| Module | Method | Missing/Incorrect |
|--------|--------|-------------------|
| users  | create | @example uses old param name |
| quota  | setUserQuota | missing @throws RGWAuthError |
```

### 5. Auto-fix (if requested)
Generate corrected JSDoc blocks for any methods with issues. Apply edits.

### 6. Verify
```bash
npm run typecheck   # ensure JSDoc doesn't break types
npm run build       # ensure build succeeds
```

## Output
- Audit table with pass/fail per method per tag
- Total coverage percentage
- List of fixes applied (if auto-fix requested)
