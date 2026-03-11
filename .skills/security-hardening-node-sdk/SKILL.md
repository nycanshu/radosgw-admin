# security-hardening-node-sdk

## Purpose
Harden this Node.js/TypeScript SDK for secure production usage, with emphasis on credential safety, transport security, and dependency hygiene.

## Scope
- Runtime security controls in `src/client.ts` and modules
- Logging/redaction behavior
- Dependency and supply-chain posture
- Publish-time security checks

## Security Baselines
1. Credential Handling
- Never log raw `accessKey` / `secretKey`.
- Avoid exposing sensitive headers in debug logs.
- Keep secrets out of exceptions where possible.

2. Transport Security
- Default TLS verification must remain enabled.
- `insecure` mode must be explicit, warned, and documented as non-production.
- No silent fallback from HTTPS to HTTP.

3. Input Hardening
- Validate all externally provided input fields before network calls.
- Enforce strict type and value bounds for numeric and boolean toggles.
- Reject malformed IDs and empty credential fields.

4. Error Hygiene
- Surface actionable messages without leaking sensitive payloads.
- Preserve typed errors for caller-side policy handling.

5. Dependency/Supply Chain
- Lockfile must be committed.
- Run dependency review before release.
- Minimize dependency surface; prefer zero-dep core paths when feasible.

## Recommended Checks
1. Static checks
- `npm run check`

2. Secret exposure checks
- Scan repo and logs for keys/tokens before release.

3. Runtime checks
- Verify debug logs do not include credentials.
- Verify insecure TLS warning appears when enabled.

4. Dependency checks
- Run vulnerability/audit workflow appropriate for org policy.
- Document accepted risks with expiration dates.

## Security Findings Template
```md
# Security Hardening Report

## Scope
- Version:
- Commit:
- Date:

## Findings
1. [P1] ...
2. [P2] ...

## Risk Classification
- Credential exposure:
- Transport security:
- Input validation:
- Dependency risk:

## Required Fixes
1. ...
2. ...

## Verdict
- APPROVED|BLOCKED
```

## Guardrails
- Never run destructive tests against production RGW.
- Never paste secrets into issues, PRs, or changelogs.
- Treat credential leakage as P0.

## Definition of Done
- No P0/P1 unresolved security findings.
- Security report included in release evidence.
