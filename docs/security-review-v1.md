# Security review v1 (2026-10-28)

Scope: origin/dev b2e78ce. Read-only checks; no src, scripts, tests or package files touched. Reviewer: Claude (overnight agent), not independent. The save-v3 review (docs/design/save-v3-review.md) still covers migration in depth.

## Verdict
No secrets found, no unsafe DOM sinks, URL and save inputs are validated. Dependabot's 4 open alerts are all dev-server issues in Vite/esbuild and are not reachable in the shipped game. Fixes are small (section 6).

## 1. npm audit (report only)
- dev lockfile: `npm audit` = found 0 vulnerabilities (phaser 3.90.0, vite 6.4.4, esbuild 0.25.12, rollup 4.64.7).
- main lockfile (old: vite ^5.4 + vite-plugin-singlefile): `npm audit --package-lock-only` = 2 vulnerabilities (1 high: vite <=6.4.3; 1 moderate: esbuild <=0.24.2). GitHub scans this one because main has not received dev's package changes (Release Gate).
- Nothing was installed or fixed. `npm audit fix` was not run.

## 2. The 4 open Dependabot alerts (all on main's lockfile)
| # | Package | Advisory | Severity | Scope | In the shipped build? |
|---|---|---|---|---|---|
| 1 | esbuild (transitive) | GHSA-67mh-4wv8-2f99: any website can send requests to the dev server and read the response | medium | development | No. Only the dev server is exposed. |
| 2 | vite (direct) | GHSA-4w7w-66w2-5vf9: path traversal in optimized-deps `.map` handling | medium | development | No. Dev server only. |
| 3 | vite (direct) | GHSA-fx2h-pf6j-xcff: `server.fs.deny` bypass on Windows alternate paths | medium | development | No. Dev server only. Matters on Matt's Windows PC while `npm run dev` runs. |
| 4 | vite (direct) | GHSA-v6wh-96g9-6wx3: launch-editor NTLMv2 hash disclosure via UNC path (Windows) | medium | development | No. Dev server only, same Windows caveat. |

Alert #5 (braces GHSA-vfj7-8cjw-p6xm) was withdrawn upstream and auto-dismissed; dev has already dropped vite-plugin-singlefile, micromatch and braces.

Reachability: the shipped file is dist/index.html (Phaser plus our code inlined) plus public/ files. No Vite or esbuild code is in it, so there is no runtime exposure. Exposure exists only while the dev server runs on Matt's PC: keep it on localhost and avoid browsing untrusted sites meanwhile.

Why dev audits clean but main alerts stay open: alerts track main's lockfile and should close when dev merges. Caveat: GitHub lists first-patched versions on the 8.x line (vite 8.0.5, 8.0.16, launch-editor 2.14.1) while npm's audit calls 6.4.4 clean. Some alerts may stay open after the merge; check the Dependabot tab then.

## 3. Workflows (.github/workflows/deploy.yml, the only one)
- Triggers: push to main, workflow_dispatch. No pull_request_target, no secrets used, only first-party actions/* actions.
- Permissions: contents: read, pages: write, id-token: write set at workflow level, so the build job also gets write scopes it does not need.
- Actions pinned to major tags (@v4, @v5, @v3), not commit SHAs. `node-version: lts/*` floats.
- No test or audit step in CI.
- No .github/dependabot.yml (alerts and security updates come from repo settings).

## 4. Source greps (src/)
- innerHTML, outerHTML, insertAdjacentHTML, document.write, eval, new Function: zero uses (only comments stating the rule). UI is createElement/textContent; SVG strings in src/gfx are built from static data and turned into textures, not injected into the page. Tests also forbid innerHTML (LAUNCH-CHECKLIST).
- URL params (src/params.js): strict whitelist; ints clamped; ids match `^[a-z0-9_]{1,32}$`; spec strings capped at 300 chars and charset-limited; tier from a fixed list; documented as never saved. Other readers: entry.js, gfx/style.js (a/b only), RunScene `mem=1` (boolean only).
- Save import (src/save/schema.js parseSave): type check, 200 KB cap, JSON.parse in try/catch, object and version checks, future-version refusal, migrations in try/catch, then sanitize() with clamped numerics (MAX_NUM 1e12). Lantern import (src/save/lanterns.js) also parses in try/catch.
- No network calls in src (no fetch, XHR, WebSocket, beacon). Only public/sw.js calls fetch, for same-origin caching. Fonts are self-hosted.
- Math.random is used only for audio variation and the run seed; nothing security-related.
- Not verified here (TODO later step): that `?grant`, `?bless` and `?god` runs can never write to a real save (comments say banking is disabled).

## 5. Secrets
`git grep` for api key, secret, token, password, private key, ghp_, AKIA, sk- patterns over the repo working tree: no credentials. Matches are prose in CLAUDE.md/docs, `id-token: write` (a permission, not a token) and SVG namespace URLs. Git history was not scanned (TODO: history scan, e.g. gitleaks, only with Matt's OK to add a tool; or rely on GitHub secret scanning once Matt confirms it is on). Commit authors: Matt and dependabot[bot] only.

## 6. Fixes and decisions for Matt (nothing applied)
Recommended first.
1. Merge dev's dependency state to main at the release (already the plan), then re-check the Dependabot tab. (Recommended.)
2. If alerts #2-#4 remain: trial vite 7 or 8 on a dev-derived branch only (build, tests, bundle size, sw.js stamping, the in-repo inlineSingleFile plugin, which depends on Rollup hooks) before anything merges; never blind, never `--force`. Alternative: dismiss them as "dev-only, not reachable" with that note.
3. Workflow hardening, small PR on dev: move `pages: write` and `id-token: write` to the deploy job only; pin actions to commit SHAs with a version comment; pin Node to an explicit major; add `npm test` and `npm audit --audit-level=high` before the build; optional dependabot.yml for npm and github-actions.
4. Matt-only GitHub settings to confirm (Claude must not change): secret scanning, push protection, Dependabot alerts and security updates, branch protection on main, 2FA (LAUNCH-CHECKLIST E item 8).
5. Before outside testers: hosting decision (private repo plus Cloudflare, or stay public), LAUNCH-CHECKLIST row 23.
6. Later: verify debug params never bank; history secret scan; re-run this review on the final build.
