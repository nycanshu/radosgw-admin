# Documentation Website (TypeDoc + Docusaurus)

This guide sets up a production-grade docs site for `radosgw-admin` with:
- Handwritten guides (Docusaurus)
- Auto-generated API reference from source JSDoc (TypeDoc)
- Versioned documentation for releases

## Why This Stack
- **TypeDoc**: keeps API docs synced with TypeScript + JSDoc.
- **Docusaurus**: best for SDK docs, versioning, search, and clean navigation.

## Current Status
The docs toolchain is already wired in this repository:
- `typedoc.json` for API generation
- `website/` Docusaurus site scaffold
- root scripts: `docs:api`, `docs:sync-api`, `docs:dev`, `docs:build`, `docs:serve`
- GitHub Pages workflow: `.github/workflows/docs-pages.yml`

## Step 2: Add TypeDoc Config
Create `typedoc.json` at repo root:

```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "readme": "none",
  "hideBreadcrumbs": true,
  "excludePrivate": true,
  "excludeProtected": true,
  "categorizeByGroup": true
}
```

Generate API docs:
```bash
npx typedoc
```

## Site Structure
Implemented structure:
```text
website/
  docs/
    intro.md
    getting-started.md
    configuration.md
    error-handling.md
    recipes.md
    api/                # copy or sync from /docs/api output
```

## Scripts
Current root scripts:
```json
{
  "scripts": {
    "docs:api": "typedoc",
    "docs:sync-api": "mkdir -p website/docs/api && cp -R docs/api/. website/docs/api/",
    "docs:dev": "docusaurus start website",
    "docs:build": "npm run docs:api && npm run docs:sync-api && docusaurus build website",
    "docs:serve": "docusaurus serve website/build"
  }
}
```

## Local Workflow
1. Start local docs server:
```bash
npm run docs:dev
```
2. Production build check:
```bash
npm run docs:build
```

## Keep API Docs Synced
Workflow for any API change:
1. Update JSDoc in source (`src/modules/*.ts`, `src/index.ts`).
2. Run `npm run docs:build` (this regenerates API docs + syncs them).
3. Verify output in `website/docs/api`.

## Versioned Docs
For each release (example `v0.2.0`):
```bash
cd website
npx docusaurus docs:version v0.2.0
```

## Publish to GitHub Pages
1. In GitHub repo settings:
- Enable Pages and set source to **GitHub Actions**.
2. Push to `main` (or run workflow manually).
3. Workflow `.github/workflows/docs-pages.yml` will:
- build docs with `npm run docs:build`
- upload `website/build`
- deploy to GitHub Pages

Default URL format:
- `https://<org>.github.io/<repo>/`

## Custom Domain
1. Add DNS record:
- `CNAME` from your docs host (for example `docs.example.com`) to `<org>.github.io`
2. Add GitHub Actions secret:
- `DOCS_DOMAIN=docs.example.com`
3. Workflow writes `website/static/CNAME` automatically and deploys.
4. Enable HTTPS in GitHub Pages settings after DNS propagates.

## Documentation Quality Rules
1. Every public method must have complete JSDoc.
2. Every module should include:
- What it does
- Required inputs
- Common errors
- Destructive flags and warnings
- Example snippets
3. Add a Ceph compatibility section (supported/tested versions).
4. Keep all examples aligned with current exported API.

## Suggested Site Navigation
1. Introduction
2. Quick Start
3. Configuration
4. Modules
5. Error Handling
6. Recipes
7. API Reference (auto-generated)
8. Version Compatibility

## Canonical API Reference
- Ceph RGW Admin Ops docs: https://docs.ceph.com/en/latest/radosgw/adminops/
