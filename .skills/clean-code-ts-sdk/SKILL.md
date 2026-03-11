# clean-code-ts-sdk

## Purpose
Enforce clean, production-grade TypeScript SDK code standards for this repo before merge and release.

## Core Principles
1. Validate input before making any HTTP request.
2. Keep method names explicit and domain-correct.
3. Preserve strict type safety (`no any`, no unsafe casts without reason).
4. Keep error handling deterministic and actionable.
5. Keep methods small and single-purpose.

## Required Coding Rules
1. Validation
- Required fields must throw `RGWValidationError` early.
- Optional fields must be validated when provided.
- Reject malformed IDs and unsafe numeric values.

2. API Semantics
- Method names must reflect user intent (`generate`, `revoke`, `transferOwnership`, etc.).
- Avoid Ceph internal jargon in public API names.
- Use scope suffixes for ambiguous multi-scope operations (`getUserQuota`, `setBucketQuota`).

3. Error Quality
- Preserve HTTP status -> typed error mapping.
- Include operation context in error messages where safe.
- Do not leak secrets in thrown errors or logs.

4. Type and Return Contracts
- Public methods must have explicit input/output types.
- Empty-body endpoints must return `Promise<void>`.
- Response type shapes must match transformed camelCase payloads.

5. Documentation Quality
- Every public method requires `@param`, `@returns`, `@throws`, `@example`.
- Examples should be realistic and runnable with minor setup.

6. Test Quality
- Every changed method requires:
  - happy-path test
  - validation failure test
  - API behavior test (query/body semantics)
- Destructive operations must assert warning behavior.

## Anti-Patterns (Block Merge)
- Silent coercion of invalid input.
- Catch-all generic errors that hide status/type.
- Breaking method rename without migration note.
- Unbounded retries or undocumented defaults.
- Business logic embedded in giant methods.

## Review Workflow
1. Run `npm run check`.
2. Audit changed files against this skill.
3. Classify findings as P0-P3.
4. Block merge for unresolved P0/P1 items.

## Report Template
```md
# Clean Code Review

## Scope
- Commit:
- Files:
- Date:

## Findings
1. [P1] ...
2. [P2] ...

## Decision
- APPROVED|CHANGES_REQUIRED
```

## Definition of Done
- No unresolved P0/P1 clean-code issues.
- Changed public APIs are typed, documented, and tested.
