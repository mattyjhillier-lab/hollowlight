# Evolution flow v2: sweeps and spread checks (wip/evo-build)

Build: trigger = total stat ranks on a weapon reaching `balance.evoTriggerRanks` (16); every unlocked evolution of that weapon is offered (max 3 gold cards per weapon). Baseline = origin/dev (659be88, stat-pair trigger + evoNudge). All runs deterministic, seeds 1..48 per cell, no tree unless stated. Bots: random and FOCUS; the bot now picks a random one of the offered evolutions.

## E4a. scripts/sweep-all.mjs 48 (no tree, Twilight, both heroes, starter gates)

| cell | base win | v2 @15 win | v2 @16 win | base first evo (median) | @15 | @16 | deaths <5:00 base / @16 |
|---|---|---|---|---|---|---|---|
| wren random | 31% | 23% | 21% | 4:00 | 3:42 | 3:58 | 3 / 2 of 48 |
| wren focus | 23% | 27% | 27% | 4:01 | 3:43 | 3:57 | 4 / 4 |
| elias random | 40% | 25% | 29% | 5:35 | 5:48 | 6:02 | 0 / 0 |
| elias focus | 33% | 33% | 27% | 4:55 | 7:32 | 6:28 | 1 / 1 |

Level 10 comes at ~134 s, so 15 gave Wren 3:42; **16 gives 3:57-3:58 (target ~4:00)**, so evoTriggerRanks = 16. Wren's first-evolution spread tightened (p10/p90 3:45 / 5:08 vs 2:45 / 5:38). Elias evolves later than today (+27 s random, Holy Orbit's free Sanctum Halo; p90 still ~11-14 min). Noise: a 48-seed win rate is about +-13 points (95% CI).

## E4b. scripts/rt-matrix.mjs, Twilight random, kindred weapon (wren Wolves, elias Orbit), 48 seeds per cell

| cell | base win | v2 @16 win | locked band | base first evo (evolved) | v2 @16 first evo (evolved) |
|---|---|---|---|---|---|
| fresh, Bond 0 wren | 31% | 21% (12-34) | 15-30 | 4:00 (90%) | 3:58 (88%) |
| fresh, Bond 0 elias | 40% | 29% (18-43) | 15-30 | 5:35 (77%) | 6:02 (73%) |
| mid tree, Bond 0 wren | 46% | 33% (22-47) | 30-55 | 5:47 (79%) | 11:19 (33%) |
| mid tree, Bond 0 elias | 46% | 31% (20-45) | 30-55 | 7:49 (94%) | 11:59 (21%) |
| maxed, Bond 25 wren | 85% | 79% (66-88) | 65-90 | 6:18 (98%) | 10:31 (75%) |
| maxed, Bond 25 elias | 96% | 83% (70-91) | 65-90 | 6:53 (98%) | 10:28 (75%) |

Win bands all hold (fresh, mid and maxed inside the locked bands for both heroes; elias maxed is now in band, it was 96% over). Deaths before 5:00: 4% wren fresh (2/48), 0 elsewhere (base 6% / 0). Boss win|reach: fresh 91 / 78, mid 80 / 79, maxed 100 / 100 (base 94 / 79, 92 / 88, 100 / 98): same out-of-band pattern as today, not worse. Fight length unchanged (84 / 119 s fresh).

## FINDING for Matt: evolution arrives much later with a deep loadout
With more weapons held (mid and maxed trees open 4 slots) each weapon gets about a quarter of the ranks, so one weapon reaches 16 ranks late: first evolution median 11:19-11:59 (21-33% of mid-tree runs evolve at all) and 10:28-10:31 (75%) when maxed, versus 5:47-7:49 and 6:18-6:53 today (the pair nudge concentrated ranks). Fresh runs (2 weapons in the pool) are on target. This is not a bug; it is what removing the nudge does. It is the one target this chunk moves, so it comes back to you.
- Knob added, **default OFF**: `balance.evoTriggerPerWeapon` (ranks added per weapon held beyond two; negative = earlier). Measured at -2 (16 with 2 weapons, 14 with 3, 12 with 4), 48 seeds, rt-matrix random: mid wren first evo 7:58 (83%), elias 8:23 (85%); maxed 6:52 (94%) / 7:06 (100%) = today's timing again. Cost: win rate rises: mid wren 55% (band top), mid elias 42%, maxed wren 83%, maxed elias 98% (above 90; it was 96 at base). Recommendation: -2 (or -1 as the middle step) if you want evolutions to stay a mid-run event with a full loadout; leaving it at 0 keeps win rates in band but veterans see evolutions at about 10:30. Your call; one number.

