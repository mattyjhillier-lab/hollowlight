# Wispwick: CONTENT GUIDE (how to add X)

Launch checklist item 17. Accurate to the repo on 2026-10-28; every path and command below was checked to exist. Facts that are still limits are marked KNOWN LIMIT. This guide never overrides docs/LOCKED.md: if they disagree, LOCKED wins and this file is fixed.

Helper: `node scripts/new-content.mjs <weapon|evolution|hero|enemy|chapter|blessing> <new_id> [--weapon <weaponId>] [--json]` prints the data skeleton and a short checklist. It is PRINT-ONLY (never writes; tests/newcontent.test.mjs enforces that). Tree clusters, map event sites and tombstones have no skeleton script: copy the nearest existing file.

---

## 0. Rules that apply to every piece

1. **Three options, Matt picks.** For each new piece (weapon, evolution, hero, ability, enemy, boss, status, power-up, tree node group) design THREE genuinely different options, recommended first, with: plain-words fantasy and verb, look and sound, estimated numbers, fit with sibling pieces (same counts per weapon, distinct verbs, different recipe pairs), risks. Present as one-tap questions (max 3 per batch, one weapon or hero at a time). Record each pick in docs/LOCKED.md. Process rows: CLAUDE.md "new content = three options".
2. **Research -> design -> review -> lock -> build -> verify.** Check docs/LOCKED.md for conflicts before proposing. Medium or big pieces get an independent reviewer. Trivial or reversible data tuning needs only a one-line rationale.
3. **Data first.** New content is JSON in `src/data/` (weapons, evolutions, characters, enemies, chapters, blessings, tiers, cosmetics, and the tree fragments in `src/data/tree/`). Behaviour that JSON cannot express is code in `src/sim/` (pure JS: no Phaser, no DOM, seeded RNG only, so it runs in Node tests and bots). Rendering is `src/scenes/RunScene.js` and `src/gfx/`; DOM UI is `src/ui/`.
4. **Fit check** (docs/IDENTITY.md, docs/BIBLE.md, role colours, restraint, unique silhouette per creature) and **mechanical-sense check**: one line each, in the report.
5. **Security check**: no new dependency without review, `npm audit` reported, text shown with `textContent` (tests forbid `innerHTML`), saves/imports/URL params treated as untrusted, assets only from verified CC0/free sources and logged in docs/CREDITS.md, no secrets.
6. **Definition of done** (CLAUDE.md): tests green + build OK; balance check; security; fit; screenshots at true in-game size and phone size for anything visual; update LOCKED, QUEUE and the design doc. Report in a few bullets, end with Right now / Next / Parked.
7. **Never main.** Work on `dev` (or a `wip/*` branch merged to dev). Release to main only with Matt's explicit yes, by PR with CI green.

### Commands (all verified)

| What | Command |
|---|---|
| Install / dev / build / tests | `npm install`, `npm run dev`, `npm run build`, `npm test` (= `node --test tests/*.test.mjs`) |
| Audit | `npm audit` (report; never `--force` blindly) |
| Tree validate | `node scripts/tree-validate.mjs [--table] [--svg out/tree.svg] [--synthetic 1000]` |
| Tree budget table | `node scripts/tree-validate.mjs --table` (scripts/tree-budget.mjs is the superseded v1 printout) |
| Tree economy / pace | `node scripts/tree-timeline.mjs`, `node scripts/gates-pace.mjs [journeys] [runs]` (about 15 min), `node scripts/gates-softcap.mjs`, `node scripts/gates-ablate.mjs`, `node scripts/tree-ablate.mjs GROUP [N] [char]` |
| Bot probe | `node scripts/bot.mjs wren 8` (`FOCUS=1` focused picks) |
| Starter sweeps | `node scripts/sweep-all.mjs [seeds=24] [chars] [startWeapons]`, `node scripts/sweep.mjs <char> <seeds>`, `scripts/sweep.sh` |
| Blessing sweeps | `node scripts/bless-sweep.mjs [seeds=96] [label]`, `node scripts/g1d-sweep.mjs [seeds] [label]` |
| Boss | `node scripts/boss-sweep.mjs [seeds=96] [label]` |
| Endless | `node scripts/endless-sweep.mjs` |
| Full power-state matrix | `node scripts/rt-matrix.mjs out.jsonl [headSeeds=96] [otherSeeds=24] [workers=10] [focusSeeds=48]` then `node scripts/rt-summary.mjs out.jsonl` |
| Evolution measures | `node scripts/evo-home.mjs [seeds] [pickRank] [filter]`, `node scripts/evo-same-ranks.mjs [seconds] [seeds]`, `node scripts/evo-dps.mjs` |
| Ability ablation | `node scripts/ability-ablate.mjs` |
| Map events bot | `scripts/sitebot.mjs` (used by bot.mjs; env `SITES_BOT=calm|greedy|never`) |
| Readability harness | `node scripts/wl6-measure.mjs` (report: docs/design/visibility-arc-measured.md) |
| Perf | `scripts/pace.mjs` (and `?debug=1` in the browser) |
| Scaffold (print-only) | `node scripts/new-content.mjs weapon my_weapon` |

