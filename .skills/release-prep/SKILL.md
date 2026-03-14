# release-prep

## Purpose
Prepare the project for an npm release. Runs all quality gates, generates changelog, verifies packaging, and outputs a release checklist.

## When To Use
- Before tagging and publishing a new version to npm
- Before creating a GitHub release

## Steps

### 1. Run full quality check
```bash
npm run check   # typecheck + lint + format:check + test
```
All must pass. If any fail, stop and fix before continuing.

### 2. Run coverage check
```bash
npm run test:coverage
```
Verify coverage meets thresholds (90% lines/functions/statements, 80% branches).

### 3. Build and validate
```bash
npm run build
```
Verify `dist/` contains:
- `index.js` (ESM)
- `index.cjs` (CJS)
- `index.d.ts` (types)
- `index.d.cts` (CJS types)

### 4. Check package contents
```bash
npm pack --dry-run
```
Verify only `dist/`, `README.md`, and `LICENSE` are included. Flag any unexpected files.

### 5. Verify exports
Ensure `package.json` exports are correct:
- `import { RadosGWAdminClient } from 'radosgw-admin'` — works (ESM)
- `const { RadosGWAdminClient } = require('radosgw-admin')` — works (CJS)
- TypeScript types resolve correctly

### 6. Generate changelog
Follow the `/changelog` skill to create an entry for the new version.

### 7. Check for TODOs/FIXMEs
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" src/
```
Flag any unresolved items. P0/P1 items must be resolved before release.

### 8. Verify README accuracy
- API reference table matches actual exports
- Examples use current method names and signatures
- Version/compatibility info is current

### 9. Version bump
- Update `version` in `package.json`
- Run `npm install --package-lock-only` to sync lock file
- Follow semver: patch for fixes, minor for features, major for breaking changes

### 10. Final checklist

```markdown
## Release Checklist — vX.Y.Z

- [ ] `npm run check` passes
- [ ] Coverage thresholds met
- [ ] `npm run build` produces clean dist/
- [ ] `npm pack --dry-run` shows only expected files
- [ ] CHANGELOG.md updated
- [ ] package.json version bumped
- [ ] package-lock.json synced
- [ ] No P0/P1 TODOs in src/
- [ ] README.md accurate
- [ ] Git working tree clean
- [ ] Ready to tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
```

## Output
The completed release checklist with pass/fail for each item and the recommended git tag command.
