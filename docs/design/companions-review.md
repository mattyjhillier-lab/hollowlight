# Companions: independent pre-build review (2026-11-15)
Reviewer: fresh sceptical pass, not anchored on companions-v2.md. Docs only; no code or data changed. Base: origin/dev @ c0fcaf4 (tree core.version 5 = main).
Read: CLAUDE.md, docs/design/companions-v1.md, companions-v2.md, every LOCKED row dated 2026-11-14/15, and the code named below.
Severity: BLOCKER = must be settled before the first build chunk it touches; SHOULD FIX = fix inside the plan before its chunk; NOTE = watch / cheap.

## BLOCKERS

### B1. Retiring the summons ring cuts released roads that are NOT wolf/raven content
companions-v2.md section 0 says "only the wolf/raven clusters themselves" depend on the retired ids. Wrong:
- Holy Orbit's road to its heart starts at `su_swift`: src/data/tree/clusters/holy_orbit.json:752 (`"from": "su_swift", "to": "gt_holy_orbit"`). Orbit is Elias's kindred.
- The Deep Dusk night-gate road starts at `su_pot`: src/data/tree/tools/nightgate.json:206 (`"from": "su_pot", "to": "gt_cursed_forest_hard"`).
- Teaser `tz_marsh` requires `su_key` (core.json ~l.1625). `su_call` is listed in core.json `legacyIds` (l.222).
- Satchel Path / Almanac Path use `requiresAny [su_pot, li_coin]` / `[ma_cast, su_rush]` (core.json ~l.1709, ~l.1734): survive via the alternate, but their geometry hangs off a hole.
Effect if built as planned: owners keep these nodes (M1), but a NEW player cannot reach Holy Orbit's road or the Deep Dusk gate path; the tree validator may also fail.
Fix (C8): re-root these four roads/links to a live ring or hub node inside the same v6 step (they are released ids, so their hash change is covered by the bump). Add a test: after v6, every live non-teaser node is reachable from the root with zero retired ids on any path, for a fresh save and for a v5 veteran save.

### B2. "Total power unchanged" (Decision 4) is only true at Bond 25, and only for damage heroes
- The removed row is +5% damage at Bond 25, 0 at Bond 0 (balance.json bond.total; bond.js bondBonus). Companions exist from Bond 0 (Howie bites, Flambé one ward per ~20 s, Ophimber embers). So FRESH profiles gain power they never had: the fresh 15-30% band moves up, on top of the starter-pool change.
- Elias swaps +5% damage for survival. Survival converts to win points faster than damage in this game (Bond 25 alone is +45-56 points, mostly HP/ward/speed; QUEUE CH4-6). Elias max is already 96 vs band 65-90 (QUEUE DM9 line 5). Flambé Bond 25 "two ward charges" + Bond 15 heal is the likeliest new over-band source.
Fix: make "budget-neutral" a measured rule, not a sentence: at BOND=0, 10 and 25, the paired on/off win-point delta of the companion must be <= the paired delta of the removed damage row at that level (+- noise, 300 pairs like DM9). Bond 0 companion should be light (near-flavour) so fresh bands hold. Report Elias separately; if Elias max stays > 90, the lever is Flambé numbers, not the band.

### B3. Plan contradicts LOCKED decision 2 (choose-your-new-spirit screen), and the save schema would silently drop the flags
- LOCKED COMPANIONS DECISIONS 1-3 (2): a one-time screen where the player CHOOSES. companions-v2.md section 3 / C7 instead auto-grants a "frozen STARTER_V6 map". A tree step is pure and runs on load (src/meta/migrations/index.js), so it cannot ask.
- New notes keys are dropped: notesOf() whitelists known keys only (src/save/schema.js:194-210) and mergeNotes() only merges `regrowth`/`treeResetNotice` (schema.js:183-190). A `summonsNotice` or a pending-choice flag would vanish on the next sanitize.
- Until the player chooses, app.js:110 falls back to `startable[0] || kindred`; a wolves-only profile has no startable weapon and gets the (new) kindred UNOWNED (works, but its tree branch is dormant: confusing).
Fix: v6 step sets `notes.respirit = { from: 'ghost_wolves'|'raven_flock' }` (validated id, whitelisted in notesOf + mergeNotes, test). The screen is blocking on the front door for that profile, grants heart + first seal via the existing grantStarter path exactly once, then deletes the flag. Per profile (lanterns). Free starter nodes of the retired weapon are not refunded (frozen STARTER_V5 decides what was free).

