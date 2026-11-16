# Companions v2: BUILD SPEC for Update B (rewritten in C0, 2026-11-16)
Branch wip/companions-c0 (off dev @ c8dbeda, Update A Lucinda LIVE on main). Replaces the 2026-11-15 draft (its option tables, the "milestone option A" evolutions and the old Bond tables are gone: they contradicted the locks). Source of truth = docs/LOCKED.md rows 2026-11-14/15; review = docs/design/companions-review.md (B1-B5, S1-S12, N1-N8). Where this sheet and LOCKED differ, LOCKED wins and this sheet is a bug.
Remaining open choices = numbered QUESTIONS (section 12). Everything else marked DEFAULT is Claude's reversible default (Matt may override).

## 0. Locked picks this spec builds (all 2026-11-15, Matt)
| Area | Locked | LOCKED row |
|---|---|---|
| Framework | companions grow with hero Bond between runs only; never hurt or lost; no run cards; Holy Orbit stays a weapon | COMPANIONS FRAMEWORK |
| Weapons | Ghost Wolves + Raven Flock leave the weapon pool; magic weapons = Spirit Bolts, Chain Lightning, Holy Orbit, Dragonfire Meteor, + 5th (wind tornadoes) in the SAME update | DECISIONS 1-3 (3), RELEASE SPLIT, SUMMONER BRANCH REPLACEMENT |
| Evolutions | ALL SIX wolf + raven evolutions RETIRED (no milestone versions; owners refunded via the tree step) | DECISIONS 1-3 (1) |
| Starter | one-time choose-your-new-spirit screen (free heart + first seal); Wren default = Spirit Bolts | DECISIONS 1-3 (2) |
| Bond | companion power REPLACES the Bond +5% damage row ("total power unchanged") | DECISIONS 4-6 (4) |
| Tree | 5 summons ring nodes retired + refunded with the wolf/raven nodes; area = wind weapon home with a teaser slot; 11 road nodes re-pointed to it; no companion stat nodes (Bond only) | DECISIONS 4-6 (5), SUMMONER BRANCH REPLACEMENT |
| Wren | Howie (data id `howie`, codex `p:howie`), job The Tracker, look Lantern Scruff; steps 5 gem fetch / 10 pawprint speed trail / 15 bite marks / 25 one howl per run staggers | WREN WOLF COMPANION JOB, TRACKER BOND STEPS, TRACKER PUP LOOK, PUP NAME |
| Elias | Flambé (player text keeps the accent; data id `flambe`, codex `p:flambe`), job The Wick, look Chamberstick; steps 5 faster ward / 10 ward flash pushes back / 15 re-light heals a little / 25 two ward charges | ELIAS COMPANION, WICK NAME, FLAMBE LOOK, FLAMBE BOND STEPS |
| Lucinda | Ophimber (`ophimber`, codex `p:ophimber` already reserved), job The Ember-spitter; steps 5 faster / 10 two embers / 15 Burn / 25 sparks on landing; ~5-7% of her power | FLAMBE BOND STEPS + OPHIMBER JOB, OPHIMBER BOND STEPS |
| Review fixes | release split (Update B = companions + retire + tree v6 + wind); Kindled Spirits re-pointed to companions; `ma_key` rewritten as magic +3% only | RELEASE SPLIT + REVIEW FIXES |
Reopened list: CHECKED, the entry exists (LOCKED "Reopened (with reason)", 2026-11-15 COMPANIONS REOPENS) and covers every item of review B5 (V1 scope, 15 evolutions, progression gates/starter, Bond rows, Wren kindred, magic-only branches, RT6-RT8 Ravens rows, Rally, wolf/raven titles). CLAUDE.md "V1 weapons" and "PROGRESSION DIRECTION" lines now point to it.
Shares (targets, measured not guessed): Howie ~5-8% of Wren damage; Flambé ~4-6% of Elias survival, zero damage; Ophimber ~5-7% of Lucinda power. All three also obey the budget rule in section 3 (it wins if the two disagree).

