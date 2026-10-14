# Progression gates v1 (design + measurements, nothing built yet)

Status: DESIGN ONLY. No file in `src/`, `tests/`, `src/data/` or `package.json` was changed. All numbers come from new probe scripts under `scripts/gates-*.mjs` (pure data swaps into the unmodified Sim). Supersedes the "no weapon or hero is gated" line of `skill-tree-v1.md` and the node-size advice in `docs/research/03` and `19` ("avoid +1% nodes").

**Matt's direction (the spec):** you do NOT have everything from the off; weapons, evolutions and abilities are locked behind gates and you unlock them by playing and trying new things. Stat nodes stay tiny (about 1-3%, "slightly notice") so the tree can grow into a huge, ever-expanding web without ever breaking balance.

## 0. Findings that shape everything (read first)

1. **Content gates alone do not change the bot's win rate.** Starter pool vs half vs everything unlocked: 27/19/29/44% vs 17/29/19/44% vs 25/44/19/44% (48 seeds, no tree; section 4). Options are sidegrades; the bot cannot value them. Their value is variety and the "I want to unlock X" pull, not power. So the win-rate ladder you want must come from the small stat/verb nodes, and the gates must be judged by pacing and variety, not by win rate.
2. **The base game is a knife edge.** The old tree "full" gives 96-100% from a 19-44% base. Even with every stat category soft-capped to 10% of its proposed size the win rate stays 67-88% (section 5), because rerolls/banishes, revive, level-heal/hearts and level-ups-surge verbs were not capped by it and the base is so close to the edge. Rule of thumb from the data: **about 2 win-rate points per power-equivalent point (PE)** near the edge.
3. **Therefore the soft cap is a growth guard, not a fix.** To make "starter 15-25% -> all 45-55%" true, the no-tree base must be tuned slightly harder (a small `hpScale` rise, to be measured in the build chunk) and the tree's total PE ceiling must be about 15 combat + 5 sustain, forever, however many nodes exist (section 3).
4. **Spirit Bolts is the easy-mode weapon and Ravens the weak one** (starter-kit test, section 4.2). Bolts as a starter gives 58-67% with no tree; Ravens with Elias gives 2%. That decides the starter pool and the gate order.

## 1. Principle: power from options, not stat inflation

| Source of power | Share of the tree | Rule |
|---|---|---|
| Options: weapons, evolutions, hero ability upgrades, heroes, run modifiers | most nodes in every new region | Each adds a new thing to find or a sidegrade; ~0 PE or small fixed PE |
| Verbs: reroll, banish, revive, auto-activate, level-up surge | few, fixed list, shipped already | Counted in the sustain budget, hard-capped |
| Small stats: 1-3% each | filler that makes the web feel dense | Subject to the soft cap below |

**Soft cap / diminishing returns (proposed):** per stat category `c`, with `S` = the plain sum of all owned node percentages and `C` = the category cap (the asymptote):

`total(S) = C * (1 - exp(-S / C))`   for `S > 0`; negative sums (keystone drawbacks) pass through unchanged.

Properties: the first nodes are worth ~100% of face value, the node that takes `S` to `C` is worth 37%, at `S = 2C` the total is 86% of `C`, at `S = 3C` 95%. Total can never exceed `C`, so 40 nodes of +2% in one category (S = 80) against `C = 8` just gives about 8%. Node tooltips show face value plus "(diminishing: +x% now)" computed from the formula. Implemented once, in `aggregateMods` (section 6), so it is one function and one test, not per node.

**Expansion rule (data checker enforces, section 3.3):** a new tree region (new chapter, hero, spirit family) must be at least 60% options/sidegrades/verbs by node count; the region's PE added to capped categories counts against the existing category caps, so a region cannot add power, only choices. Size of a stat node: face value 1-3% (about 1-3 PE per category cap of ~6-10%), never above 3%.

## 2. Starter kit and gates

### 2.1 Starter kit (run 1)

