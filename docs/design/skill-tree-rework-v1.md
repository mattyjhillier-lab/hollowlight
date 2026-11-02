# Skill tree rework v1 (design sheet, 2026-11-02)

STATUS: DESIGN ONLY. Nothing built, nothing locked here. Direction already locked by Matt (LOCKED rows "SKILL TREE REWORK DIRECTION" and "TREE BACKGROUND + SPACING"). This sheet needs: independent review, then Matt's three picks (section 4) and lock, then build chunks T0..T9 (section 6).
Sources: docs/research/33, 34; docs/design/skill-tree-v2.md, front-door-v1.md, difficulty-tiers-economy-v1.md; src/meta/ (treedata, tree, treelayout), src/data/tree/, src/ui/treescreen.js; mockups docs/mockups/tree-v3/R2-*, R3-* (illustrative only).
Facts below marked MEASURED come from this session's runs; ESTIMATE means a model with the method stated; UNVERIFIED means I did not check the code.

## 1. Scope

### 1.1 What changes (and what it reopens)
| Area | Change | LOCKED row touched | Reason |
|---|---|---|---|
| Home screen | The Lantern Web becomes the home every menu hangs off; the Home tab of the pill row (MENU CHROME 2026-10-30) opens it | "MENU CHROME + LANTERN WEB PHONE REDESIGN" (Home tab), "Front door" + "FRONT DOOR 2026-10-23" (flow cover -> play -> profile -> hero -> map -> run) | Matt said yes 2026-11-02: one place, one goal list, tree feels part of the game |
| Flow | Title -> tree home -> Play -> (map + night card only when there is a choice, as FD4 built) -> run -> results flies back to the tree | FD4 map/night screen is kept as the step after Play, not removed | Hero choice moves into the tree panel; chapter and nights become landmarks |
| Look | Round-2 look: one dense web, 3 node tiers, carved stone night background | "Lantern Web v2" (2026-10-18) look and structure lines: rings, per-weapon constellations stay as regions; the sky/dusk ring layout becomes metadata (see 3.2) | Tree felt flat and dark (research 33) |
| Goals | One goal list: "Next lights" | "TREE PULL PRINCIPLE" goal tracker (pin up to 3 goals) is kept: pins first, then closest unlocks, same source `closestUnlocks` | Replaces the Goals drawer, the map-card nudge and the results goal strip as separate lists |
| First buys | Free first lantern, then option landmarks spread over the tree | Progression-gates-v1 prices of `gt_ghost_wolves` / `gt_holy_orbit` (150 gold + 2 runs today) | Matt: first buys must be exciting |

### 1.2 NOT touched
- Save format, node ids (append-only), tests/fixtures/tree-released.json, free respec, hidden evolution recipes (seals stay veiled; the condition tile never names a recipe), the soft cap and tree budget (src/meta/treebudget.js), the balance bands (LOCKED FINAL RETUNE TARGETS), hero/weapon/evolution data, the sim.
- Rework adds DISPLAY metadata and new nodes only. A cost change is allowed on at most one existing node (the free first lantern, 3.1) and goes through the pacing check.

## 2. Specification