Balance sweeps accept env switches (`GATES`, `META`, `TIER`, `BLESS`, `BOND`, `SEED_FROM`, `HEROES`, `PICKS`, see each script header). Read the header before comparing numbers; always state seed counts and noise (about +-5 to +-10 points at 96 seeds).

### Balance gates (the locked targets; report numbers honestly)

From CLAUDE.md and LOCKED "FINAL RETUNE TARGETS" (2026-10-25). Anything that moves a target is Matt's decision.

- Twilight win bands by power state: fresh profile (no tree, Bond 0) 15-30%; mid-game tree 30-55%; full tree + max Bond 65-90%. Deep Dusk and Long Night have their own bands (LOCKED RT5 to RT8 rows).
- No deaths before ~5:00; deaths spread 6-14 min.
- Evolutions: about 1.8-2.3x the maxed base in the HOME scenario, hard cap 3x (also at pick time), never below base in any scenario.
- Abilities a modest share of power (on vs off within a few points).
- Tree total power inside the soft-cap budget (tree-validate prints and enforces it).
- Wren vs Elias gap small.
- Boss: players who reach it win about 60-75%, boss causes 20-35% of defeats, fight 75-100 s.
- Tests pin some counts on purpose (5 weapons, 15 evolutions, 2 heroes). Update those pins deliberately in the same commit, never by loosening a test.

---

## 1. Add a WEAPON

Locked scope: v1 has 5 weapons and no more (LOCKED 2026-10-17). A new weapon is post-launch work and needs Matt's reopen. Roster candidates are in CLAUDE.md and docs/design/weapons-and-summons-v1.1.md.

1. Three options (rule 0.1). Include the verb, the 4 stats (all x 5 ranks), the three future recipe pairs, the tree emblem idea.
2. Skeleton: `node scripts/new-content.mjs weapon <id>`. Add to `src/data/weapons.json`: name, type (summon or magic), tags, colour, desc, exactly 4 stats `{name, base, perRank, fmt, hint}`. `balance.json` `maxRank` is 5 and `weaponSlots` 4.
3. Behaviour (code): add the handler to the table in `src/sim/weapons.js` (the id -> function map; today it ends with `holy_orbit: holyOrbit`). Deterministic only.
4. Register everywhere the id is listed (grep a similar id such as `raven_flock`): `src/audio/engine.js` HIT_CUE and `src/audio/cues.js`; `src/ui/hudsvg.js` EMBLEM_OF; `src/ui/titlecopy.js`; `src/meta/codex.js` and `src/ui/codexcopy.js`; the per-weapon hit list in `src/scenes/RunScene.js`; art under `src/gfx/summon/` (and CREDITS if any asset is used).
5. Tree cluster (see section 6). `treeGate: true` in weapons.json means the weapon is unlocked through the tree heart gate `gt_<weapon>`.
6. Add three evolutions (section 2). Locked: 3 per weapon.
7. Required tests: `npm test`; add `tests/<weapon>.test.mjs` for behaviour (follow tests/bolts.test.mjs or tests/ravens.test.mjs), stat hints render (tests/stathints.test.mjs runs on all weapons), cards (tests/cards.test.mjs).
8. Gates: starter sweeps (`sweep-all.mjs 24`), a start-with-this-weapon matrix via `rt-matrix.mjs`, `evo-home.mjs`, `gates-pace.mjs`, `gates-softcap.mjs`. The fresh-start win must land in 15-30%; if it does not, tune `weapons.json` numbers and re-run (the RT passes allowed 3 tries then Matt decides).
9. Visual: screenshots at true size and phone size; read at a squint; perf caps held.

## 2. Add an EVOLUTION

Rules: 3 per weapon, one per weapon per run, the recipe is a pair of the weapon's stats, recipes stay hidden until discovered, an evolved weapon keeps its non-recipe stat cards (LOCKED 2026-10-16). Each evolution changes the weapon's VERB.