Measured (4.2): the strongest base weapon (Bolts) and the weakest (Ravens) must both be gated; Wolves and Orbit are each hero's signature and are the fair pair. **One global starter pool: Ghost Wolves + Holy Orbit** (both heroes can pick either; the signature is owned at start as today). No per-hero hook is needed.

| Hero | At run 1 | Evolutions enabled | Abilities |
|---|---|---|---|
| Wren | Ghost Wolves (owned), Holy Orbit in the card pool | Howling Legion, Sanctum Halo | Pack Howl, 60 s, manual only |
| Elias | Holy Orbit (owned), Ghost Wolves in the card pool | Howling Legion, Sanctum Halo | Sanctuary, 60 s, manual only |

Run 1 therefore has two weapons, 8 stat cards x 5 ranks, one evolution per weapon: a clean first lesson (pick, max a pair, see the gold card). Measured: median level 38-46, first evolution 3:52-4:24, so cards never run dry (fallback cards cover the tail).

### 2.2 Gate list (3 weapons + 9 evolutions), in learning-curve order

All conditions use existing `tree.js` types only (`evolveWeapon{id|any}`, `killEnemy`, `useCharacter`, `bossKill`, `clearChapter`). Counts are calibrated on the bot (4.4); the bot kills about 800 wolves / 900 crows / 190 root crawlers per run, a human who dies earlier is ~1.5x slower, so human pacing is a little longer than the "bot run" column.

| # | Unlocks | Condition | Teaches / nudges | Bot run it opens (median, p10-p90) random / focus |
|---|---|---|---|---|
| 1 | Evolution Pouncing Pack (Wolves) | Evolve Ghost Wolves once | "Evolve again: each weapon has more than one recipe" | 1 (1-1) / 1 (1-2) |
| 2 | Evolution Judgement Wheel (Orbit) | Evolve Holy Orbit once | same lesson on the other weapon | 1 (1-1) / 1 (1-2) |
| 3 | Weapon Raven Flock | Slay 4500 Carrion Crows | hunt crows | 4 (4-5) / 5 (4-6) |
| 4 | Evolution Dive Bombers (Ravens) | Evolve any weapon 4 times | take evolutions every run | 2 (2-3) / 2 (2-3) |
| 5 | Weapon Spirit Bolts | Slay 1500 Root Crawlers | fight the slow tank | 8 (5-9) / 8 (7-11) |
| 6 | Evolution Spirit Tempest (Bolts) | Defeat the Elder Treant AND evolve any weapon 6 times | reach and beat the boss | 3 (3-5) / 4 (3-6) |
| 7 | Evolution Static Storm (Chain) | Evolve any weapon 12 times | mastery of the evolve loop | 9 (7-10) / 8 (6-9) |
| 8 | Evolution Dire Alpha (Wolves) | Evolve Wolves 3 times AND slay 10000 Forest Wolves | commit to wolves | 12 (11-13) / 12 (11-14) |
| 9 | Weapon Chain Lightning | Defeat the Elder Treant 2 times AND slay 2500 Root Crawlers | repeatable boss wins | 12 (11-15) / 13 (11-16) |
| 10 | Evolution Soul Lance (Bolts) | Defeat the Elder Treant 2 times AND evolve Spirit Bolts once | needs Bolts first; boss tool | 12 (8-25) / 12 (9-17) |
| 11 | Evolution Murder Storm (Ravens) | Evolve Raven Flock once AND slay 12000 Carrion Crows | commit to ravens (the broken-strong one is late on purpose) | 13 (12-16) / 13 (12-15) |
| 12 | Evolution Thunder Judgment (Chain) | Clear Cursed Forest 3 times AND evolve Chain Lightning once | needs Chain first; wins | 24 (17-35) / 16 (14-21) |

Median bot pacing: gates 1-4, 6 within 1-5 runs; 5, 7 within 8-9; 8-11 within 12-13; 12 within 16-24. Target (about 10-25 runs for most of the Chapter 1 gates) is met for the second half; the first half is deliberately fast (learning), as asked. Gates 6, 9 and 10 depend on boss kills, which the starter-kit bot gets early (Elias starter wins ~29-44%); a weaker human will need more runs, which is the intended "later" pacing. Thunder Judgment is the long pole.