## 1. What leaves (C7 retire switch)
- `retired: true` on `ghost_wolves`, `raven_flock` (weapons.json) and on all six evolutions `phantom_stampede`, `howling_legion`, `dire_alpha`, `murder_storm`, `dive_bombers`, `spearhead` (evolutions.json). Retired = never offered (cards, gold cards, starter list, start weapon, tree heart), never granted by the tree, never a valid `?grant=`/`?auto=` start (ignored with a console warning; debug params still never write saves). Data and sim code stay one release for codex pages and Mara's later raven; a dated clean-up item goes to QUEUE.
- `balance.starter.weapons` = spirit_bolts, chain_lightning, holy_orbit, dragonfire_meteor (+ wind when it lands). Wren `kindred: spirit_bolts` (locked). Side effects to handle (review S9): tree landmark `h:wren` moves next to `c:spirit_bolts` (treedata.js); chars.js legacySeed/LEGACY_POOL drop ghost_wolves; bot.mjs `GATES=launch` and every script that relied on "Wren = wolves" pass explicit weapons.
- Saved loadout/starter that names a retired weapon: sanitiser falls back to kindred (no crash); the respirit flag (section 7) does the real hand-off. `stats.startWeapon` history is kept.
- Statuses (src/meta/status.js): `bleed` and `mark` lose their owners -> `owner: null` (like `pin`); their tree status nodes retire with the clusters. Validator test: no live node targets an ownerless status.
- Pelt Dash stays a no-damage dash for Wren herself; Howie's dash-line bites are companion damage (section 2).
- No mid-run migration is needed (nothing is saved mid-run, LOCKED).

