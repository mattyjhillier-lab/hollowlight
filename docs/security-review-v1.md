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
- Debug-param save safety: now proved by tests/debug-saves.test.mjs (section 7).

## 5. Secrets
`git grep` for api key, secret, token, password, private key, ghp_, AKIA, sk- patterns over the repo working tree: no credentials. Matches are prose in CLAUDE.md/docs, `id-token: write` (a permission, not a token) and SVG namespace URLs. History scan done 2026-10-28, clean (section 7). Commit authors: Matt and dependabot[bot] only.

## 6. Fixes and decisions for Matt (nothing applied)
Recommended first.
1. Merge dev's dependency state to main at the release (already the plan), then re-check the Dependabot tab. (Recommended.)
2. If alerts #2-#4 remain: trial vite 7 or 8 on a dev-derived branch only (build, tests, bundle size, sw.js stamping, the in-repo inlineSingleFile plugin, which depends on Rollup hooks) before anything merges; never blind, never `--force`. Alternative: dismiss them as "dev-only, not reachable" with that note.
3. Workflow hardening, small PR on dev: move `pages: write` and `id-token: write` to the deploy job only; pin actions to commit SHAs with a version comment; pin Node to an explicit major; add `npm test` and `npm audit --audit-level=high` before the build; optional dependabot.yml for npm and github-actions.
4. Matt-only GitHub settings to confirm (Claude must not change): secret scanning, push protection, Dependabot alerts and security updates, branch protection on main, 2FA (LAUNCH-CHECKLIST E item 8).
5. Before outside testers: hosting decision (private repo plus Cloudflare, or stay public), LAUNCH-CHECKLIST row 23.
6. Later: verify debug params never bank; history secret scan; re-run this review on the final build.

## 7. Hardening results (wip/ci, 2026-10-28)
Sim and data untouched (byte-identical). Tests 1171 pass, build OK, npm audit 0.
1. **Workflows done.** deploy.yml: workflow-level `permissions: {}`; build job = contents: read + pages: read; deploy job = pages: write + id-token: write only. All 5 actions pinned to full SHAs (tag in comment), each looked up with `git ls-remote` on the official actions/* repo (none archived): checkout 11d5960 (v4), setup-node 49933ea (v4), configure-pages 983d773 (v5), upload-pages-artifact 56afc60 (v3), deploy-pages d6db901 (v4). Trigger unchanged (push to main, manual). New ci.yml: pull_request and push to dev, `npm ci`, `npm test`, `npm run build`, contents: read only, no secrets, no deploy, concurrency cancel, 20 min cap. Not verified on GitHub until pushed; the `pages: read` on build is a safe superset for configure-pages (if the first main deploy fails on a permission, add it back there). Not done: Node still floats on lts/* (matches today's build; pin to a major later if a new LTS ever breaks it); no dependabot.yml (Matt may want one for github-actions SHA bumps).
2. **History secret scan done.** 548 commits, all refs, no gitleaks/trufflehog installed (none added). Patterns over every added line (package-lock and SVG excluded in the first pass): GitHub tokens (ghp_, github_pat_, gho/ghu/ghs/ghr), AWS AKIA, sk- keys, Slack xox, private-key blocks, Google AIza, and key/secret/token/password/authorization assigned to a 16+ char value; plus filenames (.env, .pem, .key, id_rsa, credentials, secret). Result: zero real findings (5 false-positive hits in one SVG filter). No values printed. GitHub secret scanning and push protection remain the Matt-side backstop.
3. **Debug params cannot touch a save: proved.** tests/debug-saves.test.mjs (5 tests) runs the real isDebugRun against every run-changing param (auto, god, seed, t, rr, ban, grant, bless, meta, tier, debug, assist), checks bankRun, hints, codex, loadout, wardrobe, bond and keepsake paths are gated by it in app.js, asserts params.js has no storage access, and fails if a new URL param is added without being classified. One small bug found and fixed: `?auto=__proto__` passes the id charset and was truthy in `data.characters[...]`, so main.js would call startRun on an inherited key (a debug run, no save write, but a crash). Now `Object.hasOwn`. No sim change.
4. **Dependabot alerts: confirmed stale lockfile, nothing bumped.** Open alerts #1-#4 list first-patched esbuild 0.25.0, vite 6.4.2 / 6.4.3 / 6.4.3. main's lockfile has vite 5.4.21 and esbuild 0.21.5 (vulnerable); dev has vite 6.4.4 and esbuild 0.25.12, both past every first-patched version, npm audit 0. So they close when dev merges to main at launch; recheck the Dependabot tab then. This supersedes the section 2 caveat about 8.x versions for these four alerts. Do not merge the open dependabot/vite-8.3.4 branch.