Not gated by this list: the signature weapons, stat cards, rerolls/banishes (stay early gold nodes), Chapter 1 itself. Later chapters add their own gates the same way (e.g. a Marsh enemy kill count unlocks a Marsh weapon), so Chapter 1 gates stay a closed set of 12.

### 2.3 How a gate node works (data, mostly existing)

* One tree node per gate, in the branch of its weapon (Summoner for wolves/ravens, Magic for orbit/bolts/chain), tier 2-5, `requires` the weapon's first node, small gold cost (100-600, no shards) so the gate is "unlock condition met, then spend a little gold". The existing `{unlock:'weapon', id}` effect already does weapons. Evolutions need one new effect kind (flagged, section 6).
* `hidden:true` on every gate node = shows `???` and a vague line until progress begins (`describeNode` already masks until `cond.frac > 0`). Examples: gate 5 shows `???` until the first root crawler dies; gate 6 shows progress only after a boss kill or an evolution.
* **Hidden-recipe behaviour:** the node reveals the evolution's name and weapon ("Dire Alpha (Ghost Wolves)") once progress begins, never the stat pair. A locked evolution's stat cards get no pair nudge and no "evolve" gold card. After the first time the player takes it, the pair is revealed in the results screen and a future codex (existing hidden-recipe decision).
* **UI progress:** same as skill-tree-v1 section 3.4: detail panel condition lines with `cur/goal` and bars, progress ring on the map, results screen "Newly unlocked" and "Closest unlocks". Add to the results screen one line per newly met gate: "NEW: Spirit Bolts can now appear in your level-ups. Buy it in the Skill Tree."
* A newly unlocked weapon shows the `NEW` badge in its first level-up card (existing) plus a one-line toast "Unlocked in the Skill Tree".

### 2.4 Ability unlocks (hero active, auto-activate, cooldown); Elias/Wren-specific

| Unlock | Where | Condition | Effect |
|---|---|---|---|
| Steady Breath (cooldown -10%) | Spirit, tier 2 | Complete 3 runs | existing node, add condition |
| Quickening Spirit (-10%) | Spirit | Complete 8 runs | existing node, add condition |
| Hollow Rhythm (-10%) | Spirit | Complete 20 runs | existing node, add condition |
| Unbroken Rhythm (-15%, floor 30 s) | Spirit | existing 2 shards (boss) | unchanged |
| Last Whistle (auto-activate below 30% health) | Spirit | Survive 5:00 in Cursed Forest | existing node, add condition |
| Long Howl (ability +25% longer) | Spirit | Play 3 runs as Wren OR 3 as Elias | existing node, add condition |
| Alpha's Howl (Wren): Pack Howl also calls two extra wolves while it lasts | Summoner | Play 5 runs as Wren | NEW `abilityUpgrade` node, needs a small sim hook (flagged; not in the first chunk) |
| Lingering Light (Elias): Sanctuary ground lasts 3 s after the ability ends | Magic | Play 5 runs as Elias | NEW `abilityUpgrade` node, same note |
| Orphan's Instinct / Votive Flame | existing | Play 3 runs as Wren / Elias | unchanged (tiny sidegrades) |
| Future heroes (Mara, Isolde ...) | `{unlock:'hero'}` + `treeGate` on `characters.json` (already supported) | a boss kill or a chapter clear per hero | no change needed now |

Cooldown stays floored at 30 s (locked design). The hero-specific unlocks live in the hero's own branch node cluster, so Wren and Elias each get a visible "my hero" corner.

### 2.5 Locked-design lines that change (and only these)

