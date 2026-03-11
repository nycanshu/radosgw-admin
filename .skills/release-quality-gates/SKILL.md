# release-quality-gates

## Purpose
Define and enforce hard release gates so only production-ready artifacts are published to npm.

## Release Gates
1. Build Gate
- `npm run build` succeeds.
- ESM + CJS outputs and type declarations are generated.

2. Static Quality Gate
- `npm run typecheck` succeeds.
- `npm run lint` succeeds.
- `npm run format:check` succeeds.

3. Test Gate
- `npm test` succeeds with zero flaky tests.
- `npm run test:coverage` meets thresholds.
- `src/modules/*` line coverage >= 80% minimum; target >= 95%.

4. Contract Gate
- Contract tests pass against at least one pinned RGW version.
- Any known Ceph version deltas are documented in release notes.

5. Packaging Gate
- `npm pack --dry-run` contains only intended artifacts.
- `exports`, `main`, `module`, and `types` resolve correctly.

6. Documentation Gate
- `README.md` examples align with current API signatures.
- `CHANGELOG.md` contains release notes with upgrade impact.

7. Security Gate
- No secrets in repo or logs.
- Dependency risk review completed.

## Workflow
1. Run full preflight in order:
   - `npm run build`
   - `npm run check`
   - `npm run test:coverage`
2. Run packaging checks:
   - `npm pack --dry-run`
3. Run contract suite from `ceph-rgw-contract-testing`.
4. Validate docs/changelog.
5. Approve or block release.

## Semver Rules
- Patch: bug fixes, no public API breaks.
- Minor: additive API changes only.
- Major: any breaking runtime/type change.

## Publish Blockers
- Any failing gate.
- Any undocumented breaking change.
- Any unresolved P0/P1 finding from audits.

## Report Template
```md
# Release Quality Gates Report

## Candidate
- Version:
- Commit:
- Date:

## Gate Results
- Build: PASS|FAIL
- Static Quality: PASS|FAIL
- Tests: PASS|FAIL
- Contract: PASS|FAIL
- Packaging: PASS|FAIL
- Docs: PASS|FAIL
- Security: PASS|FAIL

## Verdict
- APPROVED|BLOCKED

## Notes
- ...
```

## Definition of Done
- Every gate has explicit PASS/FAIL.
- Blockers are listed with owners and fix paths.
- Final release verdict is unambiguous.
