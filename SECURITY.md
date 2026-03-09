# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest 0.x | Yes — active development |
| Older 0.x | Security fixes only |

## Reporting a Vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

### Process

1. Email **hkg43700@gmail.com** with:
   - Description of the vulnerability
   - Steps to reproduce or proof of concept
   - Impact assessment (what can an attacker do?)
   - Suggested fix, if you have one
2. You will receive acknowledgment within **48 hours**
3. We will coordinate a timeline for the fix and disclosure
4. You will be credited in the release notes (unless you prefer anonymity)

### What Qualifies

This package handles sensitive operations. In-scope vulnerabilities include:

| Area | Examples |
|---|---|
| **Credential exposure** | Secret keys leaked in logs, error messages, or stack traces |
| **Request signing** | SigV4 implementation flaws that could allow request forgery or replay |
| **Input injection** | Query parameter injection, header injection via user-supplied values |
| **Dependency chain** | Vulnerabilities in transitive dependencies (currently none — zero runtime deps) |

### Out of Scope

- Misconfigured Ceph/RGW instances
- Denial of service against the RGW endpoint itself
- Issues requiring physical access to the server
- Social engineering

## Security Design

This package follows these principles:

- **Zero runtime dependencies** — minimizes supply chain attack surface
- **No credential logging** — access keys and secret keys are never included in error messages or debug output
- **Input validation** — all user-supplied parameters are validated before reaching the HTTP layer
- **No eval/dynamic code** — no use of `eval()`, `Function()`, or dynamic `import()`