| Source | Current line | Change |
|---|---|---|
| `CLAUDE.md` Current state / Locked design: "V1 weapons: Ghost Wolves, Raven Flock, Spirit Bolts, Chain Lightning, Holy Orbit. 11 evolutions" and "Level-up: New weapons while slots open" | all 5 weapons and 11 evolutions available from run 1 | Run 1 pool = Wolves + Orbit + 2 evolutions; the other 3 weapons and 9 evolutions are tree gates (Matt's explicit request) |
| `CLAUDE.md` Evolutions: "maxing a specific stat pair unlocks an evolution as an extra gold card" | automatic | Also needs the evolution unlocked in the tree; the recipe stays hidden |
| `skill-tree-v1.md` section 1 and 6: "no existing weapon or hero is gated behind the tree" | no gating | Gating added for 3 weapons and 9 evolutions (heroes stay ungated for now) |
| `skill-tree-v1.md` section 9, `research/03` and `19` rule 8: "avoid +1% nodes; each purchase felt within one run" | nodes of +3.5-7% | Stat nodes become 1-3% by Matt's request; "felt" now comes from options |
| `skill-tree-v1.md` 11: target full-tree bot win <= ~60% | missed (96-100%) | Replaced by the three-tier target in 3.2 plus a harder base (open question 1) |

Unchanged: summons and magic only, 4 slots, reroll/banish early unlocks, 60 s ability with the 30 s floor, hidden recipes, evolved weapons final, free respec.

## 3. Power budget

### 3.1 PE and category caps

PE = about +1% effective power for a typical four-weapon build (weights from `scripts/tree-budget.mjs`: global damage 1.0, tag damage 0.35, single-weapon stat 0.08, cast speed 0.3, area 0.12, max health 0.2, level-up heal 0.4 per %). The cap `C` is the stat asymptote; "PE at cap" is what that category can ever contribute.

| Category | Cap C (stat %) | Weight | PE at cap |
|---|---|---|---|
| Global damage | 3 | 1.0 | 3.0 |
| Tag damage (@summon, @magic; exclusive keystones) | 6 each | 0.35 | 2.1 + 2.1 |
| Per-weapon power, summed over all weapons | each weapon 8; weight scales with 5/W weapons | 0.08 | 3.0 (pool cap) |
| Cast speed (cooldown) | 4 | 0.3 | 1.2 |
| Area / reach | 6 | 0.12 | 0.7 |
| Max health | 6 | 0.2 | 1.2 |
| Level-up heal | 1.5 | 0.4 | 0.6 |
| **Combat PE ceiling** | | | **~15 (hard validator limit 15.5)** |
| Sustain/verb PE (hearts, heart heal, revive 20%, rerolls <= 3, banishes <= 3, surge) | listed fixed values | | **ceiling 5** |
| Utility, not counted (move speed <= 5%, pickup <= 12%, XP <= 7.5%, gold <= 12%) | | | caps only |

Face value per stat node 1-3%; at these caps a category is ~90% saturated after ~3C/avg node = 6-18 nodes, which is why hundreds of extra nodes must be options, not stats.

### 3.2 Targets (bot, 48 seeds)

| State | Random bot | Focus bot | Where the power comes from |
|---|---|---|---|
| Starter kit, no tree | 15-25% | 40-50% | harder base (open question 1) |
| About half the gates + half the tree | 30-40% | 55-65% | +~7 PE |
| All gates + whole tree (incl. soft cap) | 45-55% | 65-75% | +~15 combat PE + 5 sustain |

Measured today (no base change, section 4): starter 27/29% random, 19/44% focus; half 17/19 random, 29/44 focus; all 25/19 random, 44/44 focus. Old tree full: 96-100%. So the base needs a small difficulty rise (the "no tree" rows must start 5-10 points lower) and the old tree needs to be rescaled to the table above (its category sums are already about 2-6x too large against these caps: wolf power 34.5% vs cap 8, area 14.5% vs 6, hp 14.5% vs 6, pickup 24% vs 12).

### 3.3 Validation rule (extend the data checker / `compileTree`, one test)

1. For each category, compute the plain sum over ALL owned-at-max nodes; log it, and compute `total(S)`.
2. Fail the data check if the sum of PE-at-total over categories exceeds 15.5 combat or 5 sustain, or any stat node face value exceeds 3%.
3. Fail if a region's (branch's) share of option/verb/unlock nodes is below 60%.
4. Fail if a verb count exceeds its fixed limit (rerolls 3, banishes 3, revive 1 at <= 20%).
5. `tree-budget.mjs` prints per-category S, total(S), saturation (S/C) so authors see "this category is already full, make the next node an option".