## 2. The three companions (C2-C6). Starting numbers only; C2-C6 tune them to section 3
Common rules: one companion per hero, always present, untargetable, no HP; follows at the shoulder/heel; acts on fixed timers; reads only Bond (between runs) and the hero's in-run level for scaling; no tree node touches it (Kindled Spirits blessing is the only in-run boost, section 6). Data in characters.json `companion` block (id ASCII, numbers, caps); player text in copy files (Howie, Flambé with accent, Ophimber; never "the pup" alone: brand-style test).
Howie (Wren, The Tracker)
- Bond 0: every ~1.4 s bites the most wounded enemy within 90 u (grid query on a 0.25 s timer, ties broken by enemy id, no RNG); bite scales with Wren's in-run level so it does not fade late. On Pelt Dash he runs the dash line and bites each enemy Wren passed (cap 6 bites).
- Bond 5 Fetch: every ~8 s brings the nearest gem within 160 u to Wren (no RNG; nearest by distance then id). Shares the gem budget (not a magnet).
- Bond 10 Pawprints: while Wren moves, Howie leaves a short trail; Wren on it gains +4% move speed. Inside the existing combined speed cap (blessings cap 1.08 stays the ceiling for all temporary speed). Pooled, max 12 prints; off on Low/Battery saver visuals (effect stays).
- Bond 15 Mark: a bite marks the enemy 3 s: all damage to it +6%. Howie's own fixed numbers (not raven data, not scaled by tree nodes). Counted in his budget as mark uplift (review S4).
- Bond 25 Howl: once per run, staggers enemies within ~120 u for ~1 s (bosses and mini-bosses immune, like Pin). Trigger = QUESTION 2 (default until answered: automatic, the first time Wren's HP drops below 30%).
Flambé (Elias, The Wick), zero damage
- Bond 0: holds 1 ward charge, absorbs one hit (ward flash), relights after ~20 s. If charged when Sanctuary Ring is planted, the ring lasts +1 s (does not spend the charge).
- Bond 5 relight faster (~20 -> ~17 s); Bond 10 the ward flash pushes small enemies within ~40 u back ~24 u (bosses immune); Bond 15 each re-light heals Elias ~2% max HP; Bond 25 two ward charges (relight one at a time).
- Elias note: his max-tree win is already 96% (accepted miss, LOCKED DM10). Flambé must not lift it beyond noise: the lever is Flambé's numbers (charge count timing, heal), never the band. Bond 25 "two charges" is the likeliest over-budget step and is measured on its own.
Ophimber (Lucinda, The Ember-spitter)
- Bond 0: every ~4 s spits one ember at the densest group within ~220 u (grid cell counts, ties by cell index, no RNG); it leaves a small fire patch (~26 u) for ~1.5 s that ticks low damage. Patches pooled, hard cap 6.
- Bond 5 faster (~4 -> ~3.4 s); Bond 10 two embers per spit (second at the next-densest cell); Bond 15 embers apply Burn (section 4); Bond 25 each ember bursts into ~3 small sparks on landing (fixed angles, no RNG).
- Ophimber's Rise (her ability) is unchanged; the ember job is the between-ability job.
Bond `companion` notches (section 3) at levels 4/8/12/16/20/24 each add a small, capped potency step (Howie bite, Flambé relight speed, Ophimber ember damage), sized so the whole ladder fits the budget rule.
Hot path (review S8): target picks use the spatial grid on timers (no per-frame full scans, no O(n^2) cluster search); prints, patches, sparks and flashes pooled with caps; new rigs added to prebake; done-check = frame time at a 10:00 swarm under the 72/36/22 limiter.

## 3. Bond rewire + the budget rule (C6)
- `bond.cycle` becomes `[hp, ward, speed, companion]` (review S3): the `damage` slot is replaced in place, so every existing save keeps identical XP, level, HP, ward and speed at every level; `bond.total.damage` is removed; BOND_STATS gains `companion`. Perks at 5/10/15/20/25 are unchanged; the companion steps 5/10/15/25 sit beside them (Characters page copy reads one gift per level, review N7). Cap stays 25 (Chapter 2 owns the 25 vs 30/35 review).
- Flag `companions` (data, default off until C11): OFF = today's game exactly (Bond damage row active, no companion), ON = companion + `companion` notches, damage row gone. OFF is the paired-ablation baseline and keeps BASE runs byte-identical.
- BUDGET RULE (measured, review B2): at BOND = 0, 10 and 25, for each hero, paired runs (same seeds, 300 pairs, GATES=preset META matching the tier, random + focus bots):
  delta_companion = win(ON) - win(no companion, no damage row)  must be  <= delta_damageRow = win(damage row at that level) - win(no damage row)  + noise (1 SE of the paired difference).
  At Bond 0 the damage row is worth 0, so the Bond 0 companion must sit within noise of zero, unless Matt picks otherwise in QUESTION 1. Fresh Twilight bands (15-30%) must hold. Secondary measures: Howie damage share incl. mark uplift; Flambé hits absorbed + HP saved; Ophimber damage share; all inside their share targets.
- Elias reported on his own every time (survival converts to wins faster than damage).

## 4. Status ownership (so "Bond only" holds)
- Companions apply statuses at FIXED companion data values. Tree status nodes (Bleed/Mark/Burn potency or duration) never scale a companion-applied status.
- Burn is one shared status per enemy: if a weapon Burn (Orbit/Meteor, tree-scaled) and Ophimber's Burn both apply, the enemy keeps the stronger one (no stacking, no summing); refresh rules unchanged. So Burn nodes stay Orbit/Meteor power and never become companion power.
- Howie's Mark is his own data (3 s, +6%); with raven_flock retired nothing else applies Mark until Mara. Bleed: nothing applies it in Update B (`owner: null`).
- Kindled Spirits (blessing) is an in-run card, not a tree node, so it may boost companions (locked).

## 5. RNG and determinism rule (review S7), each a test
(a) Companion code never draws from `sim.rng`. Default: companions use no RNG at all (deterministic picks above); if one is ever needed it gets its own stream (pattern keepRng/markRng/siteRng, seeded from the run seed). (b) Flag `companions` OFF = byte-identical traces to BASE-0 for every hero and starter (hash test over a fixed seed list). (c) Same seed + same Bond = identical replay. (d) Fixed update order: companions step after weapons, before pickups. Note: with companions ON, later main-stream draws (drops, spawns) still shift because kills shift; that is expected and is why sweeps compare distributions, not seeds.

## 6. Tree v6 (C8): core.version 5 -> 6, one targeted step `retireSummons` (not a restart)
Retire + tombstone `{id, frag, idx}` + full refund of the price PAID (frozen v5 price x rising-price steps + shards, from a FROZEN table `tree-v6.prices.js`), free starter nodes excluded (frozen STARTER_V5 decides what was free):
| Group | Ids | n |
|---|---|---|
| Wolf cluster | gt_ghost_wolves, gt_phantom_stampede, gt_dire_alpha, su_call, wf_fang, wf_bite, wf_coat, wf_maul, wf_hunt, wf_third, wf_scent, wf_bleed, wf_rend, wf_lope, wf_kindling | 15 |
| Raven cluster | gt_raven_flock, gt_dive_bombers, gt_murder_storm, gt_spearhead, rv_talon, rv_quill, rv_wide, rv_glide, rv_eye, rv_watch, rv_oath, rv_wing, rv_kin, rv_beat, rv_peck, rv_kindling | 16 |
| Summons ring | su_bond, su_pot, su_swift, su_rush, su_key | 5 |
Total 36 ids, checked against the v5 snapshot in tests/fixtures/tree-released.json (Howling Legion has no gate node: it was the wolves' starter evolution). `su_call` is also removed from core.json `legacyIds`. Max refund for a full veteran about 18,460 gold + 5 shards before rising-price steps (exact = frozen table sum).
Changed in place (released ids, fingerprints change, covered by the v6 bump; owners keep them, no refund):
| Id(s) | Today | v6 (DEFAULT re-roots; C8 layout shots confirm) | Why |
|---|---|---|---|
| Holy Orbit road or_way1-3 | road `from: su_swift` (holy_orbit.json:752) | `from: li_hoard` (nearest live Wick-ring node, i17) | B1: Elias's kindred road must stay reachable |
| Deep Dusk road df_way1-6 | `from: su_pot` (nightgate.json:206) | `from: sp_dur` (Wick i7) | B1: night gate reachable for new players |
| tz_marsh | requires su_key | requires li_vow (stays on the old summoner side) | B1 |
| br_satchel | requiresAny [su_pot, li_coin] | [li_regen, li_coin] | B1 |
| br_almanac | requiresAny [ma_cast, su_rush] | [ma_cast, li_hearts] | B1 |
| ma_key Unbound Light | magic +3%, summons -3%, excludes su_key | magic +3% only; `excludes` removed (owners lose nothing) | B4, locked |
| Roads wf_way1-6, rv_way1-5 | lead to gt_ghost_wolves / gt_raven_flock | kept, owned, effects unchanged; both roads now END at the permanent teaser `tz_wind` | locked re-point, once only (S6) |
| Rings Hearth + Wick | holes at hearth i3, wick i8/i11/i19 + keystone spot | re-laid (decision 5): remaining nodes spaced evenly on their ring; `place` is not part of the fingerprint (C8 verifies; if it is, the hash change rides the same v6 bump) | locked |
Permanent teaser id (review S6): `tz_wind`, a core teaser node (namespace tz, kind teaser, next free idx, `requiresAny: [wf_way6, rv_way5]`, placed at the old wolf heart spot, dashed like the Meteor teaser, unlock text = the wind spirit waits). It is NEVER retired or re-pointed. When the wind weapon is built its heart `gt_<windId>` is additive: same spot, `requiresAny: [wf_way6, rv_way5]`, and `tz_wind` hides once the heart composes (as the Meteor reserved slot gave way). Test: adding the wind cluster changes zero v6 fingerprints (like DM10's 283 unchanged), so there is no v7 step.
Reachability test (B1): after v6, every live non-teaser node is reachable from the root with no retired id on any path, for a fresh save and for a v5 veteran save. tree-validate + treerelease guard green.
Migration code: `src/meta/migrations/tree-v6.js` + `tree-v6.prices.js` (frozen v5 rows for the 36 ids + V5_IDS forge guard, same shape as v5). Pure, idempotent, untrusted-input safe, never reads live data. A tree owning a v6-only id never replays the refund. Newer-version saves stay read-only (H1).
Fixtures (tests/fixtures/saves/, one test each): 1 v5 Wren wolves starter, only the free heart; 2 v5 raven starter (heart + Talon seal free, not refunded); 3 full veteran, all 36 ids with rising steps + shards: refund = frozen sum, roads still owned; 4 Elias Orbit starter who never touched summons: byte-identical tree, 0 refund, no notice; 5 step twice: second refunds 0; 6 forged stamp: no replay; 7 newer version: untouched; 8 hostile ranks/strings/arrays/prototype keys: bounded, no throw; 9 codex bits for the 6 evolutions + both `c:` keys + Friend titles: kept, not NEW again; 10 legacy pre-v2 save whose legacySeed starter was wolves (S9); 11 two tabs, old build saves v5 after new build migrated: no double refund (N6); 12 ma_key owner: still owned, effect magic +3% only.

## 7. Respirit flag + the choose-your-new-spirit screen (B3; built C8 flag, C9 screen)
- v6 step sets `notes.respirit = { from: 'ghost_wolves' | 'raven_flock' }` when the profile's `notes.starter.weapon` is a retired weapon (also for legacy pre-v2 saves, fixture 10). One flag per profile (lantern).
- schema.js: `notesOf()` whitelists `respirit` only if `from` is in the frozen RETIRED_STARTERS set AND `notes.starter.weapon` is that retired id (so an imported/forged flag on a normal profile is dropped, N5); `mergeNotes()` keeps an existing respirit and never duplicates it. Same for `summonsNotice = {gold, shards, nodes}` (bounded ints, merged like treeResetNotice). Tests for both.
- Screen: blocking, on the front door for that profile before the hero step. Shows the live magic starters (4, + wind if released) with the existing spirit-step cards; a weapon whose heart the player already owns says so. Pick -> existing grantStarter path grants that heart + its first seal (whatever is missing) exactly once, sets `notes.starter.weapon`, deletes `respirit`, saves at once. Closing before choosing = the flag stays and the screen returns. Never grants twice (test).
- Notice: `summonsNotice` shown once on title/tree ("Your old spirits rest now. The lights you lit come back as N gold."; final copy C9), then cleared.

## 8. Codex, titles, characters page (C10)
- ENTRY_KEYS append-only: append `p:howie`, `p:flambe` after `p:ophimber` (prefix p = a hero's pet). Wolf/raven `e:` and `c:` bits stay set for owners; their pages read as resting spirits.
- Completions count LIVE content only: `c:spirits` and the book count non-retired evolutions/pages, so a fresh save can still complete both (test).
- Titles Friend of Wolves / Friend of Ravens: QUESTION 3 (default: owners keep them forever, hidden for everyone else).
- Hero card companion line (e.g. "with Howie, her Tracker"), Characters page companion panel beside the Bond bar (steps lit/dim like the five Bond gifts), results Bond beat lines name the companion. Old Pack costume (zero power, append-only cosm id) for saves that evolved Ghost Wolves at least once: DEFAULT kept (N3).

## 9. Balance plan
- C1 BASELINE (done in this chunk, before any companion change): docs/companions-baseline/ (commands in run.sh, numbers in SUMMARY.txt). Fresh Twilight per hero x starter, mid tree, max tree; 100 seeds per cell, random + focus bots.
- C7 BASE-1 (retire switch on, companions flag off): same matrix; isolates the pool change. bless-sweep before/after on the same commit for Kindled Spirits.
- C2-C6: paired on/off per companion and per step (section 3 rule) at BOND 0/10/25.
- C11 COMP: same matrix as C1 + ablations; compare distributions with +-SE, never seed by seed.
- Targets (LOCKED FINAL RETUNE TARGETS + CLAUDE.md): fresh 15-30% per starter, within ~6 pts of the median starter; mid 30-55%; max 65-90% (accepted misses: Elias ~96, Wren focus ~95, LOCKED DM10); boss rules; no deaths before ~5:00; deaths spread 6-14 min; evolutions 1.8-2.3x (cap 3x); hero gap small; ability on/off +2-5 pts; companion shares as in section 0. Anything that moves a target needs Matt.
- Expected (estimates, to be measured): fresh pooled down a few points (Ravens, the easiest start, leaves); mid Wren down (loses her kindred synergy); max flat. Starter retune (Chain/Orbit below band for some bots) only with Matt's sign-off in C11.

## 10. Build chunks (Update B). Each: tests + build + security + fit; sweeps as listed; Matt reviews
| # | Chunk | Done-check | Sweeps |
|---|---|---|---|
| C0 | This spec; CLAUDE.md lines point at the Reopened entry; QUESTIONS 1-3 asked | spec matches LOCKED; LOCKED/QUEUE updated | none |
| C1 | BASELINE on current dev (no src/data change) | docs/companions-baseline/SUMMARY.txt with seed counts, +-SE, exact commands | fresh (3 heroes x 6 starters), mid, max; 100 seeds, both bots |
| C2 | Companion core + Howie Bond 0 (sim only, flag off by default, `?companion=1` debug) | S7 tests a-d; grid target query; no main-stream draws | paired on/off BOND=0 Wren |
| C3 | Flambé Bond 0 + Sanctuary feed | absorb counts; tests | paired on/off BOND=0 Elias |
| C4 | Ophimber Ember-spitter Bond 0 | grid group pick; patch cap | paired on/off BOND=0 Lucinda |
| C5 | Art + audio for the three (Lantern Scruff, Chamberstick, embers) + prebake | true-size + phone shots, Low/High/Battery saver, 10:00 frame time | none |
| C6 | Bond rewire (`companion` slot) + locked steps 5/10/15/25 for all three, caps in data. STOP POINT: Matt feel-tests on the dev link before anything is retired | bondDef tests (old XP -> same HP/ward/speed); step tests | budget rule per hero at BOND 0/10/25 (300 pairs) |
| C7 | Retire switch: `retired` on 2 weapons + 6 evolutions, starter list, Wren kindred + S9 side effects, cards/bots/params, statuses owner null, Kindled Spirits -> companions | tests incl. debug-saves; script/test churn via a constant, not search-replace (S11) | BASE-1 matrix; bless-sweep before/after |
| W | Wind weapon (5th magic): three-options round (weapon, then its 3 evolutions, one at a time) -> LOCKED -> build weapon + evolutions + cluster on `tz_wind` (additive) | weapon/evo tests; evo 1.8-2.3x home scenario; zero v6 fingerprint change | evo-home, starter fresh cell, mid/max with wind |
| C8 | Tree v6 step (section 6) + respirit/summonsNotice whitelists | fixtures 1-12; reachability test; treerelease guard; tree-validate | pace-v2 before/after (dry stretches) |
| C9 | Choose-your-new-spirit screen (blocking, per profile) + notice | grant-once test; desktop + phone shots | none |
| C10 | Almanac/titles/Characters page/results lines (section 8) | codex append-only + live-only completion tests; brand test (Flambé accent, no bare "the pup"); shots | none |
| C11 | COMP sweeps + retune (only levers Matt approves) | every band reported with +-SE; Elias max separately; companion shares | full C1 matrix + boss-sweep + bless-sweep + ablations |
| C12 | Real-phone heat check, exploit pass, release snapshot at merge (`node scripts/tree-release.mjs --snapshot`, Matt's yes) | LAUNCH-CHECKLIST items | none |
Merge gate: nothing of Update B reaches main until C12 and Matt's explicit yes.

## 11. Risks (short)
Wren feel (pack of wolves -> one pup; C6 stop point mitigates). Elias max already 96. Migration touches every live save (fixtures 1-12, frozen tables, grant-once). Tree pacing loses ~18.5k gold of sinks (pace-v2 in C8; the wind cluster refills part of it). 61 tests + ~88 scripts reference the summons (S11). Idle raven code rots until Mara (tests keep it compiling). Update B is large: bisect by chunk commits.

## 12. QUESTIONS for Matt (one-tap, most blocking first)
1. (blocks C2-C4) How strong is a companion for a brand-new player (Bond 0)? (A, Recommended) Light, almost flavour: fresh win rates stay where they are, the companion grows into its job with Bond. (B) Noticeable from day one (about half its final job): fresh win rates rise a few points, starters re-checked. (C) Full strength from the start (Bond only adds the new tricks): fresh bands likely rise; needs a retune.
2. (blocks C6) When does Howie's once-per-run howl go off (Bond 25)? (A, Recommended) Automatically the first time Wren drops below 30% health: a rescue moment. (B) When the boss arrives. (C) The first Pelt Dash after 10:00.
3. (blocks C10) Titles "Friend of Wolves" and "Friend of Ravens": (A, Recommended) players who earned them keep them forever; hidden for everyone else. (B) Friend of Wolves is re-earned by getting Howie to Bond 25; Ravens waits for Mara. (C) Retire both for everyone.
DEFAULTS taken (overridable): starting numbers in section 2; Bond `companion` slot in place of `damage`; flag-off = today's game; road/link re-roots in section 6; teaser id `tz_wind`; ring re-lay by even spacing; Old Pack costume kept; Kindled Spirits keeps 2%/rank x3 applied to companion bite/ember damage and Flambé relight speed; retired data removed one release later (QUEUE item).

Fit check: companions are the hero's spirits in the Warm Lantern look (moon-blue pup with amber tips, brass chamberstick flame, little dragon embers), restrained effects, summoner fantasy kept through the hero; mechanically one growth axis (Bond), bounded by a measured budget rule, deterministic, no tree stat nodes.
Security check: docs only. Spec keeps saves untrusted: frozen price tables, idempotent step with forge guard, whitelisted notes keys tied to a retired starter, grant-once screen, hostile and two-tab fixtures; no new dependencies; debug params never write saves.