1. Three options. Pick a recipe pair not used by the weapon's other evolutions.
2. Skeleton: `node scripts/new-content.mjs evolution <id> --weapon <weaponId>`. Add to `src/data/evolutions.json`: verb, sub, `weapon`, `pair`, name, `desc` (one verb-first line, 96 characters or fewer, no recipe stat named; tests/evotext.test.mjs checks), `codex` riddle line, `cue` (`evo_<id>`), `tune` numbers, and `treeGate` if tree-gated.
3. Behaviour: branch on `w.evo === '<id>'` in the weapon's handler in `src/sim/weapons.js`; numbers come from `tune`.
4. Text and sound: riddle in `src/ui/codexcopy.js` (the RIDDLE list), cue in `src/audio/cues.js`, art/effects under `src/gfx/summon/`.
5. Tree: a socket and gate `gt_<id>` in the weapon's cluster file; set the gate's count with `gates-pace.mjs`.
6. Tests: tests/evo-promises.test.mjs (promise vs behaviour), tests/evotext.test.mjs, tests/e9.test.mjs (pick moment), tests/codex.test.mjs; add `tests/<weapon>-evos.test.mjs` like tests/raven-evos.test.mjs.
7. Gates: `evo-home.mjs` (home scenario 1.8-2.3x, cap 3x at pick), `evo-same-ranks.mjs` (never below base), `rt-matrix.mjs`. Update the pinned evolution count.

## 3. Add a HERO

The tree is character-agnostic (LOCKED TREE-GEN1): a hero is data + an ability handler + a rig. tests/treegen.test.mjs and tests/fixtures/hero3* prove a third hero needs no tree edit. Character system v2 (docs/design/characters-v2.md): heroes differ by ability and look; levels are granted after a run only (src/save/chars.js). Read that doc before designing.

1. Three options for the hero AND three for the ability (verb you can feel, bounded power, cooldown at or above `balance.json` `abilityCdFloor` after tree reductions).
2. Skeleton: `node scripts/new-content.mjs hero <id>`. Add to `src/data/characters.json`: name, blurb, colour, `kindred` weapon, keepsake (with a `hint` unlock rule), `ability {id, name, cooldown, desc, ...params}`, `treeVisuals`, `bondPerks`.
3. Ability: code branch on its id in `src/sim/Sim.js` (next to `pelt_dash` and `sanctuary_ring`). Ability tree parameters live in the ability's `tree` block (see tests/fixtures/hero3-data.json for the shape).
4. Rig and art: its own code-drawn rig with a unique silhouette and accent colour (src/gfx/herorig.js, eliasrig.js, wrenart.js, eliasart.js as models); portrait script scripts/gen-hero-portraits.mjs; copy in src/ui/charcopy.js and src/ui/resultscopy.js; cosmetics entry in `src/data/cosmetics.json` (validated at boot: colours inside the lantern band).
5. Optional tree hero fragment `src/data/tree/heroes/<id>.json` (copy tests/fixtures/hero3/heroes/sable.json) with its own prefix.
6. Tests: tests/chars-save.test.mjs and tests/abilities-v2.test.mjs patterns; `node scripts/tree-validate.mjs`.
7. Gates: `ability-ablate.mjs`, `sweep-all.mjs 24 <hero>`, rt-matrix with the new hero (gap to the others small), screenshots true size and phone.

## 4. Add an ENEMY FAMILY

Every enemy has its own unique silhouette, eye-point and animation personality; recolours are rejected (LOCKED character/enemy identity). Readability in the night/dawn arc is a hard gate.

1. Three options per creature (silhouette, behaviour, tell, sound).
2. Skeleton: `node scripts/new-content.mjs enemy <id>`. Add to `src/data/enemies.json`: name, hp, speed, dmg, r, xp, gold, colour, `shape`, mass, optional `ai` block (charger / piper style; behaviour in `src/sim/enemyai.js`, copy bramble_hart or stoat_piper), `mustReact` if it needs a dodge.
3. Art: frames/rig in `src/gfx/husk/frames.js` and `src/gfx/enemyrig.js` (eyes in `nightlook.js`, crowd read in `crowdread.js`, tells in `enemytells.js`), audio cue in `src/audio/cues.js`, codex lines in `src/ui/codexcopy.js`.
4. Spawn: add to a chapter's `waves` in `src/data/chapters.json` (from, to, rate0, rate1, curve, maxAlive). A boss or miniboss also needs a `fight` block (copy elder_treant / branch_mane).
5. Tests: add `tests/<family>.test.mjs` (pattern tests/en345.test.mjs, tests/husks.test.mjs); the readability tests and contrast harness must still pass (`wl6-measure.mjs`).
6. Gates: `sweep-all.mjs 24`, rt-matrix (no deaths before ~5:00, deaths 6-14 min), `boss-sweep.mjs` for a boss; true-size and phone shots; `?debug=1` perf at 350 enemies on the Low tier.