### 3.4 Why it stays healthy at 10x size

The sum is bounded by the sum of caps (PE ceiling 15 + 5 sustain), independent of node count. Stat nodes beyond saturation quietly stop mattering, so the author is pushed toward options. Each new weapon/evolution is a sidegrade measured by pacing, not power. Respec is free, so players can chase different options. The weak point is the verbs (they were the biggest single movers in the ablations, 4.5), so they are a fixed list, not an expandable category.

## 4. Measurements (all with the unmodified Sim, bot random and focus, Wren and Elias)

Scripts: `gates-lib.mjs` (gate list, soft cap, bot, worker pool), `gates-worker.mjs`, `gates-sim.mjs`, `gates-kits.mjs`, `gates-pace.mjs`, `gates-softcap.mjs`, `gates-ablate.mjs`, `gates-ablate2.mjs`. Mechanism: every weapon gets `treeGate:true` in a data COPY and the allowed ones go in `tree.unlocks.weapons` (the existing `buildPool` hook); evolutions are removed from the copy's `data.evolutions`. No src change was needed.

### 4.1 Starter vs half vs all vs old tree (`node scripts/gates-sim.mjs 48`, 48 seeds per cell)

Cells: win% | median level | median first-evolution time. "Half" = the first 6 gates in the order of 2.2. Run-to-run noise at n=48 is about +/- 7 points.

| Row | Wren random | Wren focus | Elias random | Elias focus |
|---|---|---|---|---|
| A starter pool, no tree | 27% L46 4:05 | 19% L38 4:24 | 29% L43 3:52 | 44% L45 4:06 |
| B half unlocked, no tree | 17% L37 5:29 | 29% L38 4:07 | 19% L35 5:35 | 44% L40 5:23 |
| C all unlocked, no tree (= base game) | 25% L38 6:31 | 44% L44 4:59 | 19% L36 6:51 | 44% L43 5:38 |
| D all unlocked + OLD full tree | 96% L50 7:28 | 98% L50 5:04 | 98% L49 7:40 | 100% L49 5:02 |
| E starter pool + OLD full tree | 98% L52 3:57 | 96% L52 3:42 | 98% L52 3:57 | 98% L51 3:57 |
| F half unlocked + OLD half tree | 90% L50 5:18 | 90% L50 3:29 | 98% L50 5:10 | 94% L50 4:31 |

Reading: A, B, C are statistically the same. Gates are cosmetic to the bot; all of the power in D/E/F is the tree. Note E (starter pool + full tree) already wins ~98%, i.e. the old tree's power does not depend on options at all.

### 4.2 Which second weapon makes a fair starter (`node scripts/gates-kits.mjs 48`, no tree, win%, random / focus)

| Hero | + Ravens | + Bolts | + other hero signature | signature only |
|---|---|---|---|---|
| Wren | 21 / 6 | 58 / 60 | 27 / 19 (Orbit) | 13 / 6 |
| Elias | 2 / 2 | 67 / 58 | 29 / 44 (Wolves) | 15 / 10 |

Spirit Bolts is the easy-mode weapon (58-67%), Ravens the weak one (2% with Elias), the other hero's signature is the fair pair (19-44%). Hence the starter pool of 2.1.

### 4.3 Old kit variant (superseded) for the record

First draft kit (Wren: Wolves+Ravens, Elias: Orbit+Bolts) gave Wren 21/6% and Elias 67/58% starter wins: too uneven; replaced.

### 4.4 Unlock pacing (`node scripts/gates-pace.mjs 12 40`, 12 simulated players per bot, 40 runs each, alternating Wren/Elias, banking stats like `bankRun`, no tree stats)

