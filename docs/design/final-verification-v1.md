# Final verification v1 (LAUNCH-CHECKLIST item 23), 2026-10-28

Branch wip/final (from origin/dev c5b6ac3, merged origin/dev f38c567 with the a11y work). Run by Claude under the AUTONOMY GRANT while Matt was away. Nothing merged to main, no settings touched, no locked target or balance number changed, no new content.

## 0. Verdict (short)
- Balance with map events ON (the shipped default): every LOCKED band holds at the pooled level. The per-start misses are the same ones Matt already accepted ("RT6-RT8 + overnight decisions"), plus small-sample per-start wobble. **No band broke, so no event reward was tuned.** Events still cost the bot a little (fresh -3, mid -6, maxed 0 pts vs OFF), not the +2 to +5 the sheet expected; that is already decision "Map events balance" in QUEUE, now updated with the full-sample numbers.
- Performance with events on, 350 foes: frame pacing unchanged vs events off; events cost about +1 ms main-thread work and double the garbage (section 2). Queued as a render-only follow-up; real-phone check is Matt's.
- Security: clean (section 3).
- Visual QA: 5 CSS-only fixes shipped (section 4); the rest are benign or taste items.
- Tests 1224 / 1224 green (after the a11y merge), build OK; sites-off sweeps byte-identical (section 5).

