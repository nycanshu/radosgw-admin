# ceph-rgw-contract-testing

## Purpose
Establish production-grade contract testing for this npm package against the Ceph RADOS Gateway (RGW) Admin Ops API, so module behavior remains correct across Ceph versions and release cycles.

This skill is designed for `radosgw-admin` as a publishable SDK where API compatibility, error semantics, and response-shape stability are release blockers.

## Canonical References
- Ceph RGW Admin Ops API docs (latest): https://docs.ceph.com/en/latest/radosgw/adminops/
- User operations: https://docs.ceph.com/en/latest/radosgw/adminops/user/
- Bucket operations: https://docs.ceph.com/en/latest/radosgw/adminops/bucket/
- Usage operations: https://docs.ceph.com/en/latest/radosgw/adminops/usage/
- Quota operations: https://docs.ceph.com/en/latest/radosgw/adminops/user/#quota-management

Note: If behavior differs between docs and real RGW responses, prefer observed behavior from pinned Ceph versions and document the mismatch in the report.

## When To Use
- Adding or changing module methods in `src/modules/*.ts`
- Modifying query/body serialization in `src/client.ts`
- Changing types in `src/types/*.types.ts`
- Before release, publish, or major/minor version bumps

## Inputs Required
- RGW endpoint and admin credentials (dedicated test user recommended)
- Target Ceph versions to verify (minimum one stable version, ideally two)
- Environment mode:
  - `sandbox` (safe test cluster with disposable data)
  - `shared` (must use unique tenant/user prefixes and cleanup gates)

## Non-Negotiable Quality Gates
1. All unit tests pass: `npm test`
2. Type/lint/format gate passes: `npm run check`
3. Contract tests pass for each targeted Ceph version
4. Error mapping assertions pass:
   - 400 -> `RGWValidationError` (codes: InvalidArgument, InvalidBucketName, MalformedPolicy)
   - 403 -> `RGWAuthError` (codes: AccessDenied, InvalidAccessKeyId, SignatureDoesNotMatch)
   - 404 -> `RGWNotFoundError` (codes: NoSuchUser, NoSuchBucket, NoSuchKey, NoSuchSubUser)
   - 409 -> `RGWConflictError` (codes: UserAlreadyExists, BucketAlreadyExists, KeyExists, EmailExists)
   - 429 -> `RGWRateLimitError` (codes: TooManyRequests, SlowDown) — retryable
   - 5xx -> `RGWServiceError` (codes: InternalError, ServiceUnavailable) — retryable
5. No undocumented API-shape drift in public return types
6. Destructive operations require explicit opt-in and warning assertions

## Test Design Rules
- Use real HTTP requests against RGW for contract tests (do not mock transport).
- Generate unique resource ids per run (example: `ct-${timestamp}-${rand}`).
- Validate both:
  - request contract (query keys, required flags, operation semantics)
  - response contract (camelCase shape, type fields, optional field behavior)
- Include negative tests for auth, validation, not-found, and conflict paths.
- Keep tests idempotent and clean up created users/buckets/keys.

## Execution Workflow
1. Baseline checks
   - Run `npm run check`.
   - Fail fast on static/test regressions before hitting live RGW.

2. Build contract matrix
   - Select module scope under test (`users`, `keys`, `subusers`, `buckets`, `quota`, `rateLimit`, `usage`, `info`).
   - Select Ceph versions/environments.
   - Define expected outcomes and error classes per scenario.

3. Run module contract suite
   - Execute happy-path lifecycle tests first.
   - Execute failure-path tests next.
   - Capture request/response evidence (status, payload shape, error code/body).

4. Verify SDK invariants
   - Snake/kebab to camel transforms are correct for all returned keys.
   - Outgoing query params map correctly from client method fields.
   - Void operations (`Promise<void>`) do not leak JSON parse issues on empty responses.
   - Retry behavior only applies to retryable conditions.

5. Cleanup and rerun
   - Delete all created resources.
   - Rerun key destructive tests to verify warning and guard behavior remains intact.

6. Produce release report
   - Summarize pass/fail by module and Ceph version.
   - Highlight compatibility differences and required docs updates.
   - Block release if any contract mismatch is unresolved.

## Suggested Contract Coverage By Module
- `users`:
  - create/get/modify/delete/list/suspend/enable/getStats
  - tenant and caps behavior
  - purge-data destructive path
- `keys` and `subusers`:
  - key generation/revocation, swift vs s3 variants
  - subuser lifecycle and permission mutation
- `buckets`:
  - list/getInfo/delete/transferOwnership/removeOwnership/verifyIndex
  - purge-objects destructive path
- `quota` and `rateLimit`:
  - user/bucket/global scopes
  - enable/disable toggles without value loss
- `usage` and `info`:
  - usage retrieval filters and trim behavior
  - cluster info shape and stability

## Report Template
Use this exact structure in PR comments or release notes:

```md
# RGW Contract Test Report

## Scope
- Package version:
- Commit:
- Date:
- Ceph versions:
- Modules tested:

## Results
- Unit/static gate: PASS|FAIL
- Contract gate: PASS|FAIL
- Coverage summary (if collected):

## Module Matrix
- users: PASS|FAIL (notes)
- keys: PASS|FAIL (notes)
- subusers: PASS|FAIL (notes)
- buckets: PASS|FAIL (notes)
- quota: PASS|FAIL (notes)
- rateLimit: PASS|FAIL (notes)
- usage: PASS|FAIL (notes)
- info: PASS|FAIL (notes)

## Contract Mismatches
1. [severity] endpoint/method:
   - expected:
   - observed:
   - impact:
   - fix:

## Error Mapping Verification
- 400 -> RGWValidationError: PASS|FAIL
- 403 -> RGWAuthError: PASS|FAIL
- 404 -> RGWNotFoundError: PASS|FAIL
- 409 -> RGWConflictError: PASS|FAIL
- 429 -> RGWRateLimitError: PASS|FAIL
- 5xx -> RGWServiceError: PASS|FAIL

## Release Decision
- APPROVED|BLOCKED
- rationale:
```

## Guardrails
- Never run destructive tests on a production cluster.
- Never log raw secrets/access keys in artifacts.
- Always use explicit cleanup and finalizer steps, even after failure.
- Treat undocumented RGW behavior as compatibility risk and document it.

## Definition of Done
- Contract tests prove module behavior against real RGW for targeted versions.
- Observed responses align with exported TS types or gaps are explicitly tracked.
- Release report is published and includes a clear APPROVED/BLOCKED decision.