### B4. Summon-typed effects outside the retired set become dead or free power
- Blessing "Kindled Spirits" ("All your spirits hit 2% harder", src/data/blessings.json) only multiplies `type === 'summon'` weapons (src/sim/Sim.js:357). After the retire it is a dead card in every blessing pool (weight 0.7).
- Keystone `ma_key` "Unbound Light: magic +3%, summons -3%" (core.json ~l.1333, released, NOT in the retire list) loses its downside: a free +3% to every weapon for mid/max trees.
- `rush` (Sim.js:358) is only fed by su_rush (retired): dead code, harmless.
Fix: Matt decides (one-tap, after review): Kindled Spirits applies to all weapons (re-run bless-sweep; caps already in blessings.json) or is retired; `ma_key` gets a new non-summon downside or joins the v6 retire+refund list (its `excludes: su_key` also goes stale). Either way it is a released id: part of v6.

### B5. Locked items silently reopened, Reopened list not updated
LOCKED "Reopened (with reason)" (docs/LOCKED.md:50) has no 2026-11-15 entry. These locked rows are now overridden and need entries (reason: COMPANIONS DECISIONS 1-6):
- Progression row (LOCKED l.13: run 1 = Wolves + Orbit; Ravens a tree gate) and PROGRESSION DIRECTION in CLAUDE.md.
- V1 weapons scope (5 weapons, 15 evolutions; CLAUDE.md + LOCKED) and EVOLUTION COUNT (LOCKED l.126, 3 per weapon incl. wolves).
- BOND SIZE (LOCKED l.354: +5% damage at 25, "same perk ladder for every character").
- CHARACTER SYSTEM v2 kindred (Wren -> Ghost Wolves), starter pick list.
- TREE: MAGIC-ONLY BRANCHES (LOCKED l.493, wolves/ravens keep small clusters) and TREE BRANCH STRUCTURE's Howling Legion landmark rule (l.491).
- RT6-RT8 acceptance "Ravens fresh win ~40-50%" (l.388) and the 2026-10-15 Abilities row "Rally calls Ravens".
- Codex titles Friend of Wolves / Friend of Ravens (codexcopy.js:148-149, CX6 lock).
Fix: add the entries + update CLAUDE.md "Locked design" lines in C0, before any build.

## SHOULD FIX

S1. companions-v2.md is stale against the locks and will mislead builders. Section 2 recommends A (rejected), section 5 tables (Lightfoot/Howl/Alpha/Red Thread; Ring Lamp/Warm Wax/Steady Flame) contradict LOCKED TRACKER BOND STEPS and FLAMBE BOND STEPS; section 4 "wolf e: bits become milestone pages" and "Friend of Wolves re-points to Tracker Bond 25" were for option A; C5 = "Milestones (option A ladders)". Fix: write companions-v3 (build spec) from the LOCKED rows only; mark v2 sections 2/5/7 SUPERSEDED.

S2. Names vs ids. Player text: Howie, Flambé, Ophimber; job titles The Tracker, The Wick, The Ember-spitter. Data ids must be ASCII (`howie`, `flambe`, `ophimber`): id regexes like `^[a-z_]` (bond.js perks, schema ID_KEY `^[a-z0-9_]{1,40}$`) reject "é". Codex: append `p:howie`, `p:flambe` after `p:ophimber` (codex.js ENTRY_KEYS end), not `p:tracker`/`p:wick` as v2 section 4 says. Add a brand-style test that player text says "Flambé" (accent) and never "the pup" alone (LOCKED PUP NAME).

