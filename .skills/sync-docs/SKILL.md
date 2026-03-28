# sync-docs

## Purpose
Ensure every module change is correctly reflected across all 5 documentation surfaces,
AND that the resulting documentation is clear, simple, and useful to a real developer
reading it for the first time.

Completeness without clarity is not enough. A guide that lists a method but doesn't
explain *when to use it* or *what to watch out for* is still a gap.

## When To Use
- After adding a new method to any module in `src/modules/`
- After changing a method signature (params, return type, error behaviour)
- After renaming or removing a method
- After adding a new module
- As part of pre-release checklist (before running `release-quality-gates`)

## Canonical Sources
- Module source: `src/modules/<module>.ts`
- Types: `src/types/*.types.ts`

---

## The 5 Documentation Surfaces

Every change to a public method must be reflected in **all** of the following:

| # | File | What to check |
|---|---|---|
| 1 | `website/docs/guides/<module>.md` | Method has a section — accurate, clear, and self-contained |
| 2 | `website/docs/modules.md` | Method name listed in the module's operation list |
| 3 | `website/docs/intro.md` | Method appears in the `What's covered` table |
| 4 | `README.md` | Method listed under its module in the API Reference section |
| 5 | `website/docs/changelog.md` | Entry added under current version |

---

## Verification Steps

### 1. Read the module source
```
src/modules/<module>.ts
```
List every public `async` method with its signature, return type, and `@throws` tags.

### 2. Audit Surface 1 — Guide clarity and correctness

For each method section in `website/docs/guides/<module>.md`, check **both** accuracy and clarity:

#### Accuracy (hard requirements — P1 bugs if wrong)
- Call signature in the example matches source **exactly**
  (e.g. positional `getStats(uid, sync)` vs object `getStats({ uid, sync })` — a developer will copy this and get a runtime error)
- Return type behaviour documented correctly
  (if the method returns the entire collection, not just the new item → must have `:::info` block)
- `@throws` from JSDoc reflected in the Error Handling section

#### Clarity (soft requirements — P2 if missing)
- **"When to use" context** — does the section explain the real-world scenario where you'd call this? Not just "creates a user" but "use this for tenant onboarding or programmatic provisioning"
- **Plain language first** — the first sentence of each section describes what the method does in plain English, before any code
- **Parameter intent visible in example** — if a parameter has a non-obvious effect, the example demonstrates it (e.g. `sync: true` forces recalculation — this should be shown)
- **Destructive operations** — show both the safe form AND the force form with a `:::warning` block explaining permanent consequences
- **Non-obvious defaults** — if a parameter defaults to a surprising value (e.g. `purgeKeys` defaults to true), document this explicitly
- **Production notes** — at least one note that tells a developer what to watch out for in real usage (not just "this deletes data" — *why* that matters operationally)
- **Error handling section** — covers the errors that would actually affect a developer (not every possible error, but the ones developers hit in practice)

#### Readability check
Ask: *if a developer reads only this guide section, can they call this method correctly and safely on their first try?*
- If no → find what's missing and add it
- If yes → ✅

### 3. Audit Surfaces 2–4 — Completeness

**modules.md** (`website/docs/modules.md`):
- Method name in the list matches source exactly (no abbreviations, no aliases)

**intro.md** (`website/docs/intro.md`):
- Method appears in the `What's covered` table for the correct module row
- No vague shorthand like `enable/disable` — use full method names

**README.md**:
- Method listed under the correct module heading with a one-line inline comment
- Comment describes what the method does (not just its name)

### 4. Audit Surface 5 — Changelog

**changelog.md** (`website/docs/changelog.md`):
- New method → `### New Features` bullet
- Changed signature → `### Improvements` or `### Breaking Changes`
- Removed method → `### Breaking Changes`
- Changelog entry is written for the *user*, not the *author* — describes impact, not implementation

### 5. Check method count stat

If methods were added or removed, update the `40+` stat in:
- `website/src/pages/index.js` — stat pill, Schema.org description, OG meta description
- `website/docs/intro.md` — feature table

Actual count = sum of all `async` methods in `src/modules/*.ts` + `healthCheck()` on the client.

### 6. Report findings

```
## sync-docs report — <module>

### Accuracy Issues (P1 — fix before release)
- guides/<module>.md: ...

### Clarity Issues (P2 — fix before release)
- guides/<module>.md: ...

### Surface Completeness
| Surface       | Status    | Issue |
|---------------|-----------|-------|
| guides/<module>.md | ✅ / ❌ | ... |
| modules.md         | ✅ / ❌ | ... |
| intro.md           | ✅ / ❌ | ... |
| README.md          | ✅ / ❌ | ... |
| changelog.md       | ✅ / ❌ | ... |
```

### 7. Apply all fixes

Apply every P1 and P2 fix found. Do not skip changelog.

---

## Hard Rules

- **Signatures must be exact.** Wrong argument shape is a P1 runtime bug.
- **Entire-collection returns must be documented.** `subusers.create()`, `subusers.modify()`, `keys.generate()` all return the full list. Use `:::info` block.
- **Every destructive op needs `:::warning`.** `purgeData`, `purgeObjects`, `purgeKeys`, `removeAll`.
- **healthCheck() is root-level.** Document in `getting-started.md` only, not in module guides.
- **Do not document private or internal methods.**
- **Changelog is mandatory.** No method change ships without an entry.
- **No vague shorthand in tables.** Write `enableUserQuota`, not `enable/disable`.

---

## Guide Section Quality Checklist (per method)

Use this when writing or reviewing a guide section:

- [ ] Opening sentence explains what the method does in plain English
- [ ] Code example is a real, copy-pasteable snippet — not pseudocode
- [ ] Example uses realistic values (not `'foo'`, `'test'`, `123`)
- [ ] "When to use" context is given (at least one sentence)
- [ ] Non-obvious parameter behaviour is shown in the example
- [ ] Destructive form shown with `:::warning` if applicable
- [ ] Entire-collection return documented with `:::info` if applicable
- [ ] Error handling covers the errors developers actually hit
- [ ] Production note gives at least one real operational consideration

---

## Changelog Entry Format

```markdown
### New Features
- **rateLimit.disableUserLimit(uid)** — disable a user rate limit without losing configured values; use this for temporary policy suspension

### Improvements
- **users.getStats(uid, sync?)** — new optional `sync` param forces recalculation from the backing store; useful for billing pipelines that need accurate counts

### Breaking Changes
- **buckets.get()** renamed to **buckets.getInfo()** — more descriptive name aligned with SDK conventions; update all call sites
```

---

## Definition of Done

- All 5 surfaces updated, no missing methods, no stale signatures
- Every guide section passes the quality checklist above
- A developer reading only the guide can call the method correctly and safely on the first try
- Changelog entry present and written for the user, not the author
- Method count stat accurate if methods were added/removed
