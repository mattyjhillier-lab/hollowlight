# CLAUDE.md edits for the new name (Wispwick) and the current state: DRAFT for Matt's approval

Status: drafted 2026-10-28 by Claude. CLAUDE.md itself is NOT edited. On Matt's yes, apply the edits below exactly (Claude may apply them then). Sources: LOCKED "NAME LOCKED v2", "NAME CONFIRMED", "BRAND + RENAME BUILT", "CHARACTER SYSTEM v2", "MAIN PROTECTION HARDENED", "SECURITY HARDENING"; QUEUE "Brand build" note ("CLAUDE.md edits needed").

Kept on purpose (no edit): "Cursed Forest" as Chapter 1's name; "The Hollow" (world identity); the repo `mattyjhillier-lab/hollowlight` and the live URL until Matt renames the repo; localStorage keys `hollowlight:*`, the service-worker cache prefix, the internal CSS font family "Hollowlight Chancery" (none are shown to players; tests/brandname.test.mjs guards the player-visible name). The art recipe name "HOLLOWLIGHT STYLE v1" in the Locked design section: recommend KEEP as an internal recipe label (many docs cite it); Matt may override with a rename to "Wispwick Style v1".

## Edit 1: title and name line (lines 1-2)

BEFORE
```
# Hollowlight: Spirits of the Dusk — survivors-style incremental game
(Working title was Cursed Forest; that is now Chapter 1's name. Always write "Hollowlight" as one word. Repo: mattyjhillier-lab/hollowlight, live at mattyjhillier-lab.github.io/hollowlight/. Plan: docs/PLAN.md, research: docs/research/.)
```
AFTER
```
# Wispwick: Spirits of the Dusk — survivors-style incremental game
(Name locked 2026-10-28: Wispwick, one word; it replaced the earlier title Hollowlight, which clashed with several itch.io games. Cursed Forest is Chapter 1's name. Repo and live URL still use the old name until Matt renames the repo: mattyjhillier-lab/hollowlight, live at mattyjhillier-lab.github.io/hollowlight/. Internal names kept on purpose so saves never break: localStorage keys `hollowlight:*`, service-worker cache prefix, CSS font family "Hollowlight Chancery". Nothing a player reads may say Hollowlight (tests/brandname.test.mjs). Plan: docs/PLAN.md, research: docs/research/, adding content: docs/CONTENT-GUIDE.md.)
```

## Edit 2: fit rule (line 62, one phrase)

BEFORE: `must (1) fit Hollowlight's look and identity`
AFTER: `must (1) fit Wispwick's look and identity`

## Edit 3: GitHub security rule (line 78)