## E2. no wasted ranks (scripts/evo-flow-ranks.mjs, 3 seeds x 10 s, single / stream10 / stream40; ratio = evolution DPS / base DPS at the same ranks)
Probed every evolution at 16 total ranks in 5 spreads (each stat left at its low end in turn, plus balanced) = data in `evo-flow-spreads-16.txt`. Mechanism: `evolutions.json` `rankScale { stat: exponent }` multiplies the evolution's damage by (stat value / value at max)^exponent (exactly 1 at max, so tuned home values 1.8-2.3x do not move); fitted by `scripts/evo-flow-fit.mjs` for 9 evolutions. Two evolution-specific fixes: Thunder Judgment chain = base chain + 2 (9 at full Chains) and its smite reach scales with Chains; Lightfoot trail damage scales with Pack size (`trailPack`). Before: Soul Lance 4.0-7.9x and Spirit Tempest 9.9-14x when Bolt count was low, Dire Alpha 0.99x, Judgement Wheel 0.78x, Thunder 0.60x with the exponent first tried. After (guard test `tests/evo-flow.test.mjs`, single + stream10, floor 0.95 / cap 3.4): no cell below base except the known one below.

Remaining misses (all in extreme spreads, none in single + stream10 apart from the first row):
| cell | ratio | note |
|---|---|---|
| sanctum_halo, Orbit size left at 0, single dummy 30 px away | 0.23-0.31x | the dummy is inside the Halo ring but on the base ring's path; a geometry artefact of the single-target probe (stream10 is 3.1x). Listed in KNOWN_LOW in the test. Fix needs a Halo tune (ground burn near the hero): your call. |
| murder_storm no-count / balanced, stream40 | 3.4-3.6x | stream40 is raw immortal-crowd output; it was already 3.13x at max rank |
| dive_bombers, all spreads | 2.9-3.3x | already 2.94-3.2x at max rank before this change (Talon Mark's home scenario is the team yardstick) |
| judgement_wheel stream40 | 6.0-7.2x | already 6.77x at max rank before this change; not in the cap list of tests |
| soul_lance, Pierce left at low end, stream40 | 3.18x | was 7.8x; Pierce base is 0 so the scale floor is 10% of max |
Home scenario 1.8-2.3x is untouched (the scale is 1 at max rank); legacy `pair` mode in `evo-same-ranks.mjs` now means pair maxed plus the remaining ranks shared to the trigger (old: others at rank 1), and the existing cap-at-pick tests run on it (all green).

## Not run
bless-sweep, boss-sweep and gates-* were not re-run: sweep-all and rt-matrix already report boss win|reach and fight length, and no Blessing, tier or gate data changed. A tree-focus matrix was not run (rt-matrix only has FOCUS cells for the fresh profile).

## Checks
- `npm test` 1252 green (idle machine), `npm run build` OK (2.95 MB single file), `npm audit`: 1 moderate (vite dev-server `server.fs.deny`, GHSA-8g5g-mxqh-grgj), same as origin/dev, no dependency change.
- Saves: no schema or version change (the evolved-stat record is unchanged; the Almanac entry reads `stats.evolved`). New data is read only from shipped JSON; `evoTriggerRanks` / `evoTriggerPerWeapon` / `rankScale` are validated (integers/finite, clamped, bad data falls back to 15 / 0 / no scale). Sim stays deterministic (no new RNG draws; the bot picks with its own rng).
