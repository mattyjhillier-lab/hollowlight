# FIX-EVERYTHING-FLAGGED: triage (2026-10-17)

Source: LOCKED row FIX-EVERYTHING-FLAGGED, docs/LAUNCH-CHECKLIST.md section F, QUEUE/LOCKED weak-spot lines, agent reports captured there, plus a grep of docs/src/scripts/tests for weak spot / not built / UNVERIFIED / TODO / FIXME / known limit / flaky (src, scripts and tests contain none; the only TODO-like hit is a comment in scripts/four-evo-probe.mjs).

Buckets: FIXED (done in this chunk), FIX NOW (queued, small), NEEDS MATT (decision or taste, three options, recommended first), NEEDS PHONE (Matt's real device), AFTER-R1 (balance-dependent; re-measure after the retune), ACCEPTED (harmless, reason given), QUEUED CHUNK (already owned by a named later chunk; not a loose end).

Baseline: sweeps (wren + elias, 24 seeds, random + FOCUS) were run on a pristine HEAD worktree before any change and again at the end; result in section 8.

## 1. Counts

| Bucket | Items |
|---|---|
| FIXED in this chunk | 15 (X1-X15) |
| FIX NOW remaining | 1 (W12 Calm/Low and WL6 phone Med/Low screenshots; see section 10) |
| NEEDS MATT | 12 (N1-N12) |
| NEEDS PHONE | 4 (P1-P4) |
| AFTER-R1 | 9 (R-1..R-9) |
| ACCEPTED | 17 (A1-A17) |
| QUEUED CHUNK | 7 |

## 2. FIXED in this chunk

| # | Item | What was done |
|---|---|---|
| X1 | Flaky test (cardsui 'input lock' failed once under load) | Root cause: REAL flakiness, not shared-tree edits. The test called render() then activate() and expected a 250 ms wall-clock lock to still hold; on a loaded machine more than 250 ms passed between the two calls. Fixed by setting openAt explicitly (future, then past), commit "make cardsui input-lock assertion deterministic". The other timing tests were audited: the kit tooltip timers (5/25/80/150 ms) are ordered by due time so they cannot invert; the tree compile budget (1500 ms for 600 nodes, normally ~20 ms) has 70x headroom. Suite ran green apart from this one test. |
| X2 | URL debug param validation gaps (seed/t/rr/ban accepted NaN, negatives, Infinity; grant/bless/auto unbounded strings; flags accepted any text) | New pure module src/params.js (app.js now calls it): every flag accepts only 0/1, numbers are clamped finite integers (seed 0..2^31-1, t 0..1200, rr/ban 0..99), grant/bless need a safe charset and length <= 300, auto must be a plain id, bright/meta/touch are enums, ground only 'flat'. tests/params.test.mjs enumerates every key (FLAGS_ON 16 + FLAGS_OFF 3 + 11 others) and checks KNOWN_KEYS against every q.get() in the source, plus prototype-key and hostile-value cases. Nothing from the URL is ever saved; DOM is never written from it (unchanged). The sim already clamped debugGrant ranks and validated blessing ids. Three source-grep tests (air, push, vibrancy) now point at params.js. |
| X3 | Settings validation re-audit | sanitize() already coerces every setting through num/bool/enum with defaults; new test feeds 8 hostile values to every setting key and checks the type and the default fall-back. No gap found. |
| X4 | Space-on-resume ability queueing "UNVERIFIED for all paths" | Found a real remaining path: the drain only ran while paused, so a Space press on a level-up card (cards activate on Space) or the end screen left a pending Phaser JustDown that fired the hero ability on the next running frame. Now drained whenever the sim is not running (app.js frame). Source test added. Sim untouched. |
| X5 | CLAUDE.md stale locked-design lines (48 tests, 11 evolutions, "evolved weapons are final", Pouncing Pack, old task list) | Updated in a separate small commit (15 evolutions, evolved weapons keep stat cards, v1 scope, Light Trails id, ~660 tests, task list marked historical). |
| X6 | LOCKED/BIBLE rows that contradict later locks | Added a Reopened-list entry superseding the "11 evolutions" rows and the "evolved weapons are final" wording, and marked the BIBLE Pouncing Pack row as removed. Historic rows are kept (they are the audit trail). |
| X7 | Stale QUEUE lines (old NOW/NEXT in E1/E3/U3-U6 lines, closed "In progress" items, old "Waiting on Matt" items, G2/Vite NEXT) | Marked historical/closed in place with the reason (nothing deleted). The live NOW/NEXT is the RELEASE GATE line at the bottom plus LAUNCH-CHECKLIST. |
| X8 | Dependabot alerts on main | Investigated, no change to main (section 9). |
| X9 | `docs/research/37-enemy-design.md` untracked | Already committed in 285caa9 (the only untracked path now is another agent's docs/mockups/enemies-art2/, not touched). Closed. |
| X10 | Test counts / suite status UNVERIFIED | Full runs: 657 tests at the start (1 flaky failure, X1); 664 after the new tests; final count 665 (all green, section 11). |
| X11 | Bot never builds bolts-first | scripts/bot.mjs gains PREFER_W=<weapon id> (weapon-first bot; default off; rng use unchanged so default sweeps are byte-identical). Reach: GATES=all FOCUS, 24 seeds, bolts-first vs normal FOCUS: Wren 38% vs 42% wins, 22/24 vs 23/24 runs evolve; Elias 17% vs 13%, 12/24 vs 10/24 evolve (noise about +-10 points): bolts-first is not a runaway and bolts evolutions are reachable. Evolution-vs-base for bolts is scripts/evo-home.mjs (the W10 sweeps). |
| X12 | Quality tier flapping "UNVERIFIED" | The pace harness prints "tier changes"; 0 in every run of section 4 on this machine (Matt's PC still to confirm, see P3). |
| X13 | Wall of Wings hits-taken shortfall | Not a bug: the card text promises no safety (checked in evolutions.json: "what touches them is pecked, and the rest flee"). ACCEPTED A9 (listed here because it was a flagged item). |
| X15 | Screenshot gap: AL-6 Med tier and phone-portrait frames | Taken: Med (desktop, phone landscape, phone portrait) and phone-portrait High/Low, 4 moments + bird strips each, all PASS (no page errors, birds seen), docs/screenshots/al6/ (+32 frames, 4.9 MB total folder). Script gained the portrait view. Eyeballed Med flood and High first-light on portrait: HUD fits, birds read, no overlap. |
| X14 | npm audit | 0 vulnerabilities on dev (vite 6.4.4, esbuild 0.25.12, no braces). |

## 3. NEEDS MATT (all are tuned deviations or taste calls; each recommended option FIRST; nothing here blocks building, defaults stay in)

Suggested way to ask: ONE batch of three one-tap questions at a time, most blocking first. N1-N3 first.

| # | Item | Options (recommended first) |
|---|---|---|
| N1 | Talon Mark (ravens): boss home 1.41x under the 1.6 target; own raven damage ~3.0x base (team yardstick is fine) | (A) keep as built, dive 8x (recommended: single 1.92x, boss at pick 1.69x). (B) dive 12x: boss ~1.6x but single ~2.5x and ravens' own DPS ~4.5x. (C) dive 6x: own ~2.4x, team single 1.61x, boss 1.35x. |
| N2 | The Alpha (wolves): kite margin 1.41x vs the 1.4x gate (thin); numbers tuned away from the sheet | (A) keep tuned numbers (recommended: swarm 2.21x, boss 1.67x). (B) literal sheet 5.4/2.2, no shades: swarm 2.68x, kite 1.38x, boss cap@pick 6.98x (fails gates). (C) literal primary + pack power 1.25 + shades, cleave 0.8: swarm 2.40x, kite 1.33x. |
| N3 | Soul Lance (bolts): damage 2.0x + 0.07x per count rank instead of the locked 3.5x + 0.6x (the locked formula gives 5.15x single at max) | (A) keep 2.0x + 0.07x (recommended). (B) locked 3.5x + 0.6x (breaks the 3x cap). (C) a middle value (not measured; would need a probe). |
| N4 | Spirit Tempest: pop 0.12x on every hit instead of 0.6x on the last hit (locked version breaks the 3x cap at pick) | (A) keep 0.12x per hit (recommended). (B) pop only on the last hit at 0.3x: kite max 1.83x, cap@pick kite 3.02x at the cap, a lone foe gets no pop at max Pierce. (C) pop per hit 0.2x: kite max 2.54x, over the 2.3x band. |
| N5 | Vesper Tide (orbit): breathing phase 1.5 instead of the locked 1.0 (1.0 misses the band and falls below base) | (A) keep 1.5 (recommended: kite 1.87x). (B) revert to 1.0 (kite ~1.4x, swarm ~0.96x, below base). (C) crest 2.5 + phase 1.3 (kite ~2.0x). |
| N6 | Static Storm (chain): swarm home 1.78x, 0.02 under the 1.8 floor; power 0.47x vs the sheet's 0.42x | (A) keep 0.47x, accept the 0.02 (recommended). (B) 0.50x: kite 1.84x but cap@pick 3.08x (breaks the hard cap). (C) 0.42x sheet: kite 1.60x, swarm 1.55x (misses the band). |
| N7 | Thunder Judgment smite 0.72x vs the sheet's 0.65x | (A) keep 0.72x (recommended). (B) 0.65x: kite 1.76x, single 1.18x (misses band and single gate). (C) 0.76x (see LOCKED W11b). |
| N8 | Howling Legion pack bite x1.4 (ALT A applied by the coordinator) | (A) keep ALT A x1.4 (recommended: swarm 1.86x, kite 1.89x, boss 1.59x). (B) original x1.2: swarm/kite 1.64x/1.61x, under the band. (C) ALT B: pack x1.3 + echo bite 1.0. |
| N9 | Light Trails card name is provisional ("Lightfoot Pack") | (A) keep Lightfoot Pack (recommended). (B)/(C) two new names to offer when asked (copy only, one-line change in evolutions.json/tree.json). |
| N10 | Daylight reading of dark enemies: protan/tritan root crawlers at 220 units on the portrait phone (10 of 4860 cells in the full matrix, eye 2.83-2.99:1) and strict daylight on corrupted ground (289 cells: dark violet body on a dark violet floor). MEASURED THIS CHUNK: the only cheap knob (daylight body brightness of the root crawler, DARK_DAY_K 0.85) is already at its optimum: 0.60 (darker) gave 143/144 gate and strict 108/144; 1.25 (lighter) gave 142/144 and strict 107/144; current 0.85 gave 144/144 and strict 112/144 (slice: portrait, High, 11:30 + 14:30, restored + corrupted ground, 4 colour-vision modes). Corrupted-ground strict cells (40/72) did not move with either value. So no safe code change exists; it needs a new visual device | (A) thin pale rim light on enemies standing on corrupted ground in daylight only (a lit edge, restraint kept; recommended; Claude builds, re-runs the slice, shows true-size + phone shots). (B) a faint warm halo under dark enemies in daylight (more visible, more generic). (C) accept as is (normal vision 100%, eyes already >= 2.83:1 on every cell; documented). |
| N11 | Results copy (3 defeat lines, victory barks, hero epithets, button copy) is Claude's placeholder | (A) Matt edits the lines in docs (recommended; he reads them in one list, LAUNCH-CHECKLIST B6). (B) Claude drafts 3 alternatives per line. (C) keep the placeholder for the private test. |
| N12 | Live site (main) is v0.4.0-era; dev far ahead; name-clash check (Hollowlight vs Hollow Knight / "Hollow Light") | Matt-only: "ship it" gate and his own UK IPO / EUIPO / itch / Steam search. Not an option question. |

Already decided by Matt, listed so they are not re-asked: Judgement Wheel exempt from the stream40 cap@pick (he chose Alt 1).

## 4. NEEDS PHONE (Matt's real device)

| # | Item |
|---|---|
| P1 | Low-tier perf on a real phone; shader ground on a phone GPU; ambient/trail/night layers measured only in headless Chrome on the RTX 3060 |
| P2 | iOS test; Android install / PWA install test |
| P3 | Tier flapping fix (0 changes here) and p95/slow lines on Matt's own PC; the Brightness setting default "Brighter on phones" in sunlight |
| P4 | Touch controls (TOUCH-1) and results screen on a real phone |

## 5. AFTER-R1 (balance-dependent; re-measure after the retune, do not touch hpScale now)

| # | Item |
|---|---|
| R-1 | Starter win rates (Wren ~56/64%, Elias ~30/34%, target 15-30%) and the Wren-Elias gap (~26 points) |
| R-2 | GATES=all win rates (no locked target; re-read after R1) |
| R-3 | Bleed share 38% for swarm at Rend r5 (gate 35%) |
| R-4 | Gate counts for gates 13-16 (Spearhead, Returning Pages, Storm Tether, Vesper Tide) are ESTIMATES: re-run scripts/gates-pace.mjs |
| R-5 | Elder Treant fight 40-49 s (target 60-120 s), boss-death share, early deaths 4-8%, Murder Storm wall ~0 damage to a boss (the boss chunk redesigns) |
| R-6 | Elias Candle Wheel modest (on vs off within 1-2 points) |
| R-7 | Raven Watch only matters in thin waves; ravens crowd DPS 0.65-0.75x wolves (check the ravens are still a viable pick after the retune) |
| R-8 | Full skill tree makes the bot win ~100% (G2 rescale in SKILL TREE v2 BUILD) |
| R-9 | Light Trails mortal saturation (swarm/kite cap@pick 3.12x/3.01x; not a gate) re-read after R1 |

## 6. QUEUED CHUNK (already owned elsewhere, not loose ends)

W2 Rally the Pack (branch w2-rally; also pulls the Pack Howl x2 bite inside the amp clamp) | Skill tree v2 design + build + re-skin | Audio (sliders have nothing to preview until then) | Tutorial, profiles UI, codex, About page | Enemy sheet EN0-EN9 (Matt decides sheet #4 first) | Lamp posts / W8 POIs (moths circle a home spot until they exist) | Pup sleep/howl/back poses and Elias extra views (A2 polish, parked by Matt).

## 7. ACCEPTED (harmless; reason)

| # | Item | Why harmless |
|---|---|---|
| A1 | Wheel exempt from the stream40 cap@pick | Matt chose Alt 1; documented exception (its pick-time base is lower than its max) |
| A2 | Last 30 s flood rises 0.009 Y/s (sheet claimed 0.0027) | Kept as locked by Matt after seeing it; purely visual |
| A3 | Saturation flush clipped by the top vibrancy level at 15:00 | Shows mostly on ground; visual only |
| A4 | Snag blossoms cream/peach not pink; oak 0.8x and pillar 0.9x of sheet size; crown sway max ~1.7 deg | Reviewed in the world-sheet builds, fit the palette; invisible sway amplitude was the reason for the change |
| A5 | Low tier: no sway, no critters, no ground shader, ~2 ambient sprites | By design: the Low budget; critters are reserved for dawn birds |
| A6 | Moths circle a home spot | No lamps exist yet; resolves with lamp posts (queued) |
| A7 | Frame hitches in the original lag report were CPU contention; ~450 glow objects on High | Measured quiet-machine pacing 99% on time; glow count inside the tier cap |
| A8 | Blessing label shows "BLESSINGS - QUIET GIFTS" in caps in one string; Wider Glow uses a comma | Cosmetic; TEXT_RE is a security rule (plain text only into cards), so punctuation stays restricted |
| A9 | Wall of Wings does not reduce hits taken | Card promises nothing about safety (text checked); it is a crowd-control wall, not a shield |
| A10 | Light Trails swarm/kite cap@pick ~3.1x | Mortal-run saturation, not a gate (kills end the fight before the cap bites) |
| A11 | Sound/music sliders have no audio to preview | No audio exists yet (queued chunk) |
| A12 | docs/research/37 and the visibility-pins test depending on the measured-report file | Both files are committed; the test is a guard that fails loudly if the report is deleted |
| A13 | Test-suite numbers in older LOCKED rows (398, 629...) | Dated history; CLAUDE.md now says "run it" |
| A14 | Quality tier / High-tier perf noise | See section 8 |
| A15 | Pack Howl bite outside the amp clamp | Pre-existing and small; moves into the clamp with W2 (queued) |
| A16 | Gate-all balance for bolts-first | Reported, no target |
| A17 | Dependabot alerts #1-#4 on main | Dev-only packages; already fixed on dev (section 9) |

## 8. Perf (High tier night look; Low eye/perf budgets)

Re-measured with scripts/pace.mjs on the RTX 3060 (headless, tier High forced, 350 enemies, T=240, 30 s per run), night look off (`night=0`) and on, alternated, 3 rounds each. Whole-frame work (ms, avg / p95): off 17.7/30.5, 14.5/25.1, 13.5/24.4; on 19.9/43.7, 17.6/30.0, 12.9/23.0. Mean off 15.2, on 16.8: delta +1.6 ms with a round-to-round spread of 5 ms (round 3 had on FASTER than off). rAF averages 25-33 ms (not the quiet-machine ~99% on time) because the machine was NOT quiet: total CPU 100% from other processes (another agent's sweeps and renders, a 5.7 GB python process). Tier changes: 0 in all 6 runs (flapping fix holds here). Layer JS cost from the earlier same-session measure stays 0.50 ms High vs the 0.6 budget; Med 0.38/0.4, Low 0.16/0.2 (budgets met, unchanged since no render code changed). Verdict: STILL INCONCLUSIVE for the whole-frame delta; the budget cannot be proven or disproven on a loaded machine. Not a regression (no render code changed). Stays OPEN as NEEDS PHONE P1 / re-run when the machine is idle: `HEADLESS=1 TIER=high FLAGS=night=0 node scripts/pace.mjs dist` vs no flag, 3 rounds each.

## 9. Dependabot (main) investigation

`gh api repos/mattyjhillier-lab/hollowlight/dependabot/alerts` (read only, main not touched):

| # | Package | Scope | Severity | State | Advisory | Patched in | dev now |
|---|---|---|---|---|---|---|---|
| 1 | esbuild | development | medium | open | any website can send requests to the dev server and read the response | 0.25.0 | 0.25.12 (fixed) |
| 2 | vite | development | medium | open | path traversal in optimized-deps .map handling | 6.4.2 | 6.4.4 (fixed) |
| 3 | vite | development | high | open | server.fs.deny bypass on Windows alternate paths | 6.4.3 | 6.4.4 (fixed) |
| 4 | vite (launch-editor) | development | medium | open | NTLMv2 hash disclosure via UNC path handling on Windows | 6.4.3 | 6.4.4 (fixed) |
| 5 | braces | development (transitive) | high | auto-dismissed | stack exhaustion in deeply nested patterns | n/a | not in the dev lockfile |

All are DEV-SERVER-only (never shipped in dist/). Main still has vite 5.4.21 / esbuild 0.21.5; the open alerts close when dev merges to main ("ship it"). `npm audit` on dev: 0 vulnerabilities.

## 10. FIX NOW remaining

W12 Vesper Tide Calm/Low frames and WL6 phone Med/Low frames: scripts now support them (`QUALITY=low|med`, `CALM=1`, own CDP port via `CDP=`), but under the current machine load each capture takes many minutes; one Low frame was produced. Re-run when the machine is idle: `CDP=9455 QUALITY=low node scripts/w12-shots.mjs docs/screenshots/w12 <url>` and `CALM=1 ...`.


## 11. Verification (end of chunk)

- Tests: 665 / 665 pass (start of chunk 657 with one flaky failure; +8 new tests in tests/params.test.mjs). `npm run build` OK. `npm audit`: 0 vulnerabilities.
- Sweeps byte-identical to a pristine HEAD worktree taken at the start (cmp, 4 of 4): Wren random 46% / FOCUS 58%, Elias random 46% / FOCUS 33% at 24 seeds (small-sample noise is about +-10 points; the 96-seed starter numbers quoted elsewhere are unchanged). `git diff src/sim` is empty for the whole chunk: no balance moved, nothing for R1 to re-baseline.
- Commits (all on dev, small): cardsui test determinism; src/params.js + tests; settings hostile-value test; Space drain fix; CLAUDE.md; LOCKED/BIBLE supersede notes; QUEUE stale marks; AL-6 screenshots; this triage + checklist statuses + bot PREFER_W + w12 script options.
- Worktree cleanup: the pristine-HEAD worktree used for the sweep comparison is removed at the end; own Chrome/preview PIDs were closed individually.
