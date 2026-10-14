# Skill tree v1 (P7)

> **Principle: the tree must reward exploration.** Different enemies, stages, builds and heroes unlock different nodes. The player should want to kill a new enemy, enter a new chapter, try another hero or evolve another weapon *because* a greyed-out node is waiting for it. Every locked node shows what unlocks it and how far along the player is.

Layout and feel follow the Spirit Hunters: Infinite Horde reference (Matt's first love): a large radial web around a hub, nodes that light up as you own them, new abilities and options unlocking as you go, and real choices between branches. A research file, `docs/research/19-spirit-hunters-reference.md`, is being written in parallel; this design will be reconciled with it when it lands.

Status: v1 built (version 0.4.0, 66 nodes: 63 real + 3 teasers). Data: `src/data/tree.json`. Logic: `src/meta/tree.js` (pure JS). Screen: `src/ui/treescreen.js`. Tests: `tests/tree.test.mjs`. Budget script: `node scripts/tree-budget.mjs [--table]`.

## 1. Fit with Hollowlight

- **Identity.** The Hollow starts grey and drained; spirits bring colour back. The hub is "Hollowlight", the lantern at the centre of the web; branches grow out of it and light up as they are owned. Node names use the spirit/light/dusk vocabulary (Warm Embers, Last Light, Dusk Lightning, Black Feather Oath). Visual styling is deliberately plain (existing CSS tokens) until Matt picks the art identity; only the structure and the "owned nodes glow" behaviour are final.
- **Mechanical sense.** Every node maps to an existing sim hook, a weapon stat, or one small new hook (section 5). Nothing changes the locked design: reroll and banish are early unlocks (not available at start), characters keep a 60 s ability, tree cooldown reduction floors at 30 s, weapons stay summons and magic only, and no existing weapon or hero is gated behind the tree (the schema supports it; see section 6).

## 2. Branches: distinct identities and real choices

| Branch | Direction | Identity | Typical nodes |
|---|---|---|---|
| Spirit | bottom | Verbs and the ability: how a run feels | reroll x3, banish x3, ability cooldown x4 (floor 30 s), ability duration, auto-activate, global damage |
| Summoner | left | Wolves and ravens: hungrier, faster spirits | summon damage, level-up surge, Ghost Wolves and Raven Flock nodes |
| Magic | right | Bolts, lightning, orbit: sharper, faster, wider light | magic damage, cast speed, area, evolution attunement, Spirit Bolts / Chain Lightning / Holy Orbit nodes |
| Light | top | The lantern bearer: health, healing, pickups, fortune | max health, heal on level-up, hearts, magnets, XP, gold, Last Light revive |

**Keystones (change a verb or force a trade, marked KEYSTONE).** Mutually exclusive pairs, enforced by `excludes` in the data, by `buy`, and by save sanitising:

| Pair | Choice |
|---|---|
| Bonded Pack (Summoner) vs Unbound Light (Magic) | Lean summons (+summon damage, less magic damage) or lean magic (the reverse). Changes which of your weapons you want. |
| Lantern-Bearer (Light) vs Glass Dusk (Light) | Sturdier (+health, level-up healing, a little less damage) or glass cannon (+damage, -health). |

Other "new verb" nodes (not just +%): Reroll and Banish (Spirit), Last Whistle (auto-activate the ability below 30% health), Rousing Light (level-ups surge your summons), Attuned Hands (evolution-pair cards appear more often), Last Light (one revive per run).

## 3. Unlock system: explore to unlock

### 3.1 Tracked stats (`save.stats`, all sanitised and clamped)

`kills`, `runs`, `wins`, `bestTime`, `totalPlayTime`, `bestLevel`, `totalGold`, plus maps keyed by id (max 32-64 keys, ids `[a-z0-9_]{1,40}`, values clamped to 1e9, prototype keys dropped):

| Map | Meaning | Updated by `bankRun` from the sim's `result()` |
|---|---|---|
| `killsByEnemy` | kills per enemy id | `sim.killsByEnemy` |
| `bossKills` | bosses killed per boss id | `bossId` when `bossKilled` |
| `chapters[id]` | `{runs, clears, bestTime}` per chapter | `chapter`, victory = clear |
| `evolved` | evolutions taken per evolution id (weapon derived from `evolutions.json`) | each weapon's `evo` |
| `weaponsUsed` | runs each weapon was in the loadout | `weapons[]` |
| `charsUsed` | runs per hero | `character` |

Stored totals are never trusted beyond clamping; the tree is re-validated against the stats on every load/import (section 7).

### 3.2 Conditions (data-driven, composable)

A node's optional `unlock` is a condition object. Leaf types: `killEnemy{id,n}`, `clearChapter{id,n=1}`, `surviveTime{chapter,seconds}`, `evolveWeapon{id|"any",n=1}`, `useCharacter{id,n=1}`, `bossKill{id,n=1}`, `totalKills{n}`, `totalGold{n}`, `bestLevel{n}`, `runs{n}`. Composites: `{t:"all",of:[...]}` (progress = average), `{t:"any",of:[...]}` (progress = best). Limits: depth 4, at most 10 leaves. References (enemy, chapter, weapon, hero ids) are checked against the game data at load time.

### 3.3 Locked nodes in v1 (15, plus 3 teasers)

| Node | Condition | Nudges the player to |
|---|---|---|
| Alpha's Calling (wolf bite and bleed) | slay 1000 Forest Wolves | hunt wolves |
| Black Feather Oath (raven damage and reach) | slay 1500 Carrion Crows | hunt crows |
| Heartwood Ward (+health) | slay 400 Root Crawlers | fight the slow tanky enemy |
| Elder's Marrow (heal on level-up) | defeat the Elder Treant | reach and beat the boss |
| Last Light (revive) | clear Cursed Forest | win a run |
| Vigil of the Night (+XP) | survive 10:00 in Cursed Forest | reach the boss |
| Twin Wisps (bolt damage and speed) | evolve Spirit Bolts | build toward that evolution |
| Seventh Light (orbit damage and radius) | evolve Holy Orbit | build toward that evolution |
| Convergence (area and reach) | evolve any weapon 3 times | take evolutions |
| Votive Flame (orbit damage) | 3 runs as Elias | play the priest |
| Orphan's Instinct (wolf damage) | 3 runs as Wren | play the orphan |
| Scavenger's Eye (pickup radius) | slay 500 wolves OR 800 crows | either hunt (OR example) |
| Grave Wealth (gold) | earn 20000 gold in total | long-term play |
| Dusk Mastery (damage) | clear Cursed Forest AND 5 evolutions (AND example) | mastery |
| Dawnlight (damage), hidden | reach level 50 in a run | shows as `???`, conditions unknown until progress begins |

**Teasers** (Marsh-Light, Witch-Fire, Drowned Crown) are permanently locked `???` nodes belonging to chapters that do not exist yet. Their conditions reference future ids (`drowned_marsh`, `bog_witch`, `drowned_king`) that are not validated and never progress; they cannot be bought or owned, and they show only "Belongs to a part of the Hollow you have not reached." Implementing those chapters is parked.

### 3.4 Showing progress

- Detail panel: each condition line with `340/1000` and a progress bar; done lines are marked.
- On the map: a locked node whose condition is partly met shows a progress ring (`--p`); hidden/teaser nodes stay `???` and show no ring until progress begins.
- Results screen: **Newly unlocked in the Skill Tree** (conditions met by this run) and **Closest unlocks** (top 3 by progress %), plus a "Spend gold" button that opens the tree.
- Tree screen: an available node whose condition has been met and that has not been looked at yet gently pulses (`save.seen`, sanitised, set when a node is selected). Reduced-motion removes the pulse.

## 4. Node schema (`src/data/tree.json`)

```
{ "version": 1,
  "layout": { "ringStep": 110, "minGap": 50 },
  "branches": { "<id>": { "name", "angle" (deg), "color" (#rrggbb), "blurb" } },
  "nodes": [ {
    "id": "su_bond", "name": "Bound Spirits", "branch": "summoner",
    "ring": 1, "ang": 180,              // radial layout: distance = ring * ringStep, angle in degrees; x,y are computed
    "desc": "...", "flavour": "...",
    "maxRank": 2, "cost": { "gold": 120, "shards": 0 }, "rankCost": 1.6,   // rank n costs gold * rankCost^(n-1), shards per rank
    "requires": ["id", ...],            // all must be owned (rank >= 1); none = attached to the hub
    "excludes": ["id", ...],            // rivals: owning one closes the others (kept symmetric)
    "effects": [ ... ],                 // see below; empty only for teasers
    "unlock": { condition },            // optional (section 3.2)
    "hidden": true, "teaser": true, "keystone": true } ] }
```

Effects (value per rank, summed over ranks):

| Effect | Meaning |
|---|---|
| `{mod: damage/area/cooldown/speed/pickup/xp/gold/abilityCd, pct}` | `sim.mods.<key>` = 1 + sum(pct)/100; cooldown/abilityCd clamp at 0.5 |
| `{player: maxHp, pct}` / `regen, add` / `levelHeal, pct` / `revive, frac` | max health multiplier; hp per second; % of max health healed per level-up; one revive at `frac` health |
| `{drop: heart/magnet/heartHeal, pct}` | drop chance / heal multipliers |
| `{ability: "dur", pct}` | Pack Howl / Sanctuary last longer |
| `{perk: "evoLuck", pct}` / `{perk: "rush", pct, secs}` | evolution-pair card weight; level-up surge for summons |
| `{weapon: id or @summon/@magic/@all, stat, pct or add}` | bonus applied to a weapon stat after ranks (`stat` must exist) |
| `{unlock: rerolls/banishes, n}` | per-run reroll/banish count (cap 9) |
| `{unlock: autoAbility, hp}` | ability fires by itself below `hp` of max health |
| `{unlock: weapon/hero/abilityUpgrade/modifier, id}` | **unlock nodes** (section 6) |

Scalability to 500+ nodes: positions are polar (`ring`, `ang`) so a generator can place nodes without hand-typed x,y; `compileTree` validates in O(n) plus an O(n^2) overlap check that is fine into the low thousands (a 600-node tree compiles in about 0.1 s in the tests); a spatial grid (`queryRect`) lets the screen create DOM nodes only near the viewport; lines are drawn on one canvas with off-screen edges culled. Hard limits: 5000 nodes, ring <= 60.

## 5. How each effect becomes a real game effect

| Effect | Where it lands |
|---|---|
| `mod.*` | existing `sim.mods` (damage in `dmgMult`, area/cooldown in weapon code, speed in `updatePlayer`, pickup in gem/pickup radius, xp/gold when collected, abilityCd in `abilityCooldown`) |
| weapon bonus | `computeStats(def, ranks, bonus)` in `cards.js`: `(base + perRank*rank + add) * (1 + pct/100)`; stored on the weapon so level-ups, debug grants and evolutions keep it. Tags expand via `weapons.json` `type` (summon or magic) |
| `maxHp`, `regen`, `levelHeal`, `revive` | player setup, `updatePlayer`, `checkLevelUp`, `damagePlayer` (one revive, 2 s of i-frames) |
| `drop.*` | `rollDrops` probabilities and the heart heal amount |
| `ability.dur`, `autoAbility`, `abilityCd` | `useAbility` durations, `step` (auto fire), `abilityCooldown` = max(30 s floor, cooldown x mult) |
| `rush`, `evoLuck` | `dmgMult` for summon weapons while the surge buff runs; pair weight in `buildPool` |
| `unlock rerolls/banishes` | `rerollsLeft` / `banishesLeft` at run start (debug URL values are added on top) |
| `unlock weapon` | `buildPool` skips weapons flagged `treeGate:true` until unlocked |
| `unlock hero` | start screen skips characters flagged `treeGate:true` until unlocked |

The tree is applied once at run start (`aggregateMods(save.tree)` into `new Sim({tree})`), so the sim stays deterministic and tree-less runs are identical to before. Flat `count`, `chains` and `pierce` bonuses work through the same weapon-bonus path (tested), but only pierce and chain on single nodes ship (Piercing Wisp, Forked Arc); flat spirit counts were removed after the bot measured them as the strongest effect (section 11).

## 6. Unlock-type nodes

`unlock` effects are the "new thing appears" nodes. Shipped and enforced: Second Glance / Third Glance / Clear Sight (reroll), Let It Pass / Let It Fade / Banish the Dusk (banish) and Last Whistle (auto-activate below 30% health). Schema, validation, save handling and tests also exist for `weapon`, `hero`, `abilityUpgrade` and `modifier` unlocks, but **no node of those kinds ships**, because gating an existing weapon or hero behind the tree would change the locked design (weapons and heroes are available from the start). The mechanism is tested with synthetic data that opts in with `treeGate:true`. Decision for Matt: which future weapons/heroes (Lantern Wisps, Grave Hand, Frost Bell, Bone Servant, Soul Harvest, new heroes) should be tree unlocks rather than level-gated.

## 7. Rules and security

- **Buying** (`buy`): atomic. It re-checks the node exists, the max rank, prerequisites, rivals, the unlock condition, teaser status, and gold and shards; only then does it deduct and set the rank in one step. A failed buy changes nothing. Unknown ids, prototype keys and non-strings are rejected.
- **Respec (decision): free and total in v1.** All gold and shards spent are returned (recomputed from the owned nodes and the current costs, never from a stored total) and the tree is cleared. Reason: simplest and safest, encourages trying branches and the keystone choices, and nothing can be exploited because refunds equal exactly what the same nodes cost. A fee can be added later in one place (`respec`).
- **Save v2** (migration `1 -> 2`): carries gold, shards, stats and settings, resets the v1 placeholder tree, and the new stat maps start empty. Existing prototype saves migrate cleanly.
- **Sanitising** (`sanitizeTree`, run on every load, import and bank): unknown ids dropped; ranks floored and clamped to the node max; negative or non-numeric ranks dropped; prerequisite violations, rival pairs, teasers and unmet unlock conditions dropped (parents processed first). Stat maps are rebuilt from whitelisted keys with numeric clamps. A hostile save cannot create nodes, ranks or stats outside what the data allows. Limitation (client-only game): a player can still edit their own gold; that is out of scope (no server).
- **Data validation** (`compileTree`): rejects duplicate ids, reserved ids (`hub`, prototype keys), unknown or self prerequisites, cycles, negative or fractional or huge costs, bad ranks, overlapping nodes, unknown effect kinds, out-of-range values, unknown weapon/stat/enemy/chapter/hero ids (except in teasers), empty effects, and bad conditions.
- **UI**: every string from data is inserted with `textContent`; no `innerHTML` with data-derived text in the tree screen or the results additions.

## 8. Tree screen

Reachable from the title screen ("Skill Tree") and the results screen ("Spend gold"). A pannable, zoomable radial web: hub at the centre, round nodes joined by lines.

- **Navigation:** drag, mouse wheel (zoom to cursor), two-finger pinch, arrow keys / WASD to pan, +/- to zoom, 0 or Home to recentre, Tab to move between nodes, Esc to back out, Enter to buy the selected node.
- **States:** owned nodes are filled and glow (CSS transition on `box-shadow`/`filter`, removed under reduced motion); buyable nodes are outlined, and glow when affordable; locked nodes are greyed (prerequisites missing, rival taken, or condition unmet with a progress ring); teasers are dashed `???`; keystones are square-ish; partly ranked nodes show `rank/max`.
- **Path highlighting:** selecting a node lights its whole route to the hub (thick white line and highlighted ancestor nodes); lines between owned nodes are coloured in the branch colour.
- **Detail panel:** name, branch, tier, rank, effect, flavour, requirement or condition lines with progress, cost, Buy (two-step confirm) and a free Respec (two-step confirm) in the top bar.
- **Scale:** nodes are DOM buttons created only inside the viewport (spatial grid), lines on one canvas; works at phone width (44+ px nodes at default zoom, bottom detail panel).

## 9. Power budget (design-time estimate)

Rule from the research (`docs/research/03`): the whole tree should add at most about +40% effective power, and no node should be a trivial "+1%". The estimator is `node scripts/tree-budget.mjs` (weights below are in the script). It converts every effect into **power-equivalent points (PE)**, where +1 PE is about +1% effective power for a typical build. Weights dilute an effect by how often a typical four-weapon build benefits from it: global damage x1.0; summon-tag or magic-tag weapon damage x0.35 (about a third of a typical build); single-weapon damage x0.08; cast speed x0.3 of the DPS gain; area x0.12; max health x0.2; heal on level-up x0.4 per percent; revive 4; hearts x0.04; flat count +1 on a tag x2.5 (none ship). Economy, ability and verb effects (XP, gold, pickup, move speed, ability cooldown, rerolls, banishes, auto-activate, evolution luck) are reported separately as *utility* and are not counted against the cap. Mutually exclusive keystones count only the better side of each pair.

| Branch | Combat PE |
|---|---|
| Spirit | 4.0 |
| Summoner | 12.3 |
| Magic | 12.1 |
| Light | 13.0 |
| **Total (cap 40)** | **41.4** (about at the cap; utility, not capped: 15.6) |

Largest single nodes: Last Light 4.0, Edge of Dusk 2.0, Dusk Mastery 2.0, Dawnlight 2.0, Alpha's Calling 1.8. No node is a stand-alone "+1%": the smallest percentage effects are +2% to +3.5% on the thing they touch (global damage +2%, summons +3.5%, magic +3.5%, health +2.5%) and every weapon node is +5% to +7% on its weapon; the rest are verbs, keystones or unlocks. The PE weights are an estimate; section 11 shows the measured result, which is much stronger than the estimate says.

How it stays under the cap: counts of spirits (+1 wolf and similar) were measured as the strongest single effect in the game and were removed from the shipped nodes (the schema still supports them); overlapping stat nodes were merged (fewer, bigger nodes); the two Summoner/Magic and the two Light keystones are exclusive pairs; revive returns only 20% health once per run.

## 10. Economy

Source: the headless bot, no tree, 16 seeds per hero (`bankRun` banks the sim's `result().gold` and `shards`; `result().gold` already includes kill gold times the gold mod and the Grave Coins fallback card).

| Hero | Average gold per run | Gold in a winning run | Average shards per run | Average time |
|---|---|---|---|---|
| Wren | about 1900 | about 2700 | 1.9 | 11:50 |
| Elias | about 1700 | about 2700 | 1.6 | 11:10 |

Shards come only from the boss (5 per Elder Treant kill; the bot kills it in about 38% of runs).

| Quantity | Value |
|---|---|
| Total tree cost | 58,430 gold + 25 soul shards (63 real nodes) |
| Runs to buy everything (bot pace, about 1800 gold) | about 32 runs; about 45 runs at a casual 1300 gold per run |
| Shard pacing | 25 shards = 5 boss kills, about 13 bot runs; shards are the long pole for keystones, Last Light and the cooldown capstone |
| First purchases | Reroll 150, Banish 150, Bound Spirits 190, Moon-Touched 190, Warm Embers 190: the first run (about 800 to 1700 gold, even a short defeat) buys four to six nodes |
| Cost curve | tier 1 about 150-200, tier 2 about 270-700, tier 3 about 600-1100, tier 4 about 900-2100, tier 5 about 1500-2100 (+shards), tier 6 about 1200-2700 |

Gold costs are single-run affordable in the early tiers on purpose (a sense of accomplishment after run one); the long tail is the locked nodes (explore) and shards (beat the boss).

## 11. Balance check with the bot (measured)

Measured on the shipped values except three small late tweaks made afterwards (Dusk Mastery, Dawnlight and Convergence, each well under +1% effective).

`META=none|half|full node scripts/sweep-all.mjs 48 wren,elias` (48 seeds per row, random-pick bot and focus-pick bot, `half` = cheapest half of the total gold cost, `full` = every non-teaser node, ignoring unlock conditions, first listed rival taken). The bot also uses rerolls and banishes (reroll when no weapon card and no started stat appears; banish fallback cards).

| Hero / bot | none win% | half win% | full win% | level none / half / full | first evolution none / half / full |
|---|---|---|---|---|---|
| Wren, random | 25% | 75% | 100% | 38 / 50 / 50 | 6:31 / 6:26 / 7:11 |
| Wren, focus | 44% | 90% | 98% | 44 / 50 / 49 | 4:59 / 4:28 / 4:53 |
| Elias, random | 19% | 94% | 100% | 36 / 49 / 49 | 6:51 / 7:46 / 7:42 |
| Elias, focus | 44% | 100% | 100% | 43 / 50 / 49 | 5:38 / 5:19 / 5:04 |

**The target (random bot with a full tree at or below about 60%) is NOT met.** The finding, and why it matters:

- The base game sits on a knife edge for this bot: tiny changes in power swing the win rate by tens of points. Dropping any single group of effects from the full tree (counts, hearts, rerolls, health, damage, cast speed, ability, XP and pickup, verbs) still left 79% to 100%; in an earlier, stronger iteration the cheapest 10% of the tree's cost moved a no-tree 25% to about 33% and the cheapest 20% to about 70%. The win rate behaves like a sum of many small contributions on a steep slope, so no combination of "noticeable" nodes can stay under 60% at full.
- Reaching 60% at full would need every effect cut to roughly +1% or less, which contradicts the "avoid tiny nodes" rule. This is a base-difficulty problem, not a node-value problem.
- The tree is therefore tuned to the design-time budget (section 9) rather than the win-rate target, and the conflict is reported for Matt's decision (section 12).

Evidence from earlier iterations (24 seeds, Wren, random bot, older and larger values): whole branches alone gave Spirit 17-25%, Summoner 33-69%, Magic 67-81%, Light 71-100%; flat +1 counts alone about +25 points, revive alone about +8, percentage-only effects at a third of the original size about +17. Values were halved, tiny two-rank nodes merged, flat counts and most pickup/XP gains removed; the final numbers above are after that pass.

## 12. Decisions for Matt

1. **Difficulty vs the tree (needs a call).** Either raise the base difficulty (for example enemy HP scaling) so a no-tree bot wins about 5-10% and a full-tree bot about 60%, or pair the tree with difficulty tiers (the `modifier` unlock kind is ready; Brotato-style: win to unlock a tier). Until then a bought-out tree trivialises Chapter 1. Nothing in the base balance was changed.
2. **Branch exclusivity.** Summoner vs Magic and Lantern vs Glass are exclusive keystone pairs. Alternative: make the whole Summoner and Magic branches exclusive at the root (stronger "meaningful choice", weaker tree for each hero).
3. **Weapons and heroes as tree unlocks.** The schema supports gating (`treeGate`); nothing ships gated. Decide whether future weapons/heroes should unlock from the tree.
4. **Respec** is free in v1. Add a fee later if you want commitment.
5. **Flat spirit counts** (+1 wolf, +1 raven) were removed as too strong; reintroduce them only as rare, late rewards after decision 1.
6. **Teasers** advertise three future chapters. Their names (Marsh-Light, Witch-Fire, Drowned Crown) are placeholders.

## 13. Security check and Fit check

- **Security check:** no new dependencies. All tree data is validated at load (`compileTree`) and all save/import data is sanitised (`sanitizeTree`, whitelisted stat maps, clamps, prototype keys dropped); `spentOf` clamps ranks to the node max so a hostile rank cannot loop; buying is atomic; the tree screen uses `textContent` only. Tests cover prototype pollution, huge/negative/string ranks, unknown ids, prerequisite/rival/condition violations, stat clamping and migration. `npm audit` was not re-run (no dependency changes).
- **Fit check:** a radial web of lit nodes around "Hollowlight", branches that match the summoner/magic/light fantasy, names and flavour in the Hollow/dusk vocabulary, mechanics that change existing hooks only, and unlocks that reward killing different enemies, entering different chapters, evolving weapons and playing different heroes.

## Appendix A. Node list (generated: `node scripts/tree-budget.mjs --table`)

Gold is the total across ranks. "Combat PE" excludes utility effects (rerolls, banishes, ability, XP, gold, pickup, speed, evolution luck), which is why those rows show 0.0. Rows marked (rival) are one side of an exclusive pair.

| id | name | branch | tier | ranks | gold | shards | requires | unlock condition | effect (numbers are per node) | combat PE (utility not counted) |
|---|---|---|---|---|---|---|---|---|---|---|
| sp_reroll1 | Second Glance | spirit | 1 | 1 | 150 | 0 | hub |  | Unlocks Reroll: +1 per run. Redraw the three level-up cards (R). | 0.0 |
| sp_ban1 | Let It Pass | spirit | 1 | 1 | 150 | 0 | hub |  | Unlocks Banish: +1 per run. Remove a card from the pool for the rest of the run. | 0.0 |
| sp_reroll2 | Third Glance | spirit | 2 | 1 | 270 | 0 | sp_reroll1 |  | +1 reroll per run. | 0.0 |
| sp_reroll3 | Clear Sight | spirit | 3 | 1 | 600 | 0 | sp_reroll2 |  | +1 reroll per run. | 0.0 |
| sp_ban2 | Let It Fade | spirit | 2 | 1 | 330 | 0 | sp_ban1 |  | +1 banish per run. | 0.0 |
| sp_ban3 | Banish the Dusk | spirit | 3 | 1 | 720 | 0 | sp_ban2 |  | +1 banish per run. | 0.0 |
| sp_cd1 | Steady Breath | spirit | 2 | 1 | 300 | 0 | sp_reroll1, sp_ban1 |  | Ability cooldown -10% (60s to 54s). | 0.0 |
| sp_cd2 | Quickening Spirit | spirit | 3 | 1 | 660 | 0 | sp_cd1 |  | Ability cooldown -10% more. | 0.0 |
| sp_cd3 | Hollow Rhythm | spirit | 4 | 1 | 1350 | 0 | sp_cd2 |  | Ability cooldown -10% more. | 0.0 |
| sp_cd4 | Unbroken Rhythm | spirit | 5 | 1 | 2100 | 2 | sp_cd3 |  | Ability cooldown -15% more. With every cooldown node the ability returns in 33s; it can never be faster than 30s. | 0.0 |
| sp_dur | Long Howl | spirit | 4 | 1 | 900 | 0 | sp_cd2 |  | Pack Howl and Sanctuary last 25% longer. | 0.0 |
| sp_auto | Last Whistle | spirit | 4 | 1 | 1050 | 0 | sp_cd2 |  | Unlocks auto-activate: your ability fires by itself when health falls below 30%. | 0.0 |
| sp_edge | Edge of Dusk | spirit | 5 | 1 | 1500 | 0 | sp_dur |  | All your spirits and spells deal +2% damage. | 2.0 |
| sp_mastery | Dusk Mastery | spirit | 6 | 1 | 2700 | 2 | sp_edge | Clear Cursed Forest AND Evolve weapons 5 times | All damage +2%. | 2.0 |
| su_bond | Bound Spirits | summoner | 1 | 1 | 190 | 0 | hub |  | Summoned spirits (wolves, ravens) deal +3.5% damage. | 1.2 |
| su_call | Pack's Calling | summoner | 2 | 1 | 450 | 0 | su_bond |  | Ghost Wolves move 6% faster. | 0.2 |
| su_pot | Lantern-Fed | summoner | 2 | 1 | 390 | 0 | su_bond |  | Summons deal +2% damage. | 0.7 |
| su_rush | Rousing Light | summoner | 3 | 1 | 750 | 0 | su_bond |  | New verb: each time you level up your summons surge, +25% damage for 6 seconds. | 1.5 |
| su_swift | Swift Spirits | summoner | 3 | 1 | 540 | 0 | su_call |  | Wolves and ravens move 6% faster. | 0.5 |
| su_key | Bonded Pack (keystone) | summoner | 5 | 1 | 1800 | 3 | su_rush |  | KEYSTONE: summons deal +12% damage, but magic deals -9%. Closes Unbound Light. | 1.0 |
| wf_fang | Fang Sharpening | summoner | 3 | 1 | 480 | 0 | su_call |  | Ghost Wolves bite for +6% damage. | 0.5 |
| wf_bleed | Deep Bite | summoner | 4 | 1 | 660 | 0 | wf_fang |  | Ghost Wolves bleed their prey +0.5s longer. | 1.3 |
| wf_third | Alpha's Calling | summoner | 5 | 1 | 1500 | 0 | wf_bleed | Slay 1000 Forest Wolf | Ghost Wolves bite for +6% damage and bleed 0.5s longer. | 1.8 |
| rv_talon | Keen Talons | summoner | 3 | 1 | 480 | 0 | su_pot |  | Raven Flock pecks for +6% damage. | 0.5 |
| rv_wide | Wider Murder | summoner | 4 | 2 | 1560 | 0 | rv_talon |  | Raven Flock circles +7 wider per rank. | 1.4 |
| rv_oath | Black Feather Oath | summoner | 5 | 1 | 1500 | 0 | rv_wide | Slay 1500 Carrion Crow | Raven Flock pecks for +6% damage and circles 7 wider. | 1.2 |
| ch_wren | Orphan's Instinct | summoner | 4 | 1 | 600 | 0 | su_swift | Play 3 runs as Wren | Ghost Wolves bite for +5% damage. | 0.4 |
| tz_marsh | Marsh-Light (teaser) | summoner | 7 | 1 | 0 | 0 | su_key | unknown (future chapter) | A spirit that waits beyond this forest. | - |
| ma_focus | Moon-Touched | magic | 1 | 1 | 190 | 0 | hub |  | Magic weapons (bolts, lightning, orbit) deal +3.5% damage. | 1.2 |
| ma_cast | Quickened Casting | magic | 2 | 1 | 670 | 0 | ma_focus |  | Spirit Bolts and Chain Lightning cast 3.5% faster. | 1.1 |
| ma_area | Widening Light | magic | 2 | 1 | 580 | 0 | ma_focus |  | Areas and reach +9.5% (orbit size, raven circle, lightning jumps). | 1.1 |
| ma_attune | Attuned Hands | magic | 4 | 1 | 1050 | 0 | ma_focus |  | New verb: cards that complete an evolution pair appear 50% more often. | 0.0 |
| ma_pow3 | Dusk Lightning | magic | 5 | 1 | 2100 | 1 | ma_attune |  | Magic deals +2.5% damage. | 0.9 |
| ma_key | Unbound Light (keystone) | magic | 5 | 1 | 1800 | 3 | ma_attune |  | KEYSTONE: magic deals +12% damage, but summons deal -9%. Closes Bonded Pack. | 1.0 (rival) |
| ma_ascend | Convergence | magic | 6 | 1 | 1800 | 0 | ma_pow3 | Evolve weapons 3 times | Areas and reach +5%. | 0.6 |
| bo_pierce | Piercing Wisp | magic | 3 | 1 | 600 | 0 | ma_cast |  | Spirit Bolts pierce +1 enemy. | 1.0 |
| bo_swift | Swift Wisps | magic | 4 | 1 | 540 | 0 | bo_pierce |  | Spirit Bolts fly 9% faster. | 0.4 |
| bo_twin | Twin Wisps | magic | 5 | 1 | 1500 | 0 | bo_swift | Evolve Spirit Bolts | Spirit Bolts strike for +6% damage and fly 6% faster. | 0.7 |
| or_power | Burning Orbs | magic | 3 | 1 | 480 | 0 | ma_area |  | Holy Orbit burns for +6% damage. | 0.5 |
| or_wide | Wider Halo | magic | 4 | 2 | 1560 | 0 | or_power |  | Holy Orbit circles +6 wider per rank. | 1.3 |
| or_seventh | Seventh Light | magic | 5 | 1 | 1500 | 0 | or_wide | Evolve Holy Orbit | Holy Orbit burns for +6% damage and circles 6 wider. | 1.1 |
| ch_elias | Votive Flame | magic | 4 | 1 | 600 | 0 | ma_focus | Play 3 runs as Elias | Holy Orbit burns for +5% damage. | 0.4 |
| cl_arc | Forked Arc | magic | 3 | 1 | 600 | 0 | ma_area |  | Chain Lightning jumps +1 time. | 1.0 |
| cl_power | Static Heart | magic | 4 | 1 | 570 | 0 | cl_arc |  | Chain Lightning strikes for +7% damage. | 0.6 |
| cl_storm | Storm Mantle | magic | 5 | 1 | 1560 | 1 | cl_power |  | Chain Lightning reaches 6% further. | 0.2 |
| tz_witch | Witch-Fire (teaser) | magic | 7 | 1 | 0 | 0 | ma_key | unknown (future chapter) | A spell that waits beyond this forest. | - |
| li_vigor | Warm Embers | light | 1 | 1 | 190 | 0 | hub |  | Maximum health +3.5%. | 0.7 |
| li_reach | Reaching Light | light | 2 | 1 | 480 | 0 | li_vigor |  | Pickup radius +16%. | 0.0 |
| li_step | Light Step | light | 2 | 1 | 430 | 0 | li_vigor |  | Move speed +3.5%. | 0.0 |
| li_study | Bright Memory | light | 2 | 1 | 670 | 0 | li_vigor |  | Experience gained +7%. | 0.0 |
| li_scav | Scavenger's Eye | light | 3 | 1 | 450 | 0 | li_reach | Slay 500 Forest Wolf OR Slay 800 Carrion Crow | Pickup radius +8% more. | 0.0 |
| li_oak | Steadfast Heart | light | 3 | 1 | 600 | 0 | li_vigor |  | Maximum health +2.5%. | 0.5 |
| li_regen | Growing Warmth | light | 3 | 1 | 1060 | 0 | li_step |  | Every level-up heals 2.5% of your maximum health. | 1.0 |
| li_coin | Grave Coins | light | 3 | 1 | 720 | 0 | li_study |  | Gold found +16%. | 0.0 |
| li_hearts | Bright Hearts | light | 4 | 1 | 840 | 0 | li_regen |  | Hearts drop 30% more often. | 1.2 |
| li_heal | Mending Light | light | 4 | 1 | 960 | 0 | li_oak |  | Hearts heal 25% more. | 1.0 |
| li_magnet | Pull of the Moon | light | 4 | 1 | 750 | 0 | li_study |  | Soul Magnets drop 50% more often. | 0.0 |
| li_root | Heartwood Ward | light | 4 | 1 | 750 | 0 | li_oak | Slay 400 Root Crawler | Maximum health +2.5%. | 0.5 |
| li_vow | Vigil of the Night | light | 4 | 1 | 900 | 0 | li_coin | Survive 10:00 in Cursed Forest | Gold found +8%. | 0.0 |
| li_hoard | Grave Wealth | light | 4 | 1 | 1050 | 0 | li_coin | Earn 20000 gold in total | Gold found +10%. | 0.0 |
| li_lantern | Lantern-Bearer (keystone) | light | 5 | 1 | 1800 | 3 | li_hearts |  | KEYSTONE: maximum health +6% and level-ups heal 1% more, but damage -2.5%. Closes Glass Dusk. | -0.9 (rival) |
| li_last | Last Light | light | 5 | 1 | 900 | 5 | li_regen | Clear Cursed Forest | New verb: once per run, a killing blow returns you at 20% health instead. | 4.0 |
| li_glass | Glass Dusk (keystone) | light | 5 | 1 | 1800 | 3 | li_magnet |  | KEYSTONE: damage +3.5%, but maximum health -9%. Closes Lantern-Bearer. | 1.7 |
| li_elder | Elder's Marrow | light | 6 | 1 | 1200 | 2 | li_last | Defeat Elder Treant | Every level-up heals 1% of your maximum health. | 0.4 |
| li_dawn | Dawnlight (hidden) | light | 6 | 1 | 1500 | 0 | li_vow | ??? (hidden: Reach level 50 in one run) | All damage +2%. | 2.0 |
| tz_crown | Drowned Crown (teaser) | light | 7 | 1 | 0 | 0 | li_elder | unknown (future chapter) | A light that waits beyond this forest. | - |
nodes 66 (teasers 3); locked-by-condition 15
PE per branch: spirit 4.0 | summoner 12.3 | magic 12.1 | light 13.0 | COMBAT TOTAL 41.4 (cap 40) | utility 15.6 (not capped)
total cost: 58430 gold, 25 shards
largest single nodes: li_last 4.0, sp_edge 2.0, sp_mastery 2.0, li_dawn 2.0, wf_third 1.8
