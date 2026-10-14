# Hosting and saves (checked 2026-10-14)

## 1. GitHub Pages (recommended)
Limits (https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits):
- Published site max 1 GB; repo recommended 1 GB. Bandwidth soft limit 100 GB/month (429 if rate limited).
- Build soft limit 10/hour, but NOT applied to custom Actions workflow deploys. Deploy timeout 10 min.
- Prohibited: sites primarily for commercial transactions / SaaS, handling passwords or card numbers. A free hobby game is fine. Selling the game via the site would not be.
- Private repo + Pages: NOT on GitHub Free (https://docs.github.com/en/get-started/learning-about-github/githubs-plans). Free = public repos only. Private-repo publishing needs Enterprise Cloud org. So: make the repo public (source and assets become visible; don't commit secrets).
- Actions: Free plan 2,000 min/month, 500 MB artifacts; standard runners are free for public repos (https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions). A deploy takes ~1 min.
- Vite guide: https://vite.dev/guide/static-deploy.html
  - Project site URL is https://USER.github.io/REPO/ so set `base: '/REPO/'` in vite.config.js (or `base: './'` which is safest for beginners). A repo named USER.github.io uses '/'.
  - Settings > Pages > Source = "GitHub Actions".
  - If using vite-plugin-singlefile, output is dist/index.html; the same workflow works.

Workflow `.github/workflows/deploy.yml` (action versions are from memory of current majors; if a run warns about versions, bump to the latest shown at https://github.com/actions/deploy-pages):
```yaml
name: Deploy to Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
Requires package-lock.json committed (for npm ci).

## 2. Alternatives
| Host | Free limits | Gotchas |
|---|---|---|
| Cloudflare Pages (https://developers.cloudflare.com/pages/platform/limits/) | 20,000 files, 25 MiB/file, 500 builds/month, 20 min build; no bandwidth cap listed | Free `*.pages.dev` subdomain; needs Cloudflare account. Good fallback, works with private GitHub repos. |
| Netlify (https://www.netlify.com/pricing/) | Credit-based free plan (300 credits; bandwidth 20 credits/GB, deploys 15 credits each) | Credit model; I could not confirm from the page what happens at exhaustion (commonly sites pause). Most fiddly of the three. |
| itch.io HTML5 (https://itch.io/docs/creators/html5) | zip with index.html; <=1,000 files, <=500 MB extracted, <=200 MB/file | Runs in an iframe on itch.io's CDN origin; use relative paths (`base:'./'`), case-sensitive names. Good for discovery; saves are tied to itch's game-host origin, and re-uploads may change that origin, so test. Docs don't cover localStorage in the iframe. |

Recommendation: GitHub Pages as home; optionally also itch.io for audience (keep saves export/import to move between them).

## 3. Saving progress
- localStorage: ~5 MiB/origin (MDN says 5-10, browser dependent), synchronous, strings only. Throws QuotaExceededError; wrap in try/catch. Private mode may be limited or wiped on close. Safari deletes script-created storage after 7 days of no user interaction when tracking prevention applies; best-effort data can also be evicted under disk pressure (https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- Mitigate: call `navigator.storage.persist()` (Firefox prompts; Chrome/Safari decide silently), and provide export/import.
- IndexedDB: much larger quota (Chromium up to 60% of disk), async, same eviction rules. Overkill for a small game's save; localStorage is fine for < 1 MB JSON. Use IndexedDB only if saves get big.
- Origin = scheme+host+port. Changing URL (USER.github.io to custom domain, pages.dev, itch.io) strands existing saves. Note: all `USER.github.io/*` project sites share one origin, so use a unique key prefix (e.g. `spiritgame:save`). Decide the final URL before release; a custom domain costs money (not free), so stay on github.io.
- Versioned save pattern:
```js
const KEY='spiritgame:save', VERSION=3;
const migrations={1:s=>({...s,v:2,newField:0}),2:s=>({...s,v:3,inv:s.inv??[]})};
function load(){ try{ let s=JSON.parse(localStorage.getItem(KEY)); if(!s) return null;
  while(s.v<VERSION) s=migrations[s.v](s); return s; }catch{ return null; } }
function save(s){ try{ s.v=VERSION; localStorage.setItem(KEY,JSON.stringify(s)); return true;}catch{return false;} }
```
Keep a backup copy (write to KEY+':bak' before overwrite); never crash on corrupt JSON.
- Export/import: Blob download of JSON (`<a download>` + URL.createObjectURL) and `<input type=file>` + FileReader, run through migrations and validate. Optionally base64-encode. This is the only truly reliable cross-device/URL-change path.
- Cloud save options: (a) none + export/import (recommended, zero cost/risk); (b) Firebase Spark: no card needed, Firestore 1 GiB, 20K writes/day, 50K reads/day (https://firebase.google.com/pricing); needs anonymous auth and security rules, public API key in client; (c) Supabase free: 500 MB DB, 50K MAU, but projects pause after 1 week inactivity, 2 active projects, no backups (https://supabase.com/pricing). Both add privacy/GDPR duties (UK) and rule/abuse risk; not worth it for a solo game.
- Recommendation: localStorage + versioned/migrating JSON + backup slot + persist() + export/import button + autosave on key events; prefix keys; no cloud.

## 4. Windows beginner setup
1. Install Node LTS from https://nodejs.org (accept defaults). Install Git from https://git-scm.com/download/win (defaults). Reopen PowerShell; verify `node -v`, `git --version`.
2. In project folder: `git config --global user.name "Matt"` and `git config --global user.email "you@example.com"` (GitHub noreply email in Settings > Emails is better for privacy).
3. Create `.gitignore` containing `node_modules` and `dist`. Ensure `npm install` has created package-lock.json.
4. `git init -b main`, `git add .`, `git commit -m "Initial commit"`.
5. On github.com: New repository, name e.g. `spirit-game`, Public, do NOT add README/.gitignore.
6. `git remote add origin https://github.com/USER/spirit-game.git` then `git push -u origin main` (browser sign-in window appears via Git Credential Manager).
7. Set `base` in vite.config.js (`'/spirit-game/'` or `'./'`), add the workflow file above at `.github/workflows/deploy.yml`, commit and push.
8. Repo > Settings > Pages > Build and deployment > Source: GitHub Actions. (Re-run the workflow from the Actions tab if the first run happened before this.)
9. Watch Actions tab; site appears at https://USER.github.io/spirit-game/. Every later `git push` redeploys.
10. Test: hard refresh, open in a private window, confirm saves persist after reload and export/import works.
