# changelog

## Purpose
Generate a changelog entry from recent commits following the Keep a Changelog format.

## When To Use
- Before tagging a new release
- After merging a batch of PRs
- When preparing release notes

## Canonical References
- Format: [Keep a Changelog](https://keepachangelog.com/)
- Versioning: [Semantic Versioning](https://semver.org/)
- Existing file: `CHANGELOG.md`
- Commit convention: `<type>: <summary>` (feat, fix, refactor, test, docs, chore, ci)

## Steps

### 1. Read recent commits
```bash
git log <last-tag>..HEAD --oneline
```
If no tag exists, read all commits since the last CHANGELOG entry date.

### 2. Categorize commits

| Commit type | Changelog section |
|---|---|
| `feat:` | **Added** |
| `fix:` | **Fixed** |
| `refactor:` | **Changed** |
| `docs:` | **Changed** (only if user-facing) |
| `test:`, `ci:`, `chore:` | Skip (internal) |
| Breaking changes | **Changed** with `BREAKING:` prefix |
| Removed features | **Removed** |
| Deprecated features | **Deprecated** |

### 3. Generate entry
Format:
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Feature description ([#PR](url))

### Changed
- Change description

### Fixed
- Bug fix description

### Removed
- Removed feature description
```

Rules:
- Use past tense ("Added X" not "Add X")
- Lead with the user-facing impact, not the implementation detail
- Group related changes into single bullets
- Link to PRs/issues where applicable
- Skip purely internal changes (CI tweaks, test refactors)

### 4. Determine version bump
| Change type | Bump |
|---|---|
| Breaking change (pre-1.0) | Minor (0.x → 0.x+1) |
| Breaking change (post-1.0) | Major |
| New feature | Minor |
| Bug fix | Patch |
| Docs/internal only | Patch (or skip release) |

### 5. Update files
- Prepend new entry to `CHANGELOG.md` (below the header, above previous entries)
- Update `version` in `package.json` to match
- Update `package-lock.json`: `npm install --package-lock-only`

### 6. Verify
```bash
npm run check   # all checks pass with new version
```

## Output
- The new CHANGELOG.md entry
- Recommended version number with reasoning
- Updated package.json version
