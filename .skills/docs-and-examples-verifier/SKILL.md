# docs-and-examples-verifier

## Purpose
Ensure README/docs/examples always match the actual exported API and runtime behavior of this publishable npm package.

## Canonical Sources
- Public exports: `src/index.ts`
- Runtime behavior: `src/client.ts`, `src/modules/*.ts`
- Types: `src/types/*.types.ts`
- Docs/examples: `README.md`, `examples/*`

## When To Use
- Before release
- After method rename/signature change
- After adding/removing module features

## Verification Checklist
1. API Name Consistency
- Every documented method exists on `RadosGWAdminClient`.
- Method names follow project conventions and match code exactly.

2. Signature Consistency
- Input field names in docs match TypeScript interfaces.
- Return types in docs reflect real SDK output shape.

3. Example Correctness
- Example snippets use valid config and method calls.
- Destructive examples explicitly call out risk.
- Quota/rate-limit examples reflect supported options.

4. Error Handling Documentation
- Typed error classes documented accurately.
- Error mapping table reflects implemented behavior.

5. Production Clarity
- Node version requirements are explicit.
- Security notes (TLS/insecure mode) are clear.
- Any Ceph compatibility caveats are documented.

## Workflow
1. Run `npm run check`.
2. Diff documented methods vs exports from `src/index.ts`.
3. Diff documented inputs vs type definitions in `src/types`.
4. Run or type-check examples where possible.
5. Record mismatches and required edits.

## Mismatch Severity
- P1: Docs can cause wrong production usage or breaking integration.
- P2: Incorrect/incomplete examples but low-risk.
- P3: Wording/clarity improvements.

## Report Template
```md
# Docs & Examples Verification

## Scope
- Version:
- Commit:
- Date:

## Status
- PASS|FAIL

## Mismatches
1. [P1] file:
   - documented:
   - actual:
   - fix:

## Verified Areas
- API reference:
- Config section:
- Error handling:
- Examples:
```

## Definition of Done
- No unresolved P1 mismatches.
- README and examples are aligned with current code and types.