## 5. Add a CHAPTER / MAP

KNOWN LIMIT: Chapter 1 (cursed_forest) is the only chapter. `Sim` defaults `chapterId` to `cursed_forest`, `src/meta/codex.js` names it, and per-chapter ground, palette and lighting arc (`src/gfx/arc.js`, `src/world/zones.js`) are not yet fully data-driven. The pipeline goal (LOCKED EXTENSIBILITY) is chapter art/ARC/palette as data; do that design pass first, with three options, before building chapter 2. Chapters 2-8 are post-launch.

1. Three options for theme, roster, boss, palette, map events.
2. Skeleton: `node scripts/new-content.mjs chapter <id>`. Data goes in `src/data/chapters.json` (waves, events, minis, `sites`), an entry per difficulty in `src/data/tiers.json` `chapters` (validated at boot by `validateTiers`), and a tree chapter fragment `src/data/tree/chapters/<id>.json` (`kind: chapter`, `order`, `prefix`, nodes for the chapter band; chapter bands add scoped power only, docs/design/skill-tree-v2.md C.9).
3. New enemies and the boss: section 4.
4. Tests: tests/boss.test.mjs, tests/boss-tiers.test.mjs patterns, `tree-validate`, tests/treedata.test.mjs.
5. Gates: `sweep-all.mjs`, `rt-matrix.mjs`, `boss-sweep.mjs`, `endless-sweep.mjs`, readability harness, true-size and phone shots, perf.

## 6. Add a TREE CLUSTER (weapon constellation) or other tree nodes

The tree is composed from fragment files in `src/data/tree/` (`core.json`, `emblems/`, `clusters/`, `chapters/`, `tools/`, and `heroes/` if used). Dropping a file in is registration; `src/data/tree/index.js` globs them. Schema and rules: docs/design/skill-tree-v2.md (Appendix C). The scaffold script described there (`tree-scaffold.mjs`) was never built: copy the closest cluster (e.g. `clusters/raven_flock.json`) and its emblem.

1. Cluster file: `kind: cluster`, `weapon`, unique `prefix`, `emblem`, `slot`, `chapter`, `region`, `heart` gate `gt_<weapon>`, `sockets` (a, b, c) each bound to one of the weapon's three evolutions, `gates`, nodes. Ids `<prefix>_<name>`, gates `gt_<id>`, permanent small integer `idx` unique in the fragment and append-only. Emblem file `emblems/<id>.json` (outline points and slots).
2. Rules to respect: connected-unlock (a node needs a connected owned node; gates and sockets have `requires: []`), at most ~30% stat beads (mostly options and verbs), a cluster may not touch global or tag categories, costs from the economy rule (about 5 runs of gold per cluster).
3. Add the new ids to `tests/fixtures/tree-ids.json` deliberately (append-only snapshot; tree-validate fails on a missing id).
4. Run `node scripts/tree-validate.mjs --table` (compose, live and v2 compile, layout, connected rule, budget, id snapshot) and `npm test` (tests/treedata.test.mjs, tests/treegen.test.mjs, tests/t3*.test.mjs, tests/treerelease.test.mjs, tests/treescreen.test.mjs).
5. Economy and balance: `tree-timeline.mjs`, `gates-pace.mjs` (gate counts replace estimates), `gates-softcap.mjs`, `tree-ablate.mjs`, then the rt-matrix mid and maxed bands. Raising the budget is a rule change, never a total: note + sweep + Matt decides + LOCKED row (skill-tree-v2.md C.9).
6. Visual: tree screen at desktop and phone size (scripts/t4-shots.mjs, t6-shots.mjs as models); emblems readable at phone size.
7. Retiring or changing an existing node is a release matter: see section 10.

## 7. Add a MAP EVENT SITE

Lamp Posts, Lantern Road and Hollow Knot exist (LOCKED MAP EVENTS rows, docs/design/map-events-v1.md). Sim code is `src/sim/sites.js` (own RNG stream `siteSeed`, the validator `validateSites` fails closed), tuning is the chapter's `sites` block in `src/data/chapters.json`, render `src/gfx/siteview.js`, copy `src/ui/sitecopy.js`.

