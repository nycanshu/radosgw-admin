# Skills Index (`.skills`)

This folder contains shared, repo-local skills for both Codex and Claude Code.

## Available Skills

1. `ceph-rgw-contract-testing`
- Path: `.skills/ceph-rgw-contract-testing/SKILL.md`
- Use for: Real RGW Admin Ops contract validation across Ceph versions.
- Output: Contract report with module matrix and APPROVED/BLOCKED decision.

2. `production-readiness-audit-ts-sdk`
- Path: `.skills/production-readiness-audit-ts-sdk/SKILL.md`
- Use for: Full pre-release engineering audit (API, validation, errors, reliability, docs).
- Output: Prioritized findings (P0-P3) and publish verdict.

3. `release-quality-gates`
- Path: `.skills/release-quality-gates/SKILL.md`
- Use for: Enforcing hard release gates (build, check, tests, coverage, packaging, docs, security).
- Output: Gate-by-gate PASS/FAIL report and final release decision.

4. `security-hardening-node-sdk`
- Path: `.skills/security-hardening-node-sdk/SKILL.md`
- Use for: Credential/logging/TLS/dependency hardening before publish.
- Output: Security findings report with required fixes.

5. `docs-and-examples-verifier`
- Path: `.skills/docs-and-examples-verifier/SKILL.md`
- Use for: Ensuring README/examples match exported API and runtime behavior.
- Output: Docs mismatch report with severity and fixes.

## Recommended Order For A Release Candidate
1. `docs-and-examples-verifier`
2. `production-readiness-audit-ts-sdk`
3. `security-hardening-node-sdk`
4. `ceph-rgw-contract-testing`
5. `release-quality-gates`

## Fast Command Baseline
Run before or during these skills:

```bash
npm run build
npm run check
npm run test:coverage
```

## Notes
- Treat this package as production-grade and publishable.
- Use Ceph RGW Admin Ops docs as canonical API references:
  - https://docs.ceph.com/en/latest/radosgw/adminops/
- Never run destructive contract tests against production clusters.