BEFORE
```
- GitHub: work on `dev` branch and merge via PR; `main` is protected and is the live site. Workflow permissions stay minimal; pin/verify action versions; secret scanning, push protection and Dependabot stay on.
```
AFTER
```
- GitHub: work on `dev` (or a `wip/*` branch merged to dev) and merge to main only via PR. `main` is protected (admins included, no direct push, force-push and deletion blocked, required status check `test` from ci.yml: npm ci + test + build) and is the live site. Workflow permissions are per-job least privilege with actions pinned to commit SHAs; secret scanning, push protection, Dependabot and 2FA stay on (Matt confirmed 2026-10-28). Never merge to main without Matt's explicit yes.
```

## Edit 4: test count line (line 87)

BEFORE
```
- `tests/*.test.mjs` (`npm test`, ~660 tests at 2026-10-17; run it, do not trust this number).
```
AFTER
```
- `tests/*.test.mjs` (`npm test`, 1204 tests at 2026-10-28; run it, do not trust this number).
```
(the rest of that line is unchanged)

## Edit 5: stack and layout, add the folders that now exist (after the `src/ui/ui.js ...` line)

ADD one line
```
- Also: `src/save/` (versioned saves, lanterns/profiles), `src/meta/` (skill tree compile/budget, codex, bond, migrations), `src/audio/` (code-made sound engine + music), `src/gfx/` (code-drawn rigs, summons, night/dawn layers), `src/data/tree/` (tree fragments: core, emblems, clusters, chapters, tools). Content guide + print-only scaffold: docs/CONTENT-GUIDE.md, `node scripts/new-content.mjs <kind> <id>`.
```

## Edit 6: abilities (line 107)

BEFORE
```
- Characters each have an active ability, 60s base cooldown (Wren: Pack Howl, Elias: Sanctuary). Tree later adds cooldown reduction (floor ~30s) and auto-activate thresholds (e.g. low HP).
```
AFTER
```
- Characters each have an active ability, 60s base cooldown (Wren: Pelt Dash, Elias: Sanctuary Ring; CHARACTER SYSTEM v2: heroes differ by ability and look, levels are granted after a run only; see docs/design/characters-v2.md and LOCKED). The tree adds cooldown reduction (floor `balance.json` abilityCdFloor) and auto-activate options.
```

## Edit 7: replace the stage-1 "Current state", "Matt's feedback so far" and HISTORICAL task list (lines 111-130) with the current state

BEFORE: the section `## Current state (stage 1 done, ...)` through the end of `## Task list for Claude Code (HISTORICAL ...)` (everything between the Locked design section and `## Hosting plan (free only)`).

AFTER
```
## Current state (2026-10-28; live status: docs/LAUNCH-CHECKLIST.md "STATUS" block, queue: docs/QUEUE.md, decisions: docs/LOCKED.md)
The core game is built on `dev` and passes `npm test` and `npm run build`: heroes Wren and Elias (character system v2), 5 weapons + 15 evolutions, skill tree v2 (Lantern Web) with the Almanac/codex, saves with lanterns (profiles), nights (Twilight, Deep Dusk, Long Night), Gentle Light, wardrobe, Endless Dusk, Chapter 1 with Elder Treant, mini-boss and map events (Lamp Posts, Lantern Road, Hollow Knot), audio, first-minute hints, front door, PWA and phone controls, About page, wordmark/icons. The final retune (RT1-RT8) is done; accepted misses are in the LOCKED row "RT6-RT8 + overnight decisions".
What is LIVE on main is only an older build. The Release Gate (LOCKED) stands: nothing merges to main until the checklist is done and Matt says yes.
Open (owners in the checklist): Matt's play tests and real-phone tests, UK IPO/EUIPO trademark search for Wispwick, About wording and feedback channel, the decisions waiting in docs/QUEUE.md, the merge yes. Claude: final verification, accessibility/save-safety checks, launch-merge tree snapshot (`node scripts/tree-release.mjs --snapshot`).
Balance targets live in LOCKED "FINAL RETUNE TARGETS" (fresh Twilight 15-30%, mid tree 30-55%, max 65-90%, boss rules); sweeps: `scripts/sweep-all.mjs`, `rt-matrix.mjs`, `boss-sweep.mjs`, `bless-sweep.mjs`.
```
(The stage-1 tuning numbers, feedback list and historical task list are superseded; they stay in git history and docs/QUEUE.md.)

## Edit 8: hosting plan, one line (line ~132)

BEFORE
```
- Static site, no backend. Build with `npm run build`; deploy `dist/` to **GitHub Pages** (GitHub Actions workflow on push to main) or Cloudflare Pages / Netlify free tier.
```
AFTER
```
- Static site, no backend. Build with `npm run build`; deploy `dist/` to **GitHub Pages** (deploy.yml on push to main, after a PR with CI green) or Cloudflare Pages / Netlify free tier. Before outside testers: decide public Pages vs private repo + Cloudflare (Matt).
```
(the rest of that line is unchanged)

## Not changed (reviewed)
The standing rules (questions, definition of done, design-lock-build, research-review-build, focus keeper, weak spots, three options, keep going, small chunks, fit, token conservation, security) need no edit. "Security check" and "Fit check" wording stays.