### 2.1 Node tiers, sizes, zoom rules
Sizes at NEAR zoom 1.0 (ratios read off R3-scale-zoom-levels.png; px are logical, multiplied by the existing Menu-size factor `uk`).
| Tier | What | Diameter | Notes |
|---|---|---|---|
| Landmark medallion | weapons, evolution seals, heroes, chapters, nights, tools (Almanac, Satchel, Wardrobe, Night gate, Card fan, Hearth key), far-fog landmarks | 76 | gold rim, art inside, name below, progress ring; drawn at every zoom |
| Choice diamond | keystones / branch choices, masteries | 26 | state colour fill; label from MID |
| Filler dot | the many small stat nodes | 9 | no label at any zoom; hover/tap shows the banner |
Zoom (reuses `view.lod` far/near thresholds in treeview.js; values UNVERIFIED, new threshold keys go there):
| Zoom | Shows | Labels |
|---|---|---|
| FAR (<= ~0.25) | landmarks only (as 22 px dots+glyph), region names, thread backbone between regions, dim "Far Hollow" fog | region names + landmark names for lit/next only |
| MID (~0.5) | + diamonds, region constellation outlines | landmark and diamond names |
| NEAR (>= ~1.0) | everything incl. filler dots | all names, costs on hover |
Rules: a node is never drawn smaller than 22 px (landmark) / 10 px (diamond) / 4 px (dot) on screen; landmarks never overlap (centre gap >= 2.6 x medallion diameter = ~200 world units; diamonds >= 40; dots >= 18, which is today's `v2MinGap`). The existing `layoutIssues()` in src/meta/treelayout.js is extended to enforce the new gaps (it already checks overlaps; new keys live in core.json `layout`). Hundreds of nodes: a region holds at most ~12 landmarks and ~60 small nodes so one region always fits a phone screen at MID.

### 2.2 Regions
A region = one cluster / hero / chapter / tool fragment already in src/data/tree/ (five weapon clusters, tools, chapter, heroes). Each gets a `region` record: name, colour accent, centre, backbone thread to the hub. Hub = central lantern emblem. Regions today (MEASURED, 163 nodes: ring 79, knot 38, socket 13, bead 12, key 6, heart 5, mastery 5, teaser 3, gate 2): the two core rings (Hearth, Wick) become the "Home Hearth" region around the hub. New chapters add a region each (ring `fog`/`far` of core.json is the extension point). Region names are drawn engraved on the stone at FAR and MID.

### 2.3 Background: carved stone night (locked)
Code-drawn, baked once to an offscreen canvas at load (not per frame): dark blue-grey stone wall with chiselled block seams, concentric runic rings per region that glow gold in proportion to nodes lit in that region, moon haze top-left, vignette. Lit state is a cheap additive overlay per region (one alpha per region), not a redraw. Toned-down medallion glow (max 40 percent of round-2 mock). Colour returns with progress: region tint saturation = lit fraction (grey-blue -> its accent). Calm motion: no animated mist; glow changes by fade only.

### 2.4 Hero + companion panel (left)
- Last-played hero, large, standing in a lantern-light spot; hero name + title; Bond level; below it the hero swap row (small portraits, tap to swap; locked heroes shown as silhouettes with their landmark as the way to open them).
- Companion slot: a reserved framed area beside the hero. Until companions exist it holds a soft glow spot (R3 variant C). When companions land (docs/design/companions-v1.md) the slot renders the companion rig through the same medallion/rig path; no layout change.
- Buttons: Play (primary), Almanac, Goals (opens the full Next lights list), Back (title). Currencies: gold, shards, Dawnglass (Dawnglass hidden until first Deep Dusk, existing rule).
- Phone portrait: panel collapses to a header strip (portrait + hero name + Play + currencies), swap row and Goals under a bottom sheet.

### 2.5 Name banner + condition tile
Hover (desktop), selection or long-press (phone) shows: brass-cream banner with the node name; below it the condition tile: what it does (one plain line, existing `desc`), cost, and the unlock condition with real progress (from `conditionProgress`). When the condition names an enemy (`killEnemy`, `bossKill`) the tile shows that enemy's picture (same Almanac portrait rig), the live kill count and a "See in Almanac" link to the existing entry (`f:<id>`); if the foe is not yet met it is a silhouette, as the Almanac shows. When the condition names a map or night: a small map thumbnail + night glyph. Hidden-recipe seals stay "???" and never show a recipe stat. Tree and Almanac read the same stats, so counts always agree.

### 2.6 Next lights (the single goal list)
Three tiles at the foot of the web (bottom sheet on phone): pinned goals first, then `closestUnlocks(..., 3)`. Each tile = medallion + name + progress bar + "Go" (pans the camera). The same component is reused by results ("what moved") and the Goals button. Removed as separate lists: Goals drawer content, map-card next-light nudge, results goal strip (they render this component). Pacing rule kept: after a run something is affordable or nearly so (checked in the pacing chart, section 5).

### 2.7 First visit: tour + free first lantern
First open of a new lantern: camera starts at FAR for 1.5 s then eases to NEAR on the hub; one lit hub, one pulsing medallion (the free first lantern, cost 0), three dim landmark silhouettes and Next lights. 3 whisper plates (existing whispers ladder, one new hint bit, append-only): "Light a lantern", "Landmarks open new things", "Zoom out to see the Hollow". Skippable, Calm = fade only. Free respec stays.

### 2.8 Unlock juice
Beat (0.15 s freeze-frame hold), thread pulse travelling hub to node (0.6 s), medallion fills with colour, camera eases to centre it (not under Calm), region rune glow steps up, region tint saturation rises, "What changes in your next run" line (reuses `desc`). Sound: one new code-made "lantern lit" cue (no licence issue); landmarks get a longer chord than diamonds; dots a tick. Rate limit: max one full celebration at a time, queued, skip on tap.

### 2.9 Navigation flow
Title (cover + lantern chip) -> Tree home (hero panel, Next lights) -> Play -> map + night card only if more than one night/chapter is open (existing FD4) -> run -> results (one screen, night badge, rewards) -> "Continue" flies the camera back to the tree and pulses the newly lit/affordable stars. Almanac, Settings, Character stay in the pill row; every screen has a Home tab back to the tree. Esc from tree = title. Profile chip stays on the title (FRONT DOOR pick 1).

### 2.10 Phone layout and targets
- Every tap target >= 44 px: landmarks and diamonds expand their hit area to 44 px; filler dots (9 px) use tap-to-zoom: first tap zooms and centres on the dot's neighbourhood until nodes are >= 44 px apart, second tap selects. Long-press = banner.
- Node strip/banner docks at the bottom (existing compact strip, tree-phone-v1 option A). Two-finger pinch + drag exist; add double-tap = zoom step. Safe-area `--sa-*` frame reused.
- Panels never cover the web by more than ~35 percent of height on phone portrait; collapsed state is the default.

### 2.11 Accessibility and Calm motion
Calm: no camera ease, no pulse travel, fades only (matches whispers and other screens). Keyboard path unchanged (arrows pan, + - zoom, N next lantern, Enter light, Esc back) plus Tab through Next lights and hero swap row; screen-reader live line on each unlock; colour is never the only state (glyph + ring pattern; reuse protan/deutan checks); text sizes Large/Larger must not clip banner or tile (existing fit-audit at three text sizes).

### 2.12 Performance budget
TARGETS (not measured yet): tree draw <= 6 ms JS per frame desktop and <= 12 ms on a mid phone at ~300 nodes MID zoom, no frame over 50 ms on pan/zoom; background baked once; medallions baked to an atlas lazily (max 4 per frame, labelled in the `?perf=1` long-frame list); FAR draws landmarks only (batched per colour, as today's far dots). Measure with the existing `?perf=1` probe (src/gfx/probe.js) and `scripts/pace.mjs`-style runs; a 300-node synthetic fixture (T7) is the test bed. Failing the budget blocks the chunk.

## 3. Data and save impact

### 3.1 Data
- Append-only ids; no id renamed or removed. tests/fixtures/tree-released.json stays valid; at the launch merge `node scripts/tree-release.mjs --snapshot` is re-run after the new nodes exist (Claude, with Matt's yes).
- New display fields on existing nodes (optional, validated, ignored by costs/effects/budget): `tier` ("landmark" | "diamond" | "dot"; default derived from `kind`), `medallion` (art key), `region` (fragment owner). Derived defaults mean untouched nodes keep working.
- New landmark nodes = new JSON in the owning fragment (src/data/tree/clusters|tools|chapters|heroes), new ids with the fragment prefix, `requires` to keep the tree connected (connectIssues). Region/medallion metadata = a `region` block in each fragment (name, accent, thread), read by composeTree. A new hero/weapon/chapter still needs no code, as TREE-GEN1 proved; this sheet keeps that promise (checked by the synthetic `--extra` fragment test).
- Costs: the free first lantern changes `gt_ghost_wolves` gold 150 -> 0 (`runs:2` condition replaced by "after run 1"?). UNVERIFIED how `unlock:{t:"runs",n:2}` interacts with a free node; check in T5. One existing node cost change = one economy line (-150 gold, immaterial vs 125,960 total) and a note in LOCKED.
- Real totals now (MEASURED from loadTree): 163 nodes, 125,960 gold, 43 shards, plus Dawnglass nodes.

### 3.2 Layout
core.json `rings` (hearth 150, wick 300, heroes 450, sky 600, dusk 960, fog 1180, far 1280, bands 1600+) are the current radial layout. Rework keeps node `pos` of existing nodes unless a spacing rule fails; moves go through the existing "moved" fixture (tests/fixtures/tree-t3b-moved.json pattern) so saves never break (positions are not saved; ids are). Landmark spreading adds new ring radii for new landmarks only.

### 3.3 Codex and saves
- ENTRY_KEYS (src/meta/codex.js, frozen, ~76 used of 256): tile enemy links use existing `f:` keys; new keys are appended only when new heroes/places exist (own `codexBit`). No reorder. Nothing in this sheet needs a new key by itself.
- Migrations: NONE for the rework as specified (display metadata and new nodes only; unknown ids are already tolerated forward). New save fields: one hint bit for the tour (existing validated `hints` integer, append-only) and, if not already stored, the last-played hero id on the lantern (UNVERIFIED whether the profile already stores it: check; if missing it is one validated string, whitelist of hero ids, with hostile-input tests). Both go through sanitize; no innerHTML from saved strings.

## 4. Options (Matt picks one per letter; recommended first)

### 4A. Medallion art
| | A1 (Recommended) Generated from game art + code-drawn emblems | A2 AI-painted medallions for the biggest landmarks | A3 Hybrid, staged |
|---|---|---|---|
| Fantasy | Every landmark is a gold-rimmed lantern-glass coin showing the thing itself: the hero portrait, the enemy, the weapon's summon, the night's moon | Hand-painted-looking art for ~12 big landmarks (weapons, heroes, chapter, nights) | Ship A1 now; later repaint the top landmarks as pictures drop in |
| Look | One family: same rig renders as the game, so a medallion matches what you play; emblems (moon, bolt, ring, lantern) in the same ink/shade recipe | Richer and more varied, but a style-drift risk against HOLLOWLIGHT STYLE v1 (tinted outline + soft shade) | A1 look at launch, painted upgrade for 8-12 landmarks, same frame |
| Numbers | ~45 medallions at launch (5 weapons, 15 seals, 2-3 heroes, chapter, 3 nights, 6 tools); then +1 per new landmark automatically; baked atlas ~1-2 MB at 128 px | ~12 images x (generate, curate, licence-check, retouch); RTX 3060 local model assumed, UNVERIFIED | A1 plus 8-12 images later |
| Risks | Looks "systematic", less wow per coin; small portraits need a tight crop for readability | Provenance/licence file per image (CLAUDE.md asset rule), consistency review, never an artist's style; repaint cost each new hero/chapter; biggest schedule risk | Two art states to maintain; mismatch if only some are painted |
| Scope | Medium (a medallion renderer + 3 emblem sets); no external assets, no licence work | Large | A1 + a data override path (`medallion` = image key) built now, images later |
Recommend A1: free, consistent, scales to hundreds with no new art per landmark, no licence risk; the `medallion` key keeps A3 open.

### 4B. Exciting option landmarks (candidate SETS of 8-12; cadence in section 5)
Rule for all sets: nothing adds raw power beyond the soft-cap budget; every landmark is an OPTION (new verb, loadout, hero, map, night), each a different unlock key. New in-run effects still go through their own "three options" pick when built; the set only fixes slots, keys and rough costs.
| | Set A (Recommended) "Promote what already exists" | Set B "Existing + new verbs" | Set C "Hero trials" |
|---|---|---|---|
| Fantasy | The big options the game already has become the landmarks you chase | A + 4 new reasons to play: Starting Synergy (Matt's parked idea), Lamp-lighter (see lamps early), companion egg, a hero trial lantern | Every landmark asks you to try a different hero/weapon/night; options are loadout and cosmetic |
| Landmarks (unlock key, rough gold) | 1 First Lantern (run 1, free); 2 Second Glance reroll (gold 150); 3 Holy Orbit (2 runs, 150); 4 Lightfoot Pack seal (evolve wolves, 100); 5 Spirit Bolts (1,500 crawler kills, 300); 6 Raven Flock (4,500 crow kills, 200); 7 Deep Dusk gate (clear Twilight, 1,200 + 2 shards); 8 Last Whistle auto-ability (survive 5:00, 1,050); 9 Kindred Start (kill counts, 1,500); 10 Chain Lightning (Treant x2 + crawlers, 500); 11 Lantern Blessing (15 blessings, 1,800 + 2 shards); 12 Long Night gate (clear Deep Dusk, 2,500 + 4 shards + 10 Dawnglass) | A items 1-8 + 10 + 12 plus: Starting Synergy (hero level 5, ~1,200), Lamp-lighter (survive 8:00, ~900), Companion egg (clear Twilight with each hero, shards 3), Hero trial lantern (win with each hero, ~1,500) | 1 First Lantern; Elias's trial (win with Wren), Wren's trial (win with Elias), one per weapon (evolve it x3), start-with-any-weapon (win with both heroes), Wardrobe set, Long Night via Deep Dusk clear with each hero |
| What it changes in a run | Reroll/banish, which weapons exist, 4th/5th card slots, auto-ability, a free kindred start weapon, revive: real choices, all balance-checked already | A + new small hero-flavoured bonuses and map help: more variety, more new design | Mostly loadout and look: low power, lots of replay across heroes |
| Balance | Zero new power: every node is already inside the budget and sweeps (RT1-RT8 done); re-sweep only for the one cost change | New effects need ablation + sweeps against fresh 15-30, mid 30-55, max 65-90 and the Wren/Elias gap | Almost none; risk is trials gating power behind heroes the player dislikes |
| Spread | 12 landmarks over ~60 runs, one per 3-5 runs after run 10 (see 5) | 16 over ~70 runs, tighter but needs content built first | Even cadence, but several keys cluster at "win with X" = lumpy |
| Risk | Several keys are kill counts that fire together in the first 15 runs (estimate), so the middle can feel dry (5.2) | New content cost before launch of the rework; each new piece needs its own three-option round | Excitement is lower (cosmetic/loadout); first-hour buys feel weaker |
| Scope | Data + display only | Data + new sim content + sweeps | Data + conditions + a few cosmetics |
Recommend Set A now, with Set B's four new verbs queued as LATER content (each its own three-option pick) so the tree grows without delaying the rework.

### 4C. Build phasing
| | C1 (Recommended) Visual first | C2 Flow first | C3 Landmarks first |
|---|---|---|---|
| Order | T0 pacing, T1 stone + sizes + spacing, T2 banner + tile + Next lights, T3 medallions, T4 home flow + hero panel, T5 first visit + unlock juice, T6 regions/zoom names, T7 scale fixture + perf, T8 landmark promotion (Set A), T9 phone pass + review | T0, home flow + hero panel, banner, then looks | T0, landmark data + conditions first, visuals last |
| Earliest wow | T1 (same tree, new stone sky and tiers) | T4 | T8 |
| Risk | Visuals before flow: some screens look new before the flow does | Looks the same for weeks | Hardest to judge until the end |
Recommend C1.

## 5. PACING CHART

### 5.1 Method (ESTIMATE; to be replaced by measured output in T0)
- Income per run, human (0.75 x bot): MEASURED 6 bot runs today, starter profile, no tree: Wren defeats at ~11:40-12:30, ~2,280-2,480 kills, 2,408-2,652 gold, so ~1,900 gold per human run before any tree gold bonuses. Earlier economy model (difficulty-tiers-economy-v1 9.3): win ~2,700 / loss ~700 (older bot, different run profile), Deep Dusk win ~4,540, Long Night ~6,050. The 125,960 gold tree at ~1,900/run is ~66 runs flat; with tier income rising it lands around run 55-75 (the older 110,850-gold model said 64 human, 48 bot; scaled to 126k gives ~73 human).
- Assumed human gold per run: runs 1-25 ~1,900, 26-50 ~2,400, 51+ ~3,000. Landmark prices are a small slice (100-2,500); the player also buys diamonds and dots, so I assume ~60 percent of income goes elsewhere on the way: a landmark is affordable once cumulative income >= its own cost + ~40 percent of the path gold to it.
- Kill-count keys: MEASURED total kills ~2,300-2,480 per run, but the split by enemy type is NOT measured. ASSUMPTION ~1/3 each of wolves, crows, crawlers (~750 each) until T0 measures it; so 1,500 crawler kills = ~2-4 runs, 4,500 crow kills = ~6-10 runs, 10,000 wolf kills = ~13-18 runs, 20,000 crow kills = ~27-35 runs (a stricter run profile with more defeats lowers kills/run).
- Boss keys: Treant kill needs a win; fresh win rate 15-30 percent (locked band) rising to 30-55 mid tree; first Twilight clear ~3 (p90 7) runs, first Deep Dusk clear 27 (p90 38) bot / 35 (44) human, first Long Night clear 40 (47) bot / 51 (62) human (older econ model; later retunes may have moved these: T0 re-runs scripts/gates-pace.mjs).
- Shards: 5 per Treant kill (win), so shard-priced landmarks wait on wins.

### 5.2 Chart (Set A, human p50 estimate; gap = runs since previous landmark)
| # | Landmark | Key | Cost | Est. run | Gap |
|---|---|---|---|---|---|
| 1 | First Lantern (wakes Ghost Wolves) | after run 1 | 0 | 1 | - |
| 2 | Second Glance (Reroll) | gold | 150 | 1-2 | 0-1 |
| 3 | Holy Orbit | 2 runs | 150 | 2 | 1 |
| 4 | Lightfoot Pack seal | evolve wolves once | 100 | 2-4 | 1 |
| 5 | Spirit Bolts | 1,500 crawler kills | 300 | 4-6 | 2 |
| 6 | Deep Dusk gate | clear Twilight | 1,200 + 2 sh | 4-8 | 1 |
| 7 | Raven Flock | 4,500 crow kills | 200 | 7-10 | 3 |
| 8 | Last Whistle | survive 5:00 + path (sp_cd2) | 1,050 | 8-11 | 2 |
| 9 | Kindred Start | kills (any of 3) | 1,500 | 10-13 | 2 |
| 10 | Chain Lightning | Treant x2 + 2,500 crawler kills | 500 | 11-16 | 3 |
| 11 | Lantern Blessing | 15 blessings | 1,800 + 2 sh | 14-19 | 4 |
| 12 | Wall of Wings seal | evolve ravens + 12,000 crow kills | 400 | 16-20 | 3 |
| 13 | **reserved slot** (Set B verb or Lucinda) | own key | own | 20-24 | 4 |
| 14 | Fourth Card | clear Deep Dusk + 8 Dawnglass | 2,000 + 8 glass | ~27-35 | 8-12 |
| 15 | Long Night gate | clear Deep Dusk | 2,500 + 4 sh + 10 glass | ~28-36 | 1-2 |
| 16 | Fifth Hook | win Deep Dusk with 2 heroes | 3,000 + 3 sh + 12 glass | ~40-50 | 10-14 |
| 17 | Last Light revive (chapter clear) | clear chapter | 900 + 5 sh | any time after first clear (cheap, early) | fills gaps |
| 18 | **reserved slots x3** (Chapter 2 gate, hero, companion) | own keys | own | spread 36-70 | target 4-5 |
| 19 | Three Dawns / Dawnward (expert clears) | stars / Long Night clear | 1,000-1,800 + glass | ~45-60 | long tail |

### 5.3 Dry stretches (honest flags)
- Early cluster: runs 1-11 carry 9-10 landmarks (the locked "few early hooks"), but 4 of them share the same kill/evolve keys; if crawlers and crows turn out to be more than 1/3 each, Bolts and Ravens fall in runs 3-6 and the stretch looks even denser, with nothing between run ~11 and ~16.
- Dead zone ~runs 20-26 (after the cheap landmarks, before the first Deep Dusk clear) and ~runs 36-50 (before Fifth Hook): the economy model says first Deep Dusk clear is OVER its own 15-25 target at 27-35 runs (human). Mitigations in this design: reserved slots 13 and 18, promote cheap far-landmarks already in the data (Almanac pages, Card fan: "Louder Stirring", Hunter's Eye) into landmarks with long visible progress bars, and show the far dim landmarks so the wait has a face. None fix the length of the Deep Dusk wall itself; that is a balance matter (LOCKED, not reopened here).
- Shards are the long pole for slots 11, 15, 16, 17 (43 total = ~9 Treant kills).
- Aim (to be verified in T0): no gap above 5 runs before run 30 and 8 after, counting at least one diamond-tier reward in between. The chart is re-run with measured numbers before T1 starts; if gaps exceed the aim, T8 adds landmarks from Set B first.

## 6. Build chunks (small, one at a time; each ends with tests green + build, screenshots true-size + phone, perf probe, security, fit, update LOCKED/QUEUE)
| Chunk | What (visible result) | Done-check | Needs Matt's yes |
|---|---|---|---|
| T0 | Measure: kills per enemy type, gold per run, runs-to-landmark with scripts/gates-pace.mjs; final pacing chart in this sheet | chart with measured numbers and seed counts; gaps vs aim reported | No (read-only); Matt sees the chart with the picks |
| T1 | Stone background + tier sizes + spacing rules on the EXISTING tree (display only) | tests, tree-validate, layout gap tests, screenshots FAR/MID/NEAR at 1280x720 + 390x844, perf <= budget, ids unchanged | Yes: look review before T2 |
| T2 | Name banner + condition tile (enemy picture, Almanac link, kill count) + Next lights (one goal list) | tests; fixtures for each condition type; Almanac/tree counts equal; hidden recipes still "???"; fit-audit text sizes | No (follows locked look) |
| T3 | Code-drawn medallions for all existing landmarks (A1) | all ~45 render, baked atlas size, perf, colour-blind check, screenshots | Yes if picking A2/A3 art; else no |
| T4 | Home flow: title -> tree home, hero + companion panel, swap row, Play/Almanac/Goals/Back, results fly-back; map/night card as the step after Play | e2e flow tests incl. one-hero and no-night-choice cases; Esc/Home tab; profile chip unchanged; no save change beyond last-hero field | Yes: reopens the front-door flow |
| T5 | First visit tour, free first lantern, unlock juice + sound | tour bit test (hostile saves), Calm path, one new sound, cost change measured; snapshot test | Yes (cost change on one existing node) |
| T6 | Regions + FAR/MID/NEAR names, backbone threads, Far Hollow fog | screenshots, region fixtures, layout tests | No |
| T7 | Scale proof: synthetic 300-node fixture (via `--extra`-style test fragments) | draw ms targets met desktop + phone, `?perf=1` log, no overlap issues, 44 px targets verified | No |
| T8 | Promote the Set A landmarks (tier flags, thread/region placement, reserved slots) | pacing chart re-run (gates-pace.mjs), bot sweeps only where a cost moved, report vs bands and seed counts, no budget change | Yes: sees the live chart |
| T9 | Phone + accessibility + security pass, docs | real-phone check list (Matt), fit-audit, `npm audit`, tree-release snapshot at launch merge only | Yes (merge) |
New landmark CONTENT (Set B verbs, Lucinda, Chapter 2, companion egg) is not in T0-T9: each runs the three-options round first and then adds a fragment node.

## 7. Risks and weak spots
- Pacing numbers are estimates; the kill-type split and the 0.75 human factor are assumptions until T0.
- The Deep Dusk wall (first clear 27-35 runs, over target) is the biggest dry stretch and is a balance matter this sheet cannot solve; landmark spreading only dresses it. Flagged for Matt.
- Moving existing positions risks saves only if ids change (they do not) but can confuse returning players; keep moves minimal.
- AI medallions (A2) carry licence/provenance and drift risk; A1 may look systematic. A1's small hero portraits need a tuned crop.
- Free first lantern: a 0-cost node with a "2 runs" condition today (UNVERIFIED interaction); the first lantern could also be a hero choice instead of a weapon.
- Tap-to-zoom for dots adds a step on phone; needs a real-phone test (Matt).
- Performance on mid/low phones is unmeasured; the 300-node fixture may force fewer medallions per region or earlier LOD cuts.
- Hero panel: last-played hero storage UNVERIFIED; companion slot is a design stub until companions exist.
- Reopens menu chrome and front-door flow; tests from FD4/C1-C3 will need updating (not skipped).
- Reference photos were inspiration only; no frame, skull, web-thread, banner, art or text copied (our banner is brass-cream, threads are light).

## 8. Open questions for Matt (the three picks, most blocking first)
1. Option landmark set: Set A promote-what-exists (Recommended), B existing + new verbs, C hero trials.
2. Medallion art: A1 generated + code-drawn (Recommended), A2 AI-painted, A3 hybrid staged.
3. First lantern: Ghost Wolves free (Recommended; Wren's weapon, the pull of the first run) vs a choice between Wolves and Orbit; and phasing C1 visual-first is the default unless he says otherwise (reversible).

## 9. Checks
Fit check: Landmarks, medallions of the game's own art, stone-and-lantern background and region glow keep the Warm Lantern / "restore the Hollow" identity (docs/IDENTITY.md); mechanically it only reorganises display and uses existing unlock keys and the meta-progression principle (different nodes unlocked by different activities), with no new power; conflicts listed in 1.1 are the only LOCKED rows reopened, all inside Matt's 2026-11-02 yes.
Security check: docs only. Planned: new saved fields (hint bit, last-hero id) validated and whitelisted with hostile-save tests; no innerHTML from saved or tree-data strings (banner text via textContent); no new dependencies; art by code or licence-checked AI with a CREDITS entry; `npm audit` at T9; no secrets.