## 1. Balance with map events ON (SITES=1, SITES_BOT=calm), random bot unless stated
Data: docs/design/fv-data/fv-on.jsonl (one line per run, deduplicated by key#seed). OFF baseline = docs/design/ev-data/ev-head-off.jsonl (current dev, events off, 48 seeds/cell; sim byte-identical to today). Compare: `node scripts/fv-compare.cjs docs/design/fv-data/fv-on.jsonl docs/design/ev-data/ev-head-off.jsonl`. CIs are Wilson 95%. Pass rule (final-retune-plan): in band, or within 3 pts of the edge with the CI overlapping.

### 1a. Pooled per power state
| State (band) | OFF win (CI, n) | ON win (CI, n) | delta | Pass | dead <5:00 OFF/ON | reach-win OFF/ON (60-75) | boss share OFF/ON (20-35) | fight OFF/ON (75-100 s) | first evo OFF/ON |
|---|---|---|---|---|---|---|---|---|---|
| Twilight fresh (none, Bond 0) 15-30 | 29 (25-33) 479 | 26 (24-29) 960 | -3 | PASS | 4 / 5% | 79 / 84 | 11 / 7 | 99 / 96 s | 5:18 / 5:32 |
| Twilight fresh FOCUS 15-30 | (RT values: Wolves 29, Bolts 28/36, Ravens 35/50) | 23 (19-26) 480 | - | PASS | - / 5% | - / 78 | - / 8 | - / 99 s | - / 5:35 |
| Twilight mid (half, Bond 0) 30-55 | 48 (43-52) 483 | 42 (39-45) 960 | -6 | PASS | 0 / 0 | 88 / 90 | 13 / 8 | 70 / 69 s | 6:57 / 7:05 |
| Twilight maxed (full, Bond 25) 65-90 | 91 (88-93) 481 | 91 (89-92) 960 | 0 | pass (rule) | 0 / 0 | 99 / 99 | 11 / 7 | 67 / 66 s | 6:17 / 6:25 |
| Deep Dusk mid (half, Bond 0) 15-30 | 18 (16-21) 960 (RT5) | 23 (17-30) 160 | +5 | PASS | 0 / 0 | 72 / 77 | 9 / 9 | 91 / 92 s | 6:56 / 6:39 |
| Deep Dusk full tree Bond 0 35-55 (RT5 decision) | 35 (30-39) 480 (RT5) | 32 (27-37) 320 | -3 | pass (rule) | 0 / 0 | 83 / 82 | 11 / 10 | 94 / 96 s | 6:29 / 6:58 |
| Long Night maxed (full, Bond 25) 10-20 | 18 (16-20) 960 (RT6) | 17 (13-21) 320 | -1 | PASS | 0 / 0 | 51 / 50 | 21 / 20 | 133 / 136 s | 7:37 / 7:25 |

Sample sizes: Twilight headline 96 seeds/cell (as asked), FOCUS 48; Long Night 32 seeds/cell, Deep Dusk mid 16 and full Bond 0 32 seeds/cell (time-boxed: a duplicate matrix process ran by mistake for ~3 h and halved throughput; it was found and killed, duplicate lines are deterministic and were removed). Deep Dusk full + Bond 25 was not re-run (Matt allows it above its band). Deep Dusk / Long Night OFF baselines are the RT5 / RT6 files (same sim except Twilight-only changes since). Long Night hero gap ON: Elias 19 / Wren 14 (OFF 23 / 13).

Hero gap (Elias minus Wren), ON: fresh 11 (OFF 7; without Ravens 7), FOCUS 5, mid 5 (OFF 9), maxed 3 (OFF 6). Deaths (fresh, ON): median 10:50, p10 5:28, p90 13:36, 79% between 6 and 14 min (OFF 80%). Map events per run (fresh / mid / maxed): lamps 2.6 / 2.7 / 3.0 of 12, roads 0.48 / 0.68 / 0.93 of 2, knots ~0 of 2, XP 0.68 / 0.83 / 1.07 levels, gold 32 / 41 / 55, Blessings 0.14 / 0.24 / 0.37, shards 0.

### 1b. Per start, Twilight (ON 96 seeds/cell random, 48 FOCUS; OFF 48)
| Start | Fresh Wren ON (OFF) | Fresh Elias ON (OFF) | FOCUS W / E | Mid W / E ON (OFF) | Maxed W / E ON (OFF) |
|---|---|---|---|---|---|
| Wolves | 20 (23) | 27 (27) | 19 / 13 | 50 (46) / 49 (51) | 92 (85) / 90 (88) |
| Ravens | 32 (29) | **57** (42) | 33 / **44** | **24** (31) / 38 (34) | 79 (92) / 91 (94) |
| Bolts | 21 (36) | **38** (38) | 29 / 29 | 49 (43) / 50 (53) | 94 (98) / 95 (94) |
| Chain | 14 (23) | 18 (19) | 13 / 17 | 44 (44) / 51 (61) | 94 (89) / **96** (98) |
| Orbit | 19 (13) | 19 (37) | **8** / 21 | 32 (40) / 36 (46) | 88 (75) / 89 (96) |
Bold = outside the band by more than the pass rule allows (CI still overlaps for every bold cell except Elias Ravens fresh and FOCUS). Reading:
- Elias Ravens fresh 57 / FOCUS 44: the accepted Ravens miss ("Ravens fresh win ~40-50%, accepted as measured", RT6-RT8 decisions). Its OFF value swings 42-65 between samples (RT8); events do not cause it.
- Elias Bolts fresh 38: the same with events off (OFF 38, RT3b 33). Pre-existing, not an event effect.
- Wren Ravens mid 24 (CI 17-33): OFF 31 (RT3 32). Small-sample edge.
- Wren Orbit FOCUS 8 (CI 3-20): Orbit FOCUS was not in the band before either (RT1 FOCUS 19, later starts dropped); random Orbit is in band (19).
- Maxed Chain/Bolts 94-96: the accepted "Elias Chain maxed 94% = noise" (RT3/RT4 decisions); pooled maxed 91 sits on the edge exactly as without events.
- Deaths before 5:00 fresh: pooled 5% (guard 5%); the cells above 5 are Wren Wolves 9, Ravens 8, Bolts 7 (Orbit-Wren is 3% here; the accepted 9% guard miss is a 96-seed draw). Sheet stop rule 'rise > 2 pts' not hit (4 -> 5).

### 1c. Sheet stop rules (map-events-v1 section 7)
| Target | Result | Rule hit? |
|---|---|---|
| Fresh win +2 to +5, stay in band | -3 (in band) | no (expected lift missing: decision already in QUEUE) |
| No deaths before 5:00 (rise <= 2 pts) | 4 -> 5% | no |
| Deaths spread 6-14 min | 79% (80% OFF) | no |
| First evolution not > 30 s earlier | 14 s LATER fresh, 8 s later mid | no |
| Wren vs Elias gap (event part <= 5) | fresh 7 -> 11, driven by Elias Ravens (noisy, see 1b); mid 9 -> 5, maxed 6 -> 3 | borderline fresh only; not event-caused per cell |
| Boss reach-win / share / fight | 84 / 7 / 96 s fresh (OFF 79 / 11 / 99) | pre-existing misses (accepted RT2/RT3); events lower the boss share slightly |
| Event power share (calm - OFF) <= 5 pts | -3 / -6 / 0 | magnitude only on mid (CIs overlap); events are a cost, not a power spike |

## 2. Performance (scripts/pace.mjs, real GPU, headed Chrome, 350 injected foes, Wren grant loadout, t = 4:30 with lamps and road 1 awake)
Two runs each, quiet machine (matrix stopped), events ON (default) vs `?sites=0`:
| Metric | ON run 1 / 2 | OFF run 1 / 2 |
|---|---|---|
| frame p50 / p95 / p99 (ms) | 16.7 / 50 / 66.6 ; 16.7 / 49.9 / 66.6 | 16.7 / 49.9 / 66.6 ; 16.7 / 49.9 / 64.9 |
| main-thread work avg / p95 (ms) | 11.5 / 19.8 ; 10.8 / 20.1 | 9.9 / 18.3 ; 10.0 / 16.8 |
| allocation MB/s (GC drops in 30 s) | 81 (115) ; 75 (122) | 42 (80) ; 43 (71) |
| adaptive quality tier changes | 1 ; 1 | 1 ; 1 |
Reading: frame pacing is the same with and without events (p95 ~50 ms in BOTH: this desktop dropped one quality tier in every run, a machine-level cost, not events). Events add about **+0.8 to +1.6 ms average main-thread work** and **about double the garbage (+33 to +38 MB/s, ~45 more GC pauses per 30 s)**. Most likely source: src/gfx/siteview.js clears and redraws four Phaser Graphics every frame (posts, rings, badges, arrows) plus per-frame badge arrays. Within the old +1 ms budget on average only at the low end; GC churn matters most on phones. Not fixed here (code, not CSS); queued as a small render-only chunk (cache static post art, redraw only on state change), and Matt's real-phone `?debug=1` check should include a run with events on.

## 3. Security re-run
| Check | Result |
|---|---|
| npm audit (after npm ci) | 0 vulnerabilities |
| innerHTML / outerHTML / insertAdjacentHTML / eval / new Function / string setTimeout in src/ | none (only comments saying they are not used) |
| URL params fuzz (tests/params.test.mjs: hostile values, __proto__, long strings) + debug params never bank (tests/debug-saves.test.mjs, includes ?sites=0) | present, pass |
| Save import fuzz (tests/save, savereview, savev3, savesafety: corrupt JSON, wrong types, huge arrays, prototype pollution) | present, pass |
| Workflows | ci.yml + deploy.yml: workflow `permissions: {}`, per-job least privilege, all 5 actions pinned to full SHAs |
| Secrets | `git diff b2e78ce..HEAD` scanned for token / key / private-key patterns: none (only prose about tokens); no .env / .pem / key files tracked |
| New dependencies | none |
| CREDITS | docs/CREDITS.md refreshed: Wispwick, Phaser 3.90.0 MIT (only runtime dep), vite 6.4.4 build-only, lockfile 68 packages (66 MIT, 1 ISC, 1 BSD-3), fonts (OFL, renamed subset), every art piece code-made (painters, wordmark, icons, share image), audio synthesised, AI-use disclosure; one TODO Matt (how the hero sheets were first made) |

## 4. Visual QA (scripts/fv-shots.mjs; docs/screenshots/final/*.jpg + fv-report.json)
Sizes: game 640x360, phone landscape 844x390 @2, phone portrait 390x844 @2 (touch). Screens: title, map (night) select, run with map events visible, level-up with 3 gold cards (worst case), results, tree, Almanac, Settings, About; plus HUD in a boss fight at 812x375 / 844x390 / 640x360 / 1280x720 (hud-boss-*.jpg). The script also flags off-screen text, clipped text, overlapping buttons and small taps.

FIXED (CSS only):
| # | Problem | Fix |
|---|---|---|
| 1 | Level-up with 3 gold + 3 stat cards at 640x360 (no touch) was taller than the view and centred off both edges: title and Reroll unreachable (also flagged by the a11y agent) | src/cards.css: the level-up layer scrolls (`overflow-y: auto`, `justify-content: safe center`) |
| 2 | Title at 640x360: the footer 'Install / Full screen' link drew over the install card's 'Not now' | src/ui/title.css: footer link hidden while the card is open (the card has the same buttons) |
| 3 | 'CHAIN LIGHTNING' tag ellipsised on stat cards at game size | src/cards.css: tighter letter-spacing on small landscape stages |
| 4 | Phone landscape HUD: the moon arc started 7 px above the screen (a11y agent's failing check) | src/hud.css: compact `.h-moon` top clamped at 0; checked with the boss bar up (no overlap) |
| 5 | Settings tabs at phone portrait: 'Picture' / 'Controls' touched their pill rims | src/ui/u4.css: less side padding / tracking under 420 px (still tight; see open 3) |

BENIGN flags (no change): tree node buttons overlap at far zoom (pannable web, by design); 'gold' / 'soul shards' / Almanac ', 0 of 11' are screen-reader-only labels; '+312' glyph boxes on results; portrait level-up needs a scroll with 6 cards (it scrolls; LOCKED 'Evolution pick text, 3-card worst case').

OPEN (need Matt, taste):
1. Results 'Almanac' button is a small plain link next to the big brass buttons (by design in codex.css, reads fine at 13 px+).
2. First Lantern Web visit at 640x360 opens with the explainer card over the web (one-time).
3. Settings tab 'Controls' is still snug at 375-390 px portrait; a shorter label ('Keys') would fix it fully = a copy change, Matt's call.

## 5. Default-off path
scripts/sweep.mjs wren / elias, 24 seeds, random and FOCUS, sites off (the bot default) on wip/final vs pre-events dev 15e3049: all four outputs **byte-identical** (cmp). src/sim, src/data and src/meta have no diff vs origin/dev, and no event reward number was changed.

## 6. Open items and owners
| Owner | Item |
|---|---|
| Matt | Map events balance decision (QUEUE 'Decisions waiting', numbers updated): events cost the bot a little, not the +2-5 lift; playtest a run with events on |
| Matt | Accepted per-start misses re-check after real playtests (Ravens fresh, Elias Bolts fresh 38 with or without events, Orbit-Wren early deaths, Long Night gap) |
| Matt | Real-phone fps/p95 with events on (`?debug=1`), PWA install, low-end Android |
| Matt | CREDITS TODO (hero sheet origin), About wording + feedback channel |
| Matt | Settings tab label 'Controls' at phone portrait (open 3), results Almanac link look (open 1) |
| Claude (at launch merge, after Matt's yes) | tree-release snapshot (24b); re-run fv-shots on the merged build |