1. Three options; the reward must be visible before the player commits (LOCKED map-events rule) and bounded by the sheet's reward ceiling.
2. Data in the chapter `sites` block; sim in `src/sim/sites.js` (it must not disturb the main RNG stream: sites OFF must stay byte-identical to the sweeps).
3. Bot support: steer in `scripts/sitebot.mjs`, otherwise the bot never uses it and balance reads wrongly (the shipped sites show this: lamps 2.6 of 12, knots 0 of 2).
4. Tests: tests/sites.test.mjs patterns (validator rejects bad data, determinism, off = identical).
5. Gates: rt-matrix with sites OFF versus ON (same seeds); all bands must hold; report the delta honestly; any band break is Matt's decision.

## 8. Add a BLESSING

Run-only quiet cards. `node scripts/new-content.mjs blessing <id>`. Add under `items` in `src/data/blessings.json`: name, desc (effect-first), whisper, `effect` (an existing kind), `perRank`, `ranks`, `weight`. Stay inside the `caps` and `combined` limits in that file. Icon in `src/ui/cardicons.js`; copy rules docs/design/blessing-copy.md. A NEW effect kind is code (`src/sim/blessings.js`) and needs its own three options. Tests: tests/blessings.test.mjs, tests/cardsui.test.mjs. Gates: `bless-sweep.mjs`, `g1d-sweep.mjs`.

## 9. Add a DEBUG URL PARAM

New params in `src/params.js` must be classified in tests/debug-saves.test.mjs as a pure render/UI flag or a debug trigger that never writes a save. Untrusted input is clamped and validated (tests/params.test.mjs).

---

## 10. Release guards (read before changing anything players already own)

1. **Tree snapshot (tests/fixtures/tree-released.json).** Empty until the v1 launch merge. At that merge run `node scripts/tree-release.mjs --snapshot` and commit the result (LAUNCH-CHECKLIST 24b). After that, changing price, effect, requires, max rank, unlock or other owned-rule fields of any released id fails tests/treerelease.test.mjs unless `core.version` (src/data/tree/core.json, currently 4) is bumped AND a migration step exists in `src/meta/migrations/` (`tree-v3.js`, `tree-v4.js` are the models, each with a frozen price table in its own file such as `tree-v3.prices.js`). Take a new snapshot after every release.
2. **Tombstones.** An id is never renamed, reused or silently deleted. To remove one, add it to `retired` in `src/data/tree/core.json` (keeps its fragment slot, reuse fails compile) and add a migration step that refunds it at the price paid from a frozen table (model: hero lanterns in tree-v4, tests/chars-save.test.mjs "step 4"). Gates are permanent forever. Additive content (new cluster, hero, chapter, ring node) needs no step.
3. **Id snapshot.** `tests/fixtures/tree-ids.json` is append-only; `tree-validate` fails if an id moved or vanished, or if a new id was not added deliberately.
4. **Save versions.** `SAVE_VERSION` (src/save/schema.js, currently 3) and `core.version` are separate. A save bump needs a migrate step in schema.js, a frozen-fixture test (tests/fixtures/save-v2.json is the model), hostile-save tests (tests/savev3.test.mjs, tests/savereview.test.mjs). Confirm the forward-tolerant store (src/save/store.js: a newer save is read-only) is in the release BEFORE any further bump, and never roll main back across a bump (docs/design/save-v3-review.md). Storage keys keep the old `hollowlight:` names on purpose; do not rename them.
5. **Imports and URL params** are untrusted: validate, clamp, never `innerHTML`.
6. **Release process.** `npm test`, `npm run build`, `npm audit` reported, security-review row updated (docs/security-review-v1.md), CREDITS current. PR dev -> main with CI green (required check `test`); only with Matt's explicit yes.

## 11. Done-checklist to paste into the report

- [ ] Three options offered, Matt's pick in docs/LOCKED.md; no LOCKED conflict
- [ ] Data in JSON; code only where JSON cannot express it
- [ ] `npm test` green, `npm run build` OK, `tree-validate` green (if the tree is touched)
- [ ] Sweeps run, numbers vs bands reported with seed counts and noise
- [ ] Screenshots true size + phone size (visual pieces)
- [ ] Security check line, Fit check line
- [ ] LOCKED, QUEUE and the design doc updated
- [ ] Release guards considered (snapshot, tombstone, ids, save versions)
- [ ] Right now / Next / Parked
