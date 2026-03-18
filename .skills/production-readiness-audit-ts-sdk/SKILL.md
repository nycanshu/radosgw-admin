# production-readiness-audit-ts-sdk

## Purpose
Run a structured production-readiness audit for this TypeScript SDK before release, focused on API correctness, resilience, compatibility, and maintainability.

## Canonical References
- Ceph RGW Admin Ops API docs: https://docs.ceph.com/en/latest/radosgw/adminops/
- Package publish policy (`package.json`, `CHANGELOG.md`, `README.md`)
- Internal spec: `myplan/radosgw-admin-SRD.md`

## When To Use
- Before `npm publish`
- Before minor/major release tags
- After significant changes to `src/client.ts`, `src/modules/*`, or `src/types/*`

## Audit Checklist
1. API Contract Integrity
- Public methods are self-documenting and stable.
- No breaking signature/type changes without semver bump.
- Query param conversion behavior remains correct (camelCase -> kebab-case).
- Response conversion behavior remains correct (snake/kebab/dot -> camelCase).

2. Input Validation Rigor
- Required fields fail fast with `RGWValidationError`.
- Optional numeric fields reject invalid values (`NaN`, `Infinity`, unsafe ranges).
- Dangerous flags (`purgeData`, `purgeObjects`, `removeAll`) warn clearly.

3. Error Semantics
- HTTP mapping remains stable:
  - 400 -> `RGWValidationError` (codes: InvalidArgument, InvalidBucketName, MalformedPolicy)
  - 403 -> `RGWAuthError` (codes: AccessDenied, InvalidAccessKeyId, SignatureDoesNotMatch)
  - 404 -> `RGWNotFoundError` (codes: NoSuchUser, NoSuchBucket, NoSuchKey, NoSuchSubUser)
  - 409 -> `RGWConflictError` (codes: UserAlreadyExists, BucketAlreadyExists, KeyExists, EmailExists)
  - 429 -> `RGWRateLimitError` (codes: TooManyRequests, SlowDown) — retryable
  - 5xx -> `RGWServiceError` (codes: InternalError, ServiceUnavailable) — retryable
- Error messages are actionable and include operation context.

4. Reliability Controls
- Timeout and retry settings are validated.
- Retries apply only to retryable failures.
- `Promise<void>` methods correctly handle empty-body responses.

5. Type Safety and Module Health
- `strict` mode passes without `any`.
- Types align with observed RGW payloads.
- Every module has happy-path + failure-path tests.
- `src/modules/*` coverage target stays >= 80% (prefer >= 95%).

6. Operational Readiness
- README examples compile against current exported API.
- Destructive operations are clearly documented.
- `CHANGELOG.md` reflects externally visible changes.

## Workflow
1. Run baseline gates: `npm run check` and `npm run test:coverage`.
2. Compare current API surface with previous release (types + method names).
3. Audit each module against this checklist.
4. Create a prioritized finding list (P0-P3).
5. Mark release `APPROVED` or `BLOCKED`.

## Report Template
```md
# Production Readiness Audit

## Scope
- Version:
- Commit:
- Date:

## Verdict
- APPROVED|BLOCKED

## Findings
1. [P1] ...
2. [P2] ...

## Risk Summary
- Reliability:
- Compatibility:
- Security:
- Docs:

## Required Actions Before Publish
1. ...
2. ...
```

## Definition of Done
- All checklist sections reviewed.
- Findings prioritized with clear remediation guidance.
- Publish verdict explicitly stated.
