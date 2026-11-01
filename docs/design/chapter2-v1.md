# Chapter 2 design v1 (DESIGN ONLY; nothing built, nothing locked until Matt picks)

Date 2026-11-01. Branch wip/design-chapter2. Follows CLAUDE.md rules (three options, fit, tree ships with content, code-drawn art, zero budget). Game name Wispwick; internal ids keep old prefixes.

## 0. Facts this rests on (repo)
- Chapter data: `src/data/chapters.json` (waves, events, minis, sites, bossId/bossAt, rootPatches). Ch1 boss Elder Treant `bossAt` 840 s, mini Branch-Mane at 200/420/690, 6 waves (wolf, crow, root_crawler, stoat_piper 180 s, puffback_toad 270 s, bramble_hart 380 s).
- NOT yet data-driven (CONTENT-GUIDE s5 KNOWN LIMIT): `Sim` defaults `chapterId` to cursed_forest; `src/world/zones.js` hard-codes `ZONE_SET`/`ZONE_NAME` (set A Meadow, set B Deep Forest Floor); `src/gfx/arc.js` and codex naming are Ch1-only. LOCKED EXTENSIBILITY (2026-10-17) wants per-chapter art/ARC/palette as data. Chunk C0 below does this first.
- Tree: `src/data/tree/chapters/cursed_forest.json` is an EMPTY fragment (`order 1, prefix c1, nodes []`): the slot exists, no precedent for nodes. Map select already shows "chapter thread 1 lit + 7 fogged '?'" (FD4).
- Tiers: Twilight / Deep Dusk / Long Night, per-chapter overrides in tiers.json. Sites are per-chapter (`sites` block, own RNG stream, OFF byte-identical).
- Ch1 enemy roles: wolf (fast chaser), crow (fast swarm), root_crawler (slow tank), stoat_piper (ranged), puffback_toad (burst bomb), bramble_hart (charger).

## 1. Research (short; web coverage of map staging is thin, see docs/research/30)
- COMMUNITY: Vampire Survivors stages differ by layout + wave table + one gimmick (Mad Forest plain, Inlaid Library walls, Dairy Plant hazards); later stages unlock by cheap conditions. Lesson: one gimmick per map.
- COMMUNITY: second zones in Brotato / Halls of Torment style games add new roles (ranged, summoners) rather than only HP. Lesson: new ROLES beat new numbers.
- OPINION: map 2 must feel different within 30 s (ground colour temperature, ambient motion, a new silhouette) yet keep the same identity. Ours: same lantern / colour-return idea, different thing the Hollow drained.
- OPINION: do not repeat Ch1 verbs (chaser, charger, bomb, ranged). New verbs: area slow, hop-rhythm, splitter, line sweep, thief.
- Repo perf rule (CONTENT-GUIDE gate): 350 enemies on the Low tier, LOWMEM profile (`src/gfx/memprofile.js`); ground is baked tiles, so new ground sets must fit the atlas budget and load lazily.

## 2. THREE OPTIONS (Matt picks; recommended first)

