# Skill tree rework v2 (design sheet, 2026-11-02)

STATUS: DESIGN ONLY. Nothing built. Revises skill-tree-rework-v1.md using skill-tree-rework-v1-review.md (E1-E7, section 11) and Matt's picks (LOCKED rows "TREE REWORK PICKS", "SKILL TREE REWORK DIRECTION", "TREE BACKGROUND + SPACING"). v1 and the review are left unchanged. Matt confirms this sheet, then chunks Q0..Q8 run one at a time.
Labels: MEASURED = checked in code/data by the review; PROVISIONAL = model output, replaced by Q0; UNVERIFIED = not checked.

## 1. What v2 supersedes in v1
| v1 item | v2 |
|---|---|
| Free first lantern = Ghost Wolves 150 -> 0 (2.7, 3.1, T5) | DROPPED (E1/E2). See 4. |
| "Migrations: NONE", "snapshot at launch merge" (1.2, 3.1, T9) | Tree is RELEASED (v4, 160 fingerprints in tests/fixtures/tree-released.json). See 3. |
| 200 / 40 / 18 spacing (2.1, T1) | Measured proposal, 5. |
| Chunks T0-T9 | Q0-Q8, 8. |
| Set A (4B), A1 (4A), C1 (4C) | Set B with reserved slots (6), A3 hybrid (7), "Quiet first" (8). |
| Pacing chart 5.2 | Method only, numbers provisional, 9. |
| Flow 2.9 / hero panel 2.4 | Re-specified with starter pick, 3-step loadout, NO HERO WEAPON, Characters page, 10. |
| "last-hero field UNVERIFIED" | Resolved: `save.notes.loadout {hero, weapon}` via `lastLoadout()`; no new save field. |
Still stands from v1 by reference (do not re-spec): 2.1 tier sizes/zoom rules (diameters 76/26/9, FAR/MID/NEAR; real thresholds `LOD = {far 0.32, near 0.95}` in src/meta/treeview.js), 2.2 regions concept, 2.3 carved-stone background, 2.5 banner + condition tile, 2.6 Next lights, 2.8 unlock juice, 2.10 phone targets (44 px, tap-to-zoom, bottom strip), 2.11 Calm/a11y, 2.12 perf budget (targets only).
LOCKED rows now named (v1 missed them): CHARACTER SYSTEM v2 + CH4-CH6 (starter pick, 3 separate loadout steps: map -> character -> spirit), NO HERO WEAPON (2026-10-31: no hero-weapon pairing visible, no spirit preselected on first pick), TOP NAV: FLOATING TABS / NO STRIP (2026-10-31: the "pill row" is now floating glyph+label tabs, only the current tab has a soft gold pill; screens run behind them), FINAL RETUNE TARGETS (fresh 15-30, mid 30-55, max 65-90, boss 60-75 / 20-35 / 75-100 s, Long Night 10-20). Reopened by this work (when its chunk builds, with Matt's yes): front-door flow (FD4), MENU CHROME Home tab, Goals drawer/results strip as separate lists.

## 2. Plan: Quiet first, landmarks later (Matt's pick)
Step 1 (Q1-Q3) is render-only on existing positions, ids and prices: no save change, no version bump, no migration, no price change. Then re-measure pacing (Q0 result stays authoritative, re-run after Q3 if anything moved), then re-layout (Q4), home flow (Q5), regions (Q6), landmark promotion (Q7), phone/security/docs (Q8). Visible wow arrives at Q1.

## 3. Release and save rules (E1, fixes)
- Tree v4 is live since 2026-11-01. All 160 released ids/prices/requires are immutable unless core.version is bumped with a migration (tests/treerelease.test.mjs enforces this).
- Step 1 touches none of them. New nodes (Set B verbs, later) get NEW ids and a post-ship snapshot (`node scripts/tree-release.mjs --snapshot`, Claude, with Matt's yes) after the rework ships, not "at launch".
- One-time tree restart (Matt accepts, optional, not needed for step 1): allowed ONLY as a refund-everything reset: reuse the existing Regrowth-style migration (src/meta/migrations/), core.version 4 -> 5, refund every spent gold/shard/Dawnglass, never lose spent currency, then post-ship snapshot. Decision point is Q4 (see 11, question 2). Any released-price change without this = rejected.
- Saves: no new field in step 1. Only new persisted bit: the tour hint, via introcopy `intros`/hints (HINT_COUNT 13 -> 14, append-only, `cleanHints` masks unknown bits). Last hero = existing `notes.loadout`. Pins stay in localStorage `hollowlight:tree:pins` (already `sanitizePins`).
- Existing players: the tour never shows to them. Gate = `stats.runs == 0` AND not VETERAN_SEEN (existing introcopy rule). Pins, camera and spent state untouched.

## 4. First lantern (Matt's pick, E2 fix)
- No price change, no free Wolves. A new profile already gets exactly one spirit heart free via `grantStarter` (starter pick, 1 hero + 1 of 5 spirits) plus its first evolution gate. That heart is the glowing "first light" on the hub: it is shown lit with a soft one-time glow, nothing mechanical.
- The first real purchase, Second Glance (`sp_reroll1`, 150 gold, no condition, a reroll button felt in the next run) gets the pulse and the tour's "Light a lantern" plate. Pulse stops once bought or after the tour is dismissed.
- Reachability: PROVISIONAL, a loss run pays ~470-700 gold (review), so 150 is affordable after run 1; Q0 confirms. If a new profile cannot afford it after run 1, Q1 pulses the nearest affordable lantern instead (data-driven pick: cheapest unconditioned node), still no price change.
- Tour (3 whisper plates: "Light a lantern", "Landmarks open new things", "Zoom out to see the Hollow"), FAR for 1.5 s then ease to NEAR; Calm = fades only. One hint bit.

## 5. Spacing (E4, measured)
MEASURED on the live layout: 29 landmark-kind nodes (heart/socket/gate/key/mastery) form 34 pairs closer than 200 world units (min 37-44); 16 node pairs closer than the 40 diamond gap (min 18); web radius 1,600. A 200 landmark gap is not met almost anywhere.
Proposal (justified, lower impact):
1. Step 1 keeps all positions. Instead of enforcing gaps, medallion DRAW size is scaled down per node so neighbours never overlap: draw diameter = min(tier size, 0.9 x distance to nearest same-or-higher-tier neighbour), floor 22 px on screen (FAR dot). Honest limit: a few pairs at 37-44 units will render as small medallions until Q4; Q1 screenshots must show this is readable, else those nodes drop one tier visually (display only).
2. Landmark gap target for Q4: landmark centre gap >= 1.6 x medallion diameter at NEAR (about 120 units for 76 px; the old 2.6x = 200 is dropped as it forced a web roughly 1.7x wider with no gain at MID). Diamond gap >= 30; dot gap keeps `v2MinGap` 18 (16 pairs under 40 are all dots/diamonds and are fixed first).
3. Web radius: set by Q4 from the actual count: pack outward by rings, new radius = measured outermost landmark ring + one gap, expected 1,900-2,200 (ESTIMATE; Q4 computes it and `layoutIssues()` asserts gaps from new `layout` keys in core.json). Moves go through the moved-fixture pattern (tests/fixtures/tree-t3b-moved.json). Positions are not saved, so saves are safe; ids never change.
4. Region cap (v1: 12 landmarks + ~60 small nodes) is untested: Q2 checks it with the 300-node fixture.

## 6. Landmarks: Set B with reserved slots (Matt's pick)
- Promoted existing options first (10 + gates, from the review's confirmed keys): Second Glance (sp_reroll1), Holy Orbit (gt_holy_orbit), Spirit Bolts (gt_spirit_bolts, 1,500 crawlers), Raven Flock (200 / 4,500 crows), Chain Lightning (500 / Treant x2 + 2,500 crawlers), Deep Dusk gate (gt_cursed_forest_hard, 1,200 + 2 sh, clearChapter), Last Whistle (sp_auto, 1,050, survive 300 s), Kindred Start (rs_start, 1,500, ANY of 4,500 crows / 1,500 crawlers / Treant x2), Lantern Blessing (rs_bless, 1,800 + 2 sh, 15 blessings), Fourth Card (cd_fourth), Long Night gate (expert), Fifth Hook (rs_slot5), Last Light (li_last, 900 + 5 sh, clearChapter). Final list/order comes from Q0, not from this sheet.
- Hidden seals (E6): Lightfoot Pack (gt_phantom_stampede) and Wall of Wings (gt_murder_storm) stay `hidden: true`. They may be landmarks only as veiled "???" medallions: dark coin, "?" glyph, no name, no cost, no recipe, no condition progress; they light into their real medallion on discovery. They are NOT counted as named chase landmarks in the pacing chart (listed separately as "veiled").
- Four new verbs held as RESERVED SLOTS, no node id until built: Starting Synergy, Lamp-lighter (see lamps early), companion egg, hero trial lantern. Slot = layout position + tier flag in a `reserved` block of the region record (not a tree node, not in compose, not saved) drawn as a faint unlit silhouette, no text, never a dead end. Each verb needs: its own three-options round, a LOCKED row, an ablation + sweep vs FINAL RETUNE TARGETS, then a fragment node with a new id and a post-ship snapshot. Hero trial lantern is loadout/cosmetic reward only (NO HERO WEAPON). Companion egg may stay a silhouette at launch (companions come after Chapter 2).
- Order hint for filling dry stretches (review): Lamp-lighter and Starting Synergy early/mid, companion egg and hero trial late. Confirmed only after Q0.

## 7. Medallions: A3 hybrid staged (Matt's pick)
- Now (Q3): code-made medallions from the game's own rigs plus emblem sets; FAR form is an emblem, never a crop (22 px portraits are unreadable).
- Data: `medallion` is an allow-listed art id (E-sec): the id must be in a fixed manifest (`src/gfx/medallions.js`: emblem names + optional painted keys bundled in the build). Unknown or hostile ids fall back to the tier emblem; no path, URL or markup is built from tree strings; drawing via canvas/textContent only.
- Later: painted batches replace code-made coins by region, never one-offs, same frame/glow/size. Each painted image: provenance note + licence check + CREDITS line (CLAUDE.md asset rule), no living-artist style. Not in Q0-Q8.

## 8. Chunk plan (one at a time; each ends tests green + build, true-size and phone screenshots for visual ones, perf probe, security, fit, LOCKED/QUEUE update)
| Chunk | Visible result | Done-check | Matt's yes | Tests that change/are added |
|---|---|---|---|---|
| Q0 Measure | Corrected pacing chart (9), docs only + a new script `scripts/pace-v2.mjs` (read-only) | chart with p25/p50/p90 per landmark, max gap, seeds, per starter weapon | No to run; sees chart before Q4 | none (new script smoke test) |
| Q1 Render-only look | Stone background, tier sizes on existing positions, banner + condition tile (enemy picture, live kill count, Almanac link), Next lights as one goal list, starter-heart glow, first-buy pulse, tour gated | tests, screenshots FAR/MID/NEAR 1280x720 + 390x844, ids/prices/positions byte-identical, perf within budget, Almanac count == tree count, hidden seals still "???" | Yes: look review | tests/treescreen.test.mjs (layout/markup), tests/intros.test.mjs (tour gating + bit 14), tests/stathints.test.mjs if hint count asserted, fit-audit at three text sizes; new: banner/tile per condition type, Almanac sync |
| Q2 Perf fixture | Synthetic 300-node fixture (via `--extra`-style fragment, tests/treegen.test.mjs pattern) | draw ms desktop + phone via `?perf=1`, region cap check, 44 px targets | No | tests/treegen.test.mjs (fixture), new perf-fixture test; gates Q3 atlas size |
| Q3 Medallions | Code-made medallions, allow-listed ids, baked atlas | all render, colour-blind check, atlas size, hostile `medallion` ids fall back | No (A3 locked) | tests/treedata.test.mjs (medallion validation), tests/treescreen.test.mjs; new hostile-medallion test |
| Q4 Re-layout | New gaps/radius from 5, moved fixture; optional refund-everything reset | `layoutIssues()` clean at new keys, ids unchanged, tree-released unchanged (or v5 + migration + refund test), screenshots | Yes: layout look; and the reset decision (11.2) | tests/tree.test.mjs, tests/treedata.test.mjs, tests/treerelease.test.mjs (only if reset: version 5), moved fixture, tree-ids snapshot |
| Q5a Home hero panel | Tree home shows last hero (`notes.loadout`), swap row, starter pick for new profiles, 3-step loadout kept; spirit never preselected on first pick | one-hero, no-night-choice cases; hostile-save loadout | Yes: reopens FD4 | tests/frontdoor.test.mjs, tests/fd45.test.mjs, tests/chars-save.test.mjs, tests/evo-flow.test.mjs (starter) |
| Q5b Results loop | Results "what moved", Continue flies camera back, pulses newly lit/affordable | results fixtures (win, loss, no change), Calm path | No | tests/treescreen.test.mjs, tests/frontdoor.test.mjs; new results-moved test |
| Q5c Entry points | Title, Esc, profile chip, intros, Gentle Light, pause/death Next lights | each path reaches tree and back; first-run intro order | Yes | tests/frontdoor.test.mjs, tests/intros.test.mjs |
| Q6 Regions | Region records, backbone threads, FAR/MID/NEAR names, Far Hollow fog | region fixtures, screenshots | No | tests/treegen.test.mjs, tests/treedata.test.mjs |
| Q7 Landmark promotion | Tier flags, reserved slots, veiled seal coins; pacing chart re-run | chart vs aim; sweeps (sweep-all, bless-sweep) only where a cost/key moved, vs FINAL RETUNE TARGETS | Yes: sees live chart | tests/treedata.test.mjs, tests/treerelease.test.mjs (unchanged ids) |
| Q8 Phone/a11y/security/docs | Real-phone checklist, keyboard path, screen-reader line | `npm audit`, hostile saves, fit-audit, docs; post-ship snapshot only after ship | Yes (merge) | fit-audit, tests/treescreen.test.mjs |
New verb content (6) is outside Q0-Q8. File names above were listed from tests/; exact assertions confirmed when each chunk starts.

## 9. Pacing: METHOD (E3/E7 fix) plus provisional numbers
Method (Q0, replaces scripts/gates-pace.mjs for this purpose, which still models Wolves+Orbit start with `tree: null`):
1. Starter pick distribution: all 5 spirits x 2 heroes (equal weight; also report Wolves-start and Bolts-start separately). Start state via the real `grantStarter` path.
2. Greedy tree purchases: after each run spend gold/shards/Dawnglass on the cheapest affordable, condition-met node, with the tree applied to the next run (power grows, win rate follows FINAL RETUNE TARGETS bands).
3. Human factor 0.75 on kills/gold/clears; 32+ journeys per cell; seeds reported.
4. Kills by enemy type from `stats.killsByEnemy` (not a 1/3 split). Shared keys modelled as shared: Kindred Start opens on ANY of {4,500 crows, 1,500 crawlers, Treant x2}; Deep Dusk gate and Last Light share `clearChapter cursed_forest`.
5. Report p25/p50/p90 run number per landmark, max gap, and gaps counting a diamond-tier reward in between. Aim (to be asserted in Q0): no gap > 5 runs before run 30 and > 8 after; failures name which reserved slot (6) fills them.
Provisional (do not treat as fact; old v1 row timings are NOT carried over): Kindred Start and the first-win pair (Deep Dusk gate + Last Light) likely open early, not at runs 10-13; crawlers are scarce (economy sheet ~190 per bot run, so Bolts and Chain Lightning land much later than v1 said, Ravens earlier); the Deep Dusk wall (first clear ~27-35 runs human, over its 15-25 target) and runs ~36-50 are the real dry stretches and are a balance matter, not solved by layout. Shards (43 total, ~9 Treant kills) are the long pole for shard-priced landmarks.

## 10. Flow, hero panel, Almanac, in-run link
- Flow: Title -> tree home -> Play -> (new profile: starter pick, once) -> map/night step only if a choice exists (FD4) -> character -> spirit (explicit, none preselected on first pick, remembered `lastLoadout` per hero preselected; no weapon shown on hero tiles) -> run -> results -> Continue flies back to the tree. The hero panel on the tree home is a shortcut to the same two steps, not a replacement; Play still runs the 3-step loadout.
- Characters page (Bond badge/bar, action skill, five Bond gifts, keepsakes, wardrobe) STAYS its own page, reached from the hero panel and the floating tabs; the tree home shows only portrait, name, Bond level. Heroes wake by keepsakes (CHARACTER SYSTEM v2), NOT by tree landmarks: sleeping heroes on the swap row show a silhouette with their keepsake hint, no tree gate. v1's "locked heroes -> landmark" is removed; hero trial lantern (reserved) is cosmetic only.
- Floating tabs: "Home" is the tree tab in the tab row; wording in docs updated from "pill row".
- Almanac sync: tile enemy picture/count read `stats.killsByEnemy` and the Almanac entry `f:<id>` (existing ENTRY_KEYS, 65 entries, no new key); unmet foes are silhouettes as in the Almanac; a test asserts tree count == Almanac count for every killEnemy/bossKill condition. Link opens the Almanac entry and Back returns to the same tree camera.
- Results "what moved": the Next-lights component takes (save before run, save after run, run record) and shows: tiles newly lit or now affordable (pulse), progress bars that moved (+kills, +wins), nearest 3 unlocks. Same component on pause and death screens (read-only, no flying camera there). Inputs are plain numbers and node ids; text via textContent.

## 11. Open questions for Matt (max 3, most blocking first)
1. Spacing: accept the Q1 "scale draw size to neighbour distance, keep positions" compromise now and the 1.6x landmark gap / larger web in Q4 (Recommended), or keep the old 2.6x = 200 gap (wider web, bigger Q4)?
2. Tree restart at Q4: ship the re-layout WITHOUT a reset (Recommended, ids and prices unchanged, nothing lost), or include the refund-everything reset when new landmarks land (only worth it if Q0 shows existing prices need changing)?
3. Cheapest-lantern fallback in 4: if Q0 shows a new profile cannot afford Second Glance after run 1, pulse the cheapest affordable node instead (Recommended) or give new profiles starting gold (an economy change)?

Fit check: stone-and-lantern look, A3 medallions from the game's own rigs and the "restore the Hollow" identity stand; mechanically only display, ordering and existing unlock keys move in step 1, no new power, heroes still wake by keepsakes and no hero-weapon pairing is shown; LOCKED rows touched are listed in 1 and reopen only with Matt's yes.
Security check: docs only. Planned: one new hint bit (HINT_COUNT 14) via sanitized hints with hostile-save tests; `notes.loadout` re-validated against hero/weapon whitelists; `medallion` ids allow-listed against a bundled manifest (no paths from tree strings); all banner/tile/result text via textContent; pins already sanitized; no new dependencies; painted art needs provenance + CREDITS; `npm audit` in Q8; no secrets.

## 12. REORDER (Matt, 2026-11-02, after seeing the real Q1a screenshots)
Matt: Q1a "doesn't feel like the mock up at all". Cause: Q1a is a re-skin on the old ring layout (positions unchanged, plain coins, no branch colours, no hero panel). Since Matt accepted the one-time restart, the late-re-layout caution no longer applies. NEW ORDER after Q1a: R1 re-layout into spaced constellations (positions only: ids/prices/requires unchanged, so NO migration needed for this step; refund reset only when released prices change at Q7), R2 code-made medallion pictures (A3 allow-list), R3 branch colours + coloured threads + glow retune to the mockup level, R4 hero + companion left panel (shortcut panel; Play unchanged), then Q1b banner/tile/Next lights/first-light/tour, Q0 results, Q2 perf fixture (before R2 atlas sizing if needed), Q5 flow, Q6 regions, Q7 landmark promotion (+ refund reset if prices move), Q8. Target composition = docs/mockups/tree-v3 R3-bgB-carved-stone-night.png and R2-web-zoomed-midgame.png.