The table in 2.2 is this output (median run, p10-p90). 100% of players opened every gate within 40 runs except Thunder Judgment (92% for the random bot). Average kills over a 40-run journey: wolf ~32k-35k, crow ~36k-39k, root crawler ~7.4k-8.6k. Win rate by run bucket (no tree, content gates only): random 43% / 25% / 19% / 23% for runs 1-5 / 6-10 / 11-20 / 21-40; focus 28% / 20% / 43% / 47%. It does not climb with unlocks, confirming 4.1.

### 4.5 Soft cap on the existing 63-node tree (`gates-softcap.mjs`, `gates-ablate.mjs`, `gates-ablate2.mjs`)

The cap is a script-side transform of `aggregateMods` output with the table `SOFT` in `gates-lib.mjs` at scale 1 = {damage 20%, area 20%, cooldown 15%, speed 10%, pickup 40%, xp 25%, gold 40%, ability cooldown 40%, maxHp 20%, level-up heal 6%, hearts 100%, magnet 100%, heart heal 60%, ability duration 40%, weapon power 25%, other weapon stats 20%}; "xS" multiplies every cap (x0.3 is about the section 3.1 table). All tests: all gates unlocked. Win% (n=48 for x1..x0.4, n=24 for x0.2/x0.1, so +/- 10 points there):

| Tree | Wren random | Wren focus | Elias random | Elias focus |
|---|---|---|---|---|
| no tree (reference) | 25 | 44 | 19 | 44 |
| old full, raw | 96 | 98 | 98 | 100 |
| old full, soft x1 | 90 | 92 | 94 | 96 |
| old full, soft x0.6 | 85 | 96 | 88 | 98 |
| old full, soft x0.4 | 73 | 94 | 92 | 88 |
| old full, soft x0.2 (n=24) | 67 | 83 | 71 | 88 |
| old full, soft x0.1 (n=24) | 71 | 75 | 67 | 88 |
| old half, raw | 75 | 90 | 94 | 100 |
| old half, soft x1 | 71 | 88 | 90 | 94 |

Applied caps change little at scale 1 because the 63-node tree sums are already near the caps (wolf power 34.5% -> 18.7%, area 14.5% -> 10.3%, gold 34% -> 22.9%); the cap would bite only on a much bigger tree, which is its job. Even at x0.1 (damage +2%, health +2%) the win rate stays 67-88%, so the stat part is not the whole story. Ablation at x0.6 (win% Wren rnd / foc, Elias rnd / foc): everything 85/96/88/98; minus rerolls+banishes 85/92/90/96; minus revive 71/92/79/90; minus level-heal and hearts 65/94/79/96; minus rerolls+revive+heal 75/88/79/94; stats only 67/85/77/88. At x0.1: everything 71/75/67/88; no groups 38/58/54/58; no groups and no flat bonuses 25/58/46/67; x0.3 stats only 25/83/42/71; x1 stats only 50/79/75/83. Conclusions: revive and level-heal/hearts are the strongest non-stat effects (about 10-20 points each), verbs and groups together roughly +20 points, pure stats at x0.3 roughly +0 to +40 depending on bot (noisy), flat chain/pierce bonuses ~+0-10. Together with a base this close to the edge this is why only a harder base plus a small total PE can give the 15-25 -> 45-55 ladder.

## 5. Why the numbers above are trustworthy (and not)

Sound: same Sim, same bot logic as `scripts/bot.mjs`, 48 seeds (24 for two sweeps, flagged), identical seeds across rows. Not sound: the bot picks cards without valuing options, so it cannot show the appeal of a gate; random vs focus is the only skill proxy; humans die earlier than the bot's 11-minute average, so unlocks take them longer. Treat win-rate cells as +/- 7-10 points.

## 6. Risks, smallest first build chunk, hooks