### Option A (Recommended): HUSHBELL HAMLET (snowbound village that stopped ringing)
- Pitch: a buried hamlet where the Hollow took the sound as well as the colour. Snow, dead bells, black windows. Where your spirits pass, snow melts to wet earth, then crocuses and warm window glow bloom.
- Mood: Warm Lantern at its strongest. Cool blue-white world, so the gold lantern pool and spirit trails pop hardest. Quiet, spacious, bell-tolling music.
- Colour-return (life map): life 0 = flat blue-grey snow; rising life = snow thins to teal-brown thaw, then pale snowdrop dots and amber tint on cottage windows and bell-posts nearby; corruption (negative) = black ice cracks with frost veins (the `hollowmarks` vein idea). Same LifeMap, new ramp only.
- Palette (role tokens, `src/gfx/palette.js`): snow `#cfd8e6`, shade `#8fa2bd`, thaw earth `#4a4a52`, bloom `#f3e2a0` (one bloom colour early, pink `#f0a8b8` later), corruption `#1b1e2b` with ice-teal `#6fb7c4` glints. Gold stays reserved for evolutions.
- Ground: set C "Snowfield" (soft wind-drift noise, low frequency so the atlas stays small), set D "Cobbled Lane" (road under snow). 3x3 zones: Bell Green (start), Chapel Ruin, Frozen Pond (decor only), Orchard Row, Mill, Graveyard, Lane N, Lane S, Drift Wall (edge band). Props: bell-posts, snow-capped cottages (decor, no collision), bare birches, firewood, ruined well.
- Enemies (5, own silhouette; rigs in `src/gfx/husk`, tells in `enemytells.js`):
  1. Frost Hare (`frost_hare`): fast hopper, 3-hop bursts then a pause; pale, long ears, amber eyes. Role: dodge-rhythm chaser (unlike wolf's constant chase).
  2. Bellwraith (`bellwraith`): floating hollow bell. Every ~6 s it TOLLS: expanding ring (0.8 s tell) that slows the hero 25% for 1.5 s, no damage. Role: area denial; the ring is the readable verb. maxAlive 3.
  3. Snowdrift Mound (`drift_mound`): slow white lump, tanky; on death splits into 3 `drift_pup`. Role: splitter / crowd texture.
  4. Icicle Stalker (`icicle_stalker`): tall thin stalker, stops at range ~220 and fires a straight ice-spike line (1.0 s ground line tell, then ~60 u wide). Role: line sweeper, must-react (ai reuses piper `keep` + hart `tell`).
  5. Lantern Thief (`lantern_thief`): small hooded sneak; runs to the nearest gem pile and steals it (1 s visible tell), drops it on death. Role: routing pressure, not HP. The ONLY new sim behaviour (ai kind "thief").
- Boss The Silent Bell (`silent_bell`), `bossAt` 840 for parity. Cracked bell-giant wreathed in frost. Verb: TOLL. Phase 1: slow walk, three tolls on a fixed rhythm (1.2 s ring tell, safe gap to dash through). Phase 2 (<50% hp): shards fall in marked circles (1 s tell) and a capped trickle of bellwraiths. Fairness as boss-treant-v1.md: no damage without a tell, one new thing per phase, capped adds, a heart always drops. HP in the Treant band, tune with `boss-sweep.mjs`.
- Mini-boss Frost Elk (`frost_elk`) at 200/420/690 (chest table shape of branch_mane, kind `alpha`): antlered charger leaving a decorative ice trail; at 50% it bellows and calls 4 hares (verb: charge + call, not roots).
- Map events: reuse all three, skin only. Lamp Posts -> Cold Bell-Posts (touch to ring a note, same reward table); Lantern Road stays (cobbled lane fits); Hollow Knot -> Frozen Heart (ice-root cluster, same burn-out verb). Zero new sim. Optional later (parked): Bell Tower, ring three bells in order within 20 s.
- Audio (code-made engine): sparse pad, high glassy intervals, soft bell with long tail, silence between waves as mood, wind bed. Signature cues `bell_toll_tell`, `bell_toll`.

### Option B: GLOAMWATER FEN (reedy marsh at night)
- Pitch: a flooded fen where the Hollow drowned the colour; wisp-lights float over black water and your spirits relight lily-pads and reeds. Ties well to the "wisp" name.
- Mood: deep teal-green with warm gold; frogs, drips, low drone.
- Life map: black mirror water; life shows colour in reflections, pads open, firefly dots; corruption = oily slick. Needs a reflective / rippling ground set (more bespoke code; animated shimmer costs fill rate on phones).
- Enemies: Reed Heron (ambusher), Mirelamp (false-light lure that bursts), Leech Swarm (splitter), Peat Wallow (slow tank, leaves slow puddles), a ranged bog piper. Boss Mere Warden (flooding tide, safe islands). Mini: Drowned Stag.
- Events: Marsh Lights, plank causeway, peat knot.
- Risk: highest art and perf cost (water, large dark areas hurting contrast).

### Option C: ASHEN ORCHARD (autumn orchard drained to ash-grey)
- Pitch: rows of grey apple trees; spirits restore blossom and fruit; scarecrow-king boss.
- Life map: bare branches bloom, grass greens, petals glow. Cheapest art (Ch1 forest tile pipeline with a new ramp and props).
- Enemies: Scarecrow (tank), Magpie (thief), Worm-in-Apple (splitter), Wasp Swarm, Hay Hound. Boss Harvest King (scythe sweeps). Mini: Hay-Bull.
- Risk: weakest differentiation (green, trees, "forest 2"), least wow, no new area-denial verb.

Scores (1-5, higher better): different from Ch1: A5 B4 C2. Art cost (low good): A2 B4 C1. Phone perf: A2 B4 C1. Identity fit: A5 B4 C3. New verbs: A5 B4 C3.

## 3. RECOMMENDATION: Option A
Biggest contrast with Ch1 for modest perf cost (low-frequency snow, no animated water); the colour-return idea reads in one glance (thaw then bloom); suits the planned Sister Agnes / Frost Bell hero; the boss gets a signature, phone-readable verb (toll rings). Fit check: same lantern / colour-return identity, restrained palette, code-drawn only. Mechanical sense: one new sim behaviour (thief); the rest reuses ai kinds (piper, hart, alpha, toad), sites and tiers. If Matt wants the cheapest safe option choose C; the most atmospheric, B.

## 4. Unlock, difficulty, balance
- Unlock: tree gate node in new fragment `src/data/tree/chapters/hushbell_hamlet.json` (prefix `c2`, order 2). Gate: defeat Elder Treant (Ch1 clear) on Twilight plus a modest gold price (mid-weapon-unlock band). No kill-count gate on the chapter itself. Map select thread tile 2 lights up with the standard unlock progress bar.
- Difficulty: the player enters Ch2 with a grown tree, so target the CLAUDE.md tree bands: mid-tree 30-55% win, maxed 65-90%; deaths no earlier than ~5:00, spread 6-14 min; boss rules as FINAL RETUNE TARGETS. Chapter harder via a per-chapter `hpMul` (start ~1.25) in the tiers.json override, no new tier math. Nights inherit the tier template; Deep Dusk / Long Night unlock via c2 gate nodes.
- Reward: first Ch2 clear pays shards like Ch1 (`bossShards` 5).
- Wave sketch (data): hare 5 s, drift_mound 40 s, bellwraith 90 s (maxAlive 3), icicle_stalker 150 s (maxAlive 4), lantern_thief 220 s (maxAlive 2); no Ch1 enemies reused (no recolours); frost_elk 200/420/690; arc events of hares at 60/240, mounds at 150; boss 840.

## 5. ARC-as-data: data vs code
DATA (new): `chapters.json` entry `hushbell_hamlet`; `enemies.json` 5 enemies + boss + mini + pup / shard spawns; zone table (names, sets) moved from `zones.js` into the chapter entry; palette ramp + life-map ramp; ARC (dusk to dawn lighting) per chapter; tree fragment; codex entries; tiers override.
CODE (new, bounded): C0 refactor (zones / arc / codex read the chapter entry; Ch1 stays default and byte-identical); ground sets C and D in `groundtiles.js`; props in `propatlas.js`; 5 enemy rigs + boss rig; `enemyai.js` thief kind; boss fight block (tolls, shards); toll-ring tell in `enemytells.js`; about 4 cues in `cues.js`.

## 6. Tree node group (Option A) + Almanac
Fragment `src/data/tree/chapters/hushbell_hamlet.json`, prefix `c2`. Tooling only: `scripts/tree-validate.mjs`, `gates-pace.mjs`, `gates-softcap.mjs`, `tree-ablate.mjs`, `tree-timeline.mjs`.
- `c2.gate` (unlock): opens Ch2 (Ch1 Twilight clear + gold price).
- Stat nodes (~1-3%, inside the soft cap and existing x2 ceiling, no new ceiling): `c2.frost` +2% pickup radius, `c2.thaw` +1.5% xp, `c2.warmth` +2% heart heal, `c2.hush` -2% ability cooldown, `c2.chime` +1% area. Confirm with `gates-softcap` and `tree-ablate`; a breach is Matt's decision.
- Kill-count unlocks tied to new foes (gates-*.mjs counters): `c2.hares` 300 hares; `c2.tolls` 150 bellwraiths -> tool "toll-resist" (-10% slow time); `c2.thieves` 60 thieves -> +25% gems when a thief dies; `c2.mounds` 200 mounds.
- Hidden node `c2.silence`: kill the Silent Bell without being slowed by a toll (codex flag); reward a bell-lantern wardrobe skin + 1 shard. Shown as "?" until first met.
- Night gates: `c2.deepdusk` (clear Ch2 Twilight), `c2.longnight` (clear Deep Dusk), per the DT tier template.
- Almanac / codex (`src/ui/codexcopy.js`, append-only keys per the E7 rule): 5 foe entries + boss + mini, each with name, one-line habit, a Tells line ("a ring grows: step out"), kill-count stages; Places tab entry "Hushbell Hamlet" with three staged lines (E7 pattern, `stats.sites` counters reused).
- Saves: ids and chapter progress keys are additive only; migrations test must pass; never rename existing keys.

## 7. Build order (small chunks; each ends with tests, build, security + fit line, then Matt reviews)
- C0 Data-drive the chapter plumbing (zones, ARC, palette, codex names read the chapter entry; no content). Verify: `npm test`, `sweep-all.mjs 24` identical for Ch1, `tree-validate`.
- C1 Chapter skeleton + ground sets C / D + zone map + props. Verify: true-size + phone shots, `?debug=1` perf on Low tier, `wl6-measure.mjs` contrast, LOWMEM memory check (lazy-load Ch2 sets).
- C2 Enemies, two batches (hare, mound + pups; then bellwraith, stalker, thief + thief ai). Verify: new `tests/<family>.test.mjs`, readability tests, `sweep-all.mjs 24`, `rt-matrix`, crowd read at 350 enemies.
- C3 Mini-boss Frost Elk. Verify: `boss-sweep.mjs`, chest tables, rt-matrix.
- C4 Boss Silent Bell. Verify: `boss-sweep.mjs` (kill time bands, fairness: no hit without tell), phone shots of the toll ring.
- C5 Map events skin. Verify: `tests/sites.test.mjs`, `sitebot.mjs` steering, rt-matrix sites OFF vs ON, OFF byte-identical.
- C6 Tree group + Almanac. Verify: `tree-validate.mjs`, `gates-pace.mjs`, `gates-softcap.mjs`, `tree-ablate.mjs`, `tree-timeline.mjs`, tree screen shots (desktop + phone), migrations test.
- C7 Audio (bell cues, music bed, hush). Verify: audio tests, cue levels.
- C8 Final balance: `rt-matrix` mid / max bands, `bless-sweep.mjs`, nights; report numbers with seed counts and noise (about +-7 points). Matt decides any band miss.
Estimated size: 9 chunks; C1, C2 and C4 are the large ones; roughly 1.5x Chapter 1's enemy work (Option B about 2x, C about 1x).

## 8. Risks
- Art cost: 5 rigs + boss + 2 ground sets; mitigate by reusing the husk kit / painter and keeping bodies simple and chunky.
- Phone perf: snow is cheap, but bloom on white can overdraw; cap particles from tolls and shards; Low-tier perf at 350 enemies; LOWMEM budget measured.
- Readability: toll ring must not clash with hero damage cues; contrast harness mandatory.
- Identity: no recolours of Ch1 foes.
- Scope / release: Chapters 2-8 are post-launch; build on dev, merge to main only with Matt's explicit yes.

## 9. Self-review (gaps, LOCKED conflicts)
- LOCKED conflicts: none found. Notes: (a) "chapters 2-8" are parked (LOCKED row 45) and post-launch per CONTENT-GUIDE, so this is design only and needs Matt's go before C0. (b) EXTENSIBILITY row requires the per-chapter data pass first (C0). (c) Tree ceiling already raised x2 (2026-10-20): Ch2 nodes must stay inside it. (d) Boss time: CLAUDE.md text says 10:00 but chapters.json has `bossAt` 840; Silent Bell uses 840.
- Gaps: bot does not model gem theft (add steer or balance reads easy); gem steal could feel unfair on phones (mitigated by the visible tell and drop on kill); toll slow vs hero ability dash (Pelt Dash / Sanctuary Ring) interaction undecided, settle in C4; music timbre of code-made bells untested; no new hero in this chapter (Wren / Elias only).
- Question for Matt: pick A / B / C; confirm tolls never damage even on harder nights (recommend: higher nights shorten the tell fairly but never remove it).
