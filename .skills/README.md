# Skills Index (`.skills`)

This folder contains shared, repo-local skills for both Codex and Claude Code.

## Available Skills

### Development Skills (for contributors)

1. **`add-module`** — Scaffold a complete new module (types, module, tests, example, docs, wiring)
   - Path: `.skills/add-module/SKILL.md`
   - Use when: Adding a new API domain (e.g., roles, zones, lifecycle)

2. **`add-method`** — Add a new method to an existing module with all required artifacts
   - Path: `.skills/add-method/SKILL.md`
   - Use when: Implementing a new endpoint in an existing module

3. **`test-module`** — Generate, improve, or audit tests for a specific module
   - Path: `.skills/test-module/SKILL.md`
   - Use when: Tests are missing, incomplete, or need improvement

4. **`review-pr`** — Structured code review against project conventions
   - Path: `.skills/review-pr/SKILL.md`
   - Use when: Reviewing a contributor's PR or self-reviewing before merge

### Quality & Documentation Skills

5. **`jsdoc-audit`** — Audit JSDoc completeness on all public methods
   - Path: `.skills/jsdoc-audit/SKILL.md`
   - Use when: Before release or after adding/renaming methods

6. **`docs-and-examples-verifier`** — Ensure README/examples match exported API
   - Path: `.skills/docs-and-examples-verifier/SKILL.md`
   - Use when: Before release or after method rename/signature changes

7. **`clean-code-ts-sdk`** — Enforce clean coding standards for SDK changes
   - Path: `.skills/clean-code-ts-sdk/SKILL.md`
   - Use when: Per-PR and before final release merge

### Release Skills

8. **`changelog`** — Generate changelog entry from recent commits
   - Path: `.skills/changelog/SKILL.md`
   - Use when: Before tagging a new release

9. **`release-prep`** — Full pre-publish preparation (quality gates + changelog + packaging)
   - Path: `.skills/release-prep/SKILL.md`
   - Use when: Ready to publish a new version to npm

10. **`release-quality-gates`** — Hard release gates with PASS/FAIL verdicts
    - Path: `.skills/release-quality-gates/SKILL.md`
    - Use when: Final validation before `npm publish`

### Security & Audit Skills

11. **`production-readiness-audit-ts-sdk`** — Full pre-release engineering audit
    - Path: `.skills/production-readiness-audit-ts-sdk/SKILL.md`
    - Use when: Before npm publish or after significant changes

12. **`security-hardening-node-sdk`** — Credential/TLS/dependency hardening
    - Path: `.skills/security-hardening-node-sdk/SKILL.md`
    - Use when: Pre-release security validation

13. **`ceph-rgw-contract-testing`** — Real RGW Admin Ops contract validation
    - Path: `.skills/ceph-rgw-contract-testing/SKILL.md`
    - Use when: After changing module methods or serialization

## Recommended Workflows

### Adding a Feature
1. `add-module` or `add-method` → scaffold the code
2. `test-module` → ensure tests are comprehensive
3. `jsdoc-audit` → verify documentation
4. `review-pr` → self-review before merge

### Preparing a Release
1. `docs-and-examples-verifier` → docs match code
2. `production-readiness-audit-ts-sdk` → engineering audit
3. `security-hardening-node-sdk` → security check
4. `changelog` → generate changelog entry
5. `release-prep` → full pre-publish checklist
6. `release-quality-gates` → final PASS/FAIL gate

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

## Project Boundary Rule
**`src/` is the npm package only.** Never add frontend code, UI components, React pages,
documentation tooling, or any non-SDK logic to `src/` or the root `package.json` devDependencies.

- SDK code lives in: `src/`, `tests/`, root `package.json`
- Documentation lives in: `website/` (its own `package.json` and `node_modules`)
- Examples live in: `examples/` (plain TypeScript, no framework deps)

Any frontend/website/docs tooling (Docusaurus, React, Mintlify, TypeDoc) belongs in `website/`
or a separate repository — never in root devDependencies.
This keeps `npm install` in the root lean and avoids publishing non-SDK artifacts.
