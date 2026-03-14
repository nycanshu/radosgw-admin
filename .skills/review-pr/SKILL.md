# review-pr

## Purpose
Perform a structured code review of a pull request against the project's conventions, quality standards, and architectural patterns.

## When To Use
- Reviewing a contributor's pull request
- Self-reviewing before merging your own feature branch
- Validating that a PR meets all project standards

## Input
- PR number (fetched via `gh pr view`) or branch diff (`git diff main...HEAD`)

## Review Checklist

### 1. Architecture & Patterns
- [ ] New modules follow the established pattern (`constructor(private readonly client: BaseClient)`)
- [ ] New types are in the correct `src/types/<domain>.types.ts` file
- [ ] Module is wired into `src/index.ts` (if new)
- [ ] No business logic in unexpected places (keep it in modules)

### 2. TypeScript Strictness
- [ ] No `any` types (strict mode enforced)
- [ ] `exactOptionalPropertyTypes` respected — `?` only for truly optional fields
- [ ] No `@ts-ignore` or `@ts-expect-error` without justification
- [ ] No type assertions (`as`) without clear reason

### 3. API Conventions
- [ ] Method names are self-documenting, no Ceph jargon
- [ ] snake_case → camelCase for responses (handled by `toCamelCase()` in client)
- [ ] camelCase → snake_case for outgoing query params
- [ ] Input validation throws `RGWValidationError` BEFORE any HTTP call
- [ ] Destructive operations emit `console.warn`
- [ ] `Promise<void>` for endpoints returning empty body
- [ ] Dates accepted as `string | Date`, returned as ISO strings

### 4. JSDoc Completeness
- [ ] Every new/modified public method has `@param`, `@returns`, `@throws`, `@example`
- [ ] `@throws` lists all applicable error classes
- [ ] `@example` contains compilable TypeScript

### 5. Testing
- [ ] New methods have unit tests covering happy path
- [ ] Input validation paths tested (throws before HTTP call)
- [ ] Destructive operation warnings tested (`vi.spyOn(console, 'warn')`)
- [ ] Tests use the established mock pattern (`createMockClient()`)
- [ ] Coverage target met (>= 80% on `src/modules/`)

### 6. Documentation
- [ ] README.md updated if new methods/modules added
- [ ] Example file updated or created
- [ ] CHANGELOG.md entry added

### 7. Security
- [ ] No credentials/secrets hardcoded
- [ ] No `eval()` or dynamic code execution
- [ ] User input validated before use in HTTP requests
- [ ] TLS verification not disabled by default

### 8. Breaking Changes
- [ ] No method renames without deprecation notice
- [ ] No type signature changes that break existing consumers
- [ ] No removed exports
- [ ] If breaking: version bump is major (or minor if < 1.0)

## Severity Levels
- **P0 — Blocker**: Security issue, broken functionality, data loss risk → must fix before merge
- **P1 — Major**: API contract violation, missing validation, undocumented breaking change → should fix
- **P2 — Moderate**: Incomplete docs, edge case, unclear naming → nice to fix
- **P3 — Nit**: Style, wording, non-critical polish → optional

## Output
Structured review with:
1. Summary (1-2 sentences)
2. Findings table (severity, file, line, issue, suggestion)
3. Verdict: **APPROVE**, **REQUEST CHANGES**, or **NEEDS DISCUSSION**