S3. Bond row removal mechanics are undefined. `cycle: [hp, ward, speed, damage]` drives which stat each level gives (bond.js:55-66). Dropping `damage` makes the cycle 3 long: every existing player's HP/ward/speed at intermediate levels shifts and the Characters page step list changes. Keeping it with total 0 makes levels 4, 8, ..., 24 give nothing. Fix (Claude default, reversible): replace the `damage` slot with a `companion` step (BOND_STATS gains `companion`), so levels 4/8/12/16/20/24 grow the companion a notch between the locked verb steps at 5/10/15/25. Old saves: XP unchanged, HP/ward/speed identical at every level. Tests in bondDef.

S4. Howie's 5-8% budget mixes units. Bond 5 gem fetch and Bond 10 pawprint speed are not damage; Bond 15 mark raises ALL damage on the target (the pup's own damage counter will not see it); Pelt Dash was "no damage" (Sim.js:1143) and now bites. Fix: budget = paired on/off win points (primary) + damage-share (secondary, incl. mark uplift). Pawprint speed goes through a hard cap (speed is the strongest survival stat; blessings already cap combined speed 1.08). Bond 25 "one howl per run" has no trigger: define it (Claude default: first time HP drops below 30%, auto) before C6.

S5. Status ownership. src/meta/status.js: `bleed` owner ghost_wolves, `mark` owner raven_flock. Both owners retire. Howie's mark (Bond 15) needs its own fixed numbers (not raven data). Ophimber Bond 15 uses shared Burn, whose potency is raised by Orbit/Meteor tree Burn nodes: that is companion power from the tree, against LOCKED "No companion stat nodes (Bond only)". Fix: companions apply statuses at fixed data values that tree status nodes do not scale (or Matt accepts it and the sweep measures it). Set bleed/mark `owner: null` like `pin`; validator test.

S6. Roads would be re-pointed twice. LOCKED SUMMONER BRANCH REPLACEMENT re-points the 11 roads to a teaser at release, then to the wind weapon's gate later: the second change touches released ids again = core v7 + another migration. Fix: give the teaser a permanent id now and make the future wind heart require that id; the roads point at it once (v6). Wind content then arrives additive (no step), like the Meteor reserved slot.

S7. Determinism: "must not change RNG order" is impossible in the strong sense (extra damage changes kill timing, so later main-stream draws for drops/spawns differ). The achievable guarantees, each a test: (a) companion code never draws from `sim.rng`; it uses no RNG or its own stream (precedent keepRng/markRng/siteRng, Sim.js:86-91, 288); (b) companions off (flag) = byte-identical traces to BASE-0 for every hero/starter; (c) same seed + same Bond = identical replay; (d) update order fixed (companions step after weapons, before pickups).

S8. Phone hot path. Howie's "weakest nearby" target and Ophimber's "lands on a group" must use the spatial grid on a timer (not per-frame full scans, not O(n^2) cluster search). Pawprints, fire patches, ward flashes: pooled with hard caps; trails off on Low/Battery saver; new rigs added to prebake (src/gfx/prebake.js) and measured at 10:00 swarm under the 72/36/22 limiter (LOCKED LIVE: PHONE SMOOTHNESS). Done-check includes a frame-time number, not "looks fine".

S9. Kindred change side effects. Wren kindred -> spirit_bolts also: moves Wren's tree landmark (treedata.js:651 places `h:<hero>` near `c:<kindred>`); changes legacySeed's starter (chars.js:56) while LEGACY_POOL still lists ghost_wolves (chars.js:12; hearts are added after the steps in sanitize, schema.js:268-272): a pre-v2 save would end with only Orbit and an unowned starter. Fix: legacy saves also get the `respirit` flag; fixture. `sweep-all.mjs` default `kindred` silently changes what "Wren" means: BASE-0 must pass explicit weapons. bot.mjs:63 `GATES=launch` hard-codes ghost_wolves.

