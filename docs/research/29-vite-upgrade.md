# 29 - Vite upgrade / clearing the 5 npm audit findings

Date 2026-10-15. Branch `vite-upgrade` (off `dev`), not merged. Node v24.19.0. Dependabot PRs #4 and #5 are untouched (both only edit package.json + lockfile).

## What the 5 findings are (OFFICIAL: GitHub advisories, npm registry)
| Finding | Pulled in by | Fixed in | Notes |
|---|---|---|---|
| esbuild <=0.24.2 (GHSA-67mh-4wv8-2f99, moderate) | vite 5.4.21 (esbuild 0.21.5) | esbuild 0.25.0 | dev-server issue: any website can read dev-server responses |
| vite <=6.4.2 (high): `server.fs.deny` bypass on Windows (GHSA-fx2h-pf6j-xcff), launch-editor NTLM hash leak (GHSA-v6wh-96g9-6wx3) | direct dep | vite 6.4.3 (6.4.4 current 6.x) | dev server only |
| braces <=3.0.3 (GHSA-vfj7-8cjw-p6xm, high; counted 3x with micromatch + vite-plugin-singlefile) | vite-plugin-singlefile (any version >=0.10) -> micromatch 4.0.8 -> braces 3.0.3 | NO FIXED RELEASE: 3.0.3 is the latest braces; advisory says "through 3.0.3" | build-time only; our config passes fixed strings, but audit stays red |

All five are dev/build-toolchain only. None ships in dist/index.html (phaser is the only runtime dep).

## Paths tried (baseline: vite 5.4.21 + singlefile 2.0.2, 187 tests pass, build 21 s, dist/index.html 1,731,350 B, `npm ls --all` 80 lines)
| Path | Versions (exact pins) | npm audit | Tests | Build (time, size) | PWA check | HUD screenshots | Problems |
|---|---|---|---|---|---|---|---|
| (a) override esbuild only | vite 5.4.21 + overrides.esbuild 0.25.12 | 4 high (vite itself still flagged + braces) | not run | not run | not run | not run | vite 5 is vulnerable itself; dead end |
| (b) vite 6 | vite 6.4.4, singlefile 2.3.3 | 3 high (braces chain only) | 187/187 | 22 s, 1,736,952 B | ALL PASS | identical (staged shots within 0.1% bytes) | braces unfixable upstream |
| (c) vite 7 | vite 7.3.7 (esbuild 0.28.2), singlefile 2.3.3 | 3 high (braces chain) | 187/187 | 24 s, 1,462,479 B (smaller; default browser target is newer: Chrome 107/Safari 16) | ALL PASS | identical | braces unfixable; newer default target drops old browsers |
| (d) vite 8 (Dependabot #5) | vite 8.3.4 (rolldown 1.2.14, lightningcss), singlefile 2.3.3 | 3 high (braces chain) | 187/187 | FAILS by default: lightningcss minify rejects an existing invalid CSS rule ("Invalid token in pseudo element"). Works with `build.cssMinify:'esbuild'`: 9 s, 1,445,819 B | ALL PASS with that setting | identical | needs config change or CSS fix; braces unfixable; rewrite of bundler (Rolldown) = bigger risk |
| **(e) RECOMMENDED: vite 6.4.4 and drop vite-plugin-singlefile** | vite 6.4.4 + in-repo `inlineSingleFile()` plugin in vite.config.js | **0 vulnerabilities** | 187/187 | 16 s, 1,736,952 B | ALL PASS (sw stamp `0.4.0-5f715dcc69`, no `__SW_VERSION__` left) | identical to path (b) and to baseline by eye | none found |

Notes
- Path (e) output is byte-identical to path (b): same index.html size and same service-worker stamp hash (`5f715dcc69`), i.e. the in-repo plugin does exactly what vite-plugin-singlefile did for our config (one inlined `<script type="module">` and `<style>`, no external js/css; public files icons, manifest, sw.js still copied).
- HUD check: `scripts/hud2-shots.mjs` against a vite preview on its own port (4190) for each path; compared by eye with docs/screenshots/hud2 (desktop full: identical) and by file size to a fresh baseline render. "natural" shots differ run to run (random offers) even on the baseline.
- A pre-existing CSS issue shows as an esbuild warning on every build (`box-shadow: 0 0 1.2em var(--glow), 0 .6em ...` near line 105 of the bundled CSS: "Expected identifier but found whitespace"). Harmless on vite 5/6/7; it is what breaks vite 8 default CSS minify. Worth a tiny separate fix.
- Licences: lockfile after (e) has 69 packages: 66 MIT, 1 ISC, 1 BSD-3-Clause. New transitive packages vs baseline are small (`npm ls --all` 80 -> 84 lines; singlefile + micromatch + braces + fill-range etc. removed, esbuild 0.25 platform packages / vite 6 deps added). No postinstall scripts run (npm 11 prints an `allow-scripts` warning for esbuild's postinstall; builds work regardless).
- Phaser pinned to 3.90.0 (what the lockfile already resolved), so `^`/`~` ranges are gone from package.json.
- Dependabot PR #4/#5: closing is Matt's call; #5 (vite 8) would leave 3 highs and break the build as-is.

## Adopt (steps)
1. Review the PR/branch `vite-upgrade` (3 files: package.json, package-lock.json, vite.config.js).
2. Merge to `dev` (not straight to main), run `npm ci && npm audit && npm test && npm run build`, then the PWA check and HUD shots.
3. Confirm the live-site flow as usual (dev -> main PR). After release, close Dependabot PRs #4 and #5 (they would conflict) and consider adding a Dependabot ignore for vite major bumps until a planned move.
4. HANDOFF.md mentions vite-plugin-singlefile; update the wording after merge.

## Risks
- Own inlining plugin = ~30 lines of code we now maintain (regex based, same technique as the library). Covered by build + PWA check; a future Vite major may need a tweak (vite 8 uses `codeSplitting:false` instead of `inlineDynamicImports`).
- Vite 6 is the previous major; it still received the 6.4.3/6.4.4 security patches, but it will eventually stop. Next planned step would be vite 7 (works here, smaller output, but raises the default browser target) or 8 (needs the CSS fix).
- `npm audit` could report new advisories later regardless.

## Rollback
`git revert` the merge commit (or `git checkout dev -- package.json package-lock.json vite.config.js && npm ci`). Nothing else changed; saves and game code untouched.

## Needs Matt's approval
Merge of `vite-upgrade` into `dev` (and later main); dropping vite-plugin-singlefile in favour of the in-repo plugin; closing Dependabot PRs #4/#5.