Risks: (1) harder base annoys current players (mitigate: `hpScale` only, measured); (2) players who never kill ravens never see Murder Storm (by design; make sure two routes exist, e.g. gate 7 "evolve any weapon 12 times" does not need a specific weapon); (3) an unlockable that needs another unlockable (Soul Lance needs Bolts) is clearly shown in the node text; (4) a start with 2 weapons has more fallback cards late (measured level 38-46, fine); (5) hostile saves: gate nodes go through the existing `sanitizeTree`, which already drops unmet conditions; evolutions unlocks must be added to the sanitised whitelist, not trusted from the save; (6) boss gates (6, 9, 10) are faster in bot runs than for humans.

**Smallest first chunk G1 ("gate plumbing", no stat change):**
1. `src/meta/tree.js`: add `'evolution'` to `UNLOCK_IDS`; `checkEffect`: for `e.unlock==='evolution'` require `own(data.evolutions, e.id)`; `aggregateMods`: `else if (e.unlock === 'evolution') out.unlocks.evolutions.push(e.id)`; add `evolutions: []` to `emptyEffects().unlocks`. (about 5 lines)
2. `src/sim/Sim.js`: `this.unlockedEvolutions = new Set(T.unlocks?.evolutions || [])` and add `unlockedEvolutions` to `cardCtx`. (2 lines)
3. `src/sim/cards.js`: in `availableEvolutions` skip `evo.treeGate && !(ctx.unlockedEvolutions?.has(evoId))` (pass ctx, or the set, as a third arg; update the two call sites `goldCards` and the pair loop in `buildPool`). (about 6 lines)
4. Data (allowed, it is `src/data`): `treeGate:true` on `raven_flock`, `spirit_bolts`, `chain_lightning` in `weapons.json` and on the 9 gated evolutions in `evolutions.json`; 12 gate nodes in `tree.json` (hidden, `unlock` per 2.2, effect `{unlock:'weapon'|'evolution', id}`, small gold cost).
5. Tests: gated weapon not in the pool until unlocked; gated evolution produces no gold card and no pair nudge until unlocked; sanitiser drops a forged evolution unlock; `compileTree` rejects unknown evolution id; a Sim with no `tree` behaves as today only if gating data is absent (so existing tests keep the full data copy, or set the gates off in test helpers).
6. UI: gate nodes `???` until progress, "NEW unlock" line in the results screen, toast on first card. `textContent` only.
7. Done-check: `npm test` green, `gates-sim.mjs` after the change reproduces row A on real data, security + fit check lines.

Chunk G2 (later, separate): move all node values to the 1-3% / caps of section 3, add the validator, re-tune base `hpScale` to the target ladder. Chunk G3: ability upgrades for Wren/Elias (new sim hook).

## 7. Open questions (max 3)

1. **Raise the base difficulty a little?** Without it the ladder cannot reach starter 15-25% / all 45-55% (the bot wins 19-44% with no tree and the old tree takes it to 96-100%). Recommend: yes, tune `hpScale` in G2 so the no-tree random bot is about 15-20%; measure with `gates-sim.mjs` row A.
2. **Starter pool Wolves + Orbit for both heroes, Bolts/Ravens/Chain gated?** Changes the locked line "all 5 weapons from the start". Recommend: yes (measured fair pair; Bolts is the easy-mode weapon).
3. **Gate heroes too (Elias behind a gate)?** Not proposed now; the schema supports it. Recommend: keep both heroes open until a third hero exists, then gate with a boss kill.

Right now: G1 gate plumbing after your go-ahead. Next: G2 value rescale and validator. Parked: Wren/Elias ability upgrade nodes (new sim hook).

## 8. Security check and Fit check

* **Security check:** no dependencies added, no src/tests/data changed, scripts read only local JSON and run in worker threads; proposed hooks add an id-style unlock that goes through the existing validation (`compileTree`) and save sanitising (`sanitizeTree` drops unmet conditions and unknown ids); all UI strings stay `textContent`.
* **Fit check:** gates reward killing different enemies, taking evolutions, playing both heroes and beating the Elder Treant (the locked meta-progression principle); unlocked things are existing Hollowlight weapons and evolutions, hidden recipes are preserved, and the tiny stat nodes plus soft cap keep the web expandable without changing the summoner fantasy.