S10. DM9 (Lucinda/Meteor numbers) sits on wip/dm9, not dev (QUEUE l.5). Any BASE-0 taken on dev is wrong for Lucinda and Meteor. Fix: merge DM9 to dev first (Matt's yes), then BASE-0.

S11. Test/script churn is large: 61 test files and 88 scripts reference ghost_wolves/raven_flock; many assume Wren -> wolves. Budget it inside the retire chunk; tests that only need "some weapon" switch to a constant, not a global search-and-replace.

S12. Scope. One release = Lucinda + Meteor + 3 companions + retire 2 weapons/6 evolutions + tree v6 + choose screen + codex + retune. If anything is wrong the migration touches every live save and bisecting is hard. Safer split (needs Matt to reopen NEXT UPDATE SCOPE):
- Update A: Lucinda + Meteor released (DM10). Additive, no save step. Nobody has a companion yet, so the three heroes still match (Decision 6 intent kept). Pool becomes 6 weapons.
- Update B: companions for all three + retire + tree v6 + wind weapon in the SAME release, so the pool goes 6 -> 5 (Bolts, Chain, Orbit, Meteor, Wind) and never sits at "4 weapons for 4 slots". One migration, no v7.
If Matt keeps one update: the chunk list below still holds; put the merge gate after C12 with a real-phone pass.

## NOTES

N1. 4-for-4 slots: mid/max runs all end with the same four weapons; the options-driven progression (LOCKED PROGRESSION DIRECTION) loses 2 of 6 weapon unlocks and 6 of 18 evolution unlocks, about 18.5k of ~191k tree gold (rank-sum estimate, ~10%). Mid-game gets shorter: re-run pace-v2 for dry stretches. This is the strongest argument for S12.
N2. Wren feel is the top taste risk: a pack of 2-7 wolves with three evolutions becomes one pup whose steps are mostly utility (fetch, speed, mark, one howl). Keep the stop point: Matt feels Howie on dev BEFORE the retire switch.
N3. Old Pack costume (v2 default) was framed around evolved wolves becoming milestones; with all six retired it is the only keepsake of the pack. Claude default: keep it (zero power, append-only id).
N4. Titles: Friend of Wolves/Ravens become unearnable. Owners keep them (`titles.got`); hide them for others; c:spirits and c:book must count live (non-retired) evolutions only (codex.js ~l.278-287 counts every weapon in data). Test: a fresh save can still complete both.
N5. Forged `respirit` flag could farm free hearts: low stakes (single-player), but grant only magic heart + its first seal, once per flag, and the flag is only created by v6 (not by import of an arbitrary notes key without a retired starter).
N6. Two tabs (old PWA build + new build): the old tab may save a v5 tree after the new tab migrated; next load migrates once more from the old tab's own gold, so no double refund. Add the fixture anyway.
N7. Perk overlap: Wren Bond 5 perk "Pup's Nose" (pickup +15%) lands on the same level as Howie's gem fetch; Bond 5/10/15/25 now each give perk + stat + companion step. Copy pass on the Characters page so it reads as one gift per level.
N8. New players lose the friendliest start (Ravens fresh ~40-50%, LOCKED RT6-RT8). First-10-minutes difficulty now rests on Bolts/Chain/Orbit: see the measured numbers below.

## Balance snapshot (measured here, dev @ c0fcaf4, fresh Twilight, GATES=starter META=none BOND=0, 32 seeds per cell, random/focus bots)
Noise: +-9 points (1 SE) per cell at 32 seeds. Indicative only; C1 reruns at 96 seeds.
| Start | Wren random / focus | Elias random / focus |
|---|---|---|
| Spirit Bolts (new Wren default) | 28 / 53 | 34 / 31 |
| Chain Lightning | 9 / 19 | 19 / 22 |
| Holy Orbit | 19 / 9 | 25 / 28 |
| Ghost Wolves (leaving) | 22 / 31 | 31 / 25 |
| Raven Flock (leaving) | 31 / 28 | 56 / 41 |
Read: Wren's new default (Bolts) is viable, possibly above band with the focus bot (53, needs the 96-seed check). Her weakest live starts (Chain random 9, Orbit focus 9) sit under the 15-30 band, so the choose-your-new-spirit screen can steer ex-wolves players into a below-band start. Ravens (the easiest start) go. Wolves reach their first evolution ~2-3 min earlier than any magic start (3:51-3:59 vs 4:50-9:25), so new players will see their first evolution later. Companions then add Bond-0 power on top (B2). Spread across starters is already wider than the "within ~6 points" target. A retune of starter weapons belongs in C11 and needs Matt's sign-off.

## Recommended BUILD CHUNK LIST (reflects the locked picks; each chunk: tests + build + security + fit; sweeps as listed; Matt reviews)
| # | Chunk | Done-check | Sweeps |
|---|---|---|---|
| C0 | Docs: companions-v3 build spec from LOCKED rows; Reopened entries (B5); ids (S2); Bond `companion` slot (S3); B4 + S12 + howl trigger asked/defaulted | LOCKED/QUEUE/CLAUDE.md updated | none |
| C1 | DM9 merged to dev (Matt yes); BASE-0 archived | numbers file with seed counts | sweep-all (explicit weapons, 3 heroes), rt-matrix GATES=preset BOND=0/25, boss-sweep, bless-sweep, pace-v2; 96 seeds |
| C2 | Companion core + Howie Bond 0 (sim only, flag `unreleased`, `?companion=1`) | S7 tests a-d; grid target query; no main-stream draws | paired on/off BOND=0 (Wren) |
| C3 | Flambé Bond 0 + ring feed | absorb counts, tests | paired on/off BOND=0 (Elias) |
| C4 | Ophimber Ember-spitter Bond 0 | grid group pick, patch cap | paired on/off BOND=0 (Lucinda) |
| C5 | Art + audio for the three (Lantern Scruff, Chamberstick, ember) + prebake | true-size + phone shots, Low/High/Battery saver, 10:00 frame time | none |
| C6 | Bond rewire (`companion` slot) + locked steps 5/10/15/25 for all three, caps in data; Matt feel-test on dev (STOP POINT) | bondDef tests; old XP -> same HP/ward/speed | paired per step at BOND=0/10/25 vs removed damage row (B2) |
| C7 | Retire switch: `retired` on 2 weapons + 6 evolutions, starter list, Wren kindred, cards/bots/params/cleanPick, Kindled Spirits per B4 | tests incl. debug-saves; churn handled (S11) | BASE-1 sweep-all per starter, bless-sweep |
| C8 | Tree v6: 36 ids (+ma_key per B4), re-root B1 roads, roads -> permanent teaser id (S6), frozen tables, `respirit` + `summonsNotice` whitelisted (B3) | fixtures 1-9 of v2 + legacy pre-v2 + two-tab + reachability test; treerelease guard; tree-validate | pace-v2 |
| C9 | Choose-your-new-spirit screen (blocking, per profile) + notice | grant-once test; desktop + phone shots | none |
| C10 | Almanac/titles/Characters page: p:howie, p:flambe, live-only completions, Bond step copy | codex append-only + completion tests; shots | none |
| C11 | COMP sweeps + retune (only levers Matt approves) | every band reported with noise; Elias max separately | full matrix as C1 + ablations |
| C12 | Real-phone heat check, exploit pass, release snapshot at merge (Matt's yes) | LAUNCH-CHECKLIST items | none |
If Matt takes the S12 split: Update A = C1 + DM10 only; Update B = C2-C12 plus the wind weapon chunks before C11.

Fit check: review only; recommendations keep one growth axis (Bond), bounded companions, Warm Lantern look, no new weapons beyond the locked wind direction.
Security check: docs only, no code/data/dependency changes; findings B3/N5/N6/S9 harden save handling (whitelisted notes, frozen tables, grant-once, legacy fixture).
