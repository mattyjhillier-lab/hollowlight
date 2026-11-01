# Evolution fix: known misses from evo-flow v2 (wip/evo-fix)

Base = origin/dev 97bc08b. Deterministic; 64 seeds per cell for the sweeps (about +-12 points 95% CI on a win rate). Spread data: `evo-fix-spreads-16.txt` (3 seeds x 10 s). Matrix summary: `evo-fix-rt-summary.md`.

## Changes
| item | change | before -> after |
|---|---|---|
| Sanctum Halo, lone foe | ground burn x`solo` (4.5, divided by foes within ring+60 px, floor 1) on a foe wholly inside the lights' reach; not for bosses, not while the guard is touching/closing. Data `tune.solo`, `tune.soloReach` | Orbit size 0, single dummy: 0.23-0.41x -> 1.05-2.35x (test pins >= 1.0). stream40 at the normal spreads unchanged (1.9-2.9x). Home (evo-home 5 seeds): swarm 2.28x, kite 2.31x, boss 1.08x (was 2.13 / 2.30 / 1.08) |
| Murder Storm | `peck` 0.7 -> 0.52 | stream40 spreads 2.25-3.57x -> 1.97-3.00x; max rank 2.95x -> 2.44x. Home kite 2.07x -> 1.91x (band 1.8-2.3 held) |
| Talon Mark | `dive` 8 -> 6.5 (damage of the dive hit; the mark is unchanged) | stream40 spreads 2.41-3.35x -> 2.09-2.83x; single/boss 3.0x -> 2.4-2.45x; swarm 1.81x, kite 1.61x (was 1.66 / 1.46, unchanged in kind) |
| Soul Lance | `rankScale.pierce` 0.25 -> 0.32 | no-pierce stream40 3.20x -> 2.84x, single 1.24 -> 1.12x (still >= 1); max-rank stream40 2.71x |
| Judgement Wheel | NOT changed | stream40 5.7-7.2x stays. See below |

Tests: `tests/evo-flow.test.mjs` now also checks stream40 (cap 3.2 for noise; Judgement Wheel listed as the one documented exception) and has an explicit Sanctum Halo radius-0 floor test; `raven-evos` peck pin updated 0.7 -> 0.52. `npm test` 1253/1253 green (idle), `npm run build` OK (2.95 MB).

## Judgement Wheel: not fixable inside the constraints (needs Matt)
Levers tried (evo-home, 3 seeds): `maxHits` 4/6/8/12 (cap on foes per blast) and a longer per-foe blast gap 0.2/0.3/0.4/0.8/1.3 s (bosses kept at 0.1 s). Every setting keeps kite : stream40 at about 0.4 (kite 1.25-1.9x against stream40 2.3-5.2x), so stream40 <= 3.0x only comes with kite <= ~1.3x, below the locked 1.8-2.3x home band. Cause: the Wheel is AoE, immortal walkers never die so every blast re-hits them, while the mortal kite scenario saturates as foes die. LOCKED 2026-10-17 already exempts the Wheel from the stream40 cap. Reverted; code unchanged. Decision for Matt: keep the exemption (recommended), or accept a lower home (about 1.3x kite) to get stream40 <= 3x.

## Balance sweeps, fix build, 64 seeds, Twilight unless stated
sweep-all (no tree, starter gates): 

| cell | win | first evo (p10/p90) | evolved | deaths <5:00 |
|---|---|---|---|---|
| wren random | 22% | 3:59 (3:45/5:23) | 56/64 | 2 (3%) |
| wren focus | 22% | 3:58 (3:47/6:09) | 53/64 | 6 (9%) |
| elias random | 25% | 6:10 (3:53/14:03) | 49/64 | 0 |
| elias focus | 36% | 6:58 (3:51/14:03) | 45/64 | 1 (2%) |

Bands (rt-matrix kindred weapon, random bot, 64 seeds; cells fresh/mid/max from `evo-fix-rt-summary.md`):

| band | wren | elias | verdict |
|---|---|---|---|
| fresh 15-30 | 22% | 25% | in band (focus bot: wren 22, elias 36) |
| mid tree 30-55 | 31% | 33% | in band |
| maxed Bond 25 65-90 | 80% | 83% | in band |
| Deep Dusk full tree Bond 0 35-55 | 19% | 17% | MISS, not from this change (origin/dev same cells: 20% / 19%) |
| Long Night maxed Bond 25 10-20 | 3% | 19% | wren MISS (origin/dev 3%, identical), elias in band |
| deaths before 5:00 under ~5% | 3% (focus 9%) | 0-2% | wren focus 6/64 over; same cause as origin/dev (4/48), early wolves/crows before the first evolution at ~4:00 |
| first evolution ~4:00 focus | 3:58 | 6:58 | wren on target; elias late (Holy Orbit, known) |

Mid and max trees evolve late (first evo 10:28-11:59, 25-73% evolve) exactly as the E4 finding; `evoTriggerPerWeapon` knob unchanged (off).

boss-sweep 64 (no tree, Twilight): wins wren 22/22, elias 25/36 (same as sweep-all, same seeds). Boss win|reach: wren random 93, focus 88; elias random 73, focus 79 (E4 48 seeds: 91 fresh wren). Fight length wren 81 s, elias 115 s. Adds' share of damage 6-7%.
bless-sweep 64: wins identical to the above (22 / 22 / 25 / 36); dead/run 9.4-20.1, hpLost 290-322, first Blessing 2:45-5:03: unchanged pattern (no Blessing data touched).
gates-*: NOT completed. `gates-kits.mjs 64` ran ~70 min (shared machine, no output) and was stopped; a 16-seed retry hit the 10 min box; `gates-softcap`/`gates-ablate` not started. No gate, tier, Blessing or tree data changed, so only the evolution numbers above could move them; flagged as not run.

## Not caused by evolutions (report only, nothing retuned)
- Deep Dusk full tree Bond 0: 17-19% vs 35-55% target (origin/dev baseline 19-20% on the same 64 seeds).
- Wren Long Night maxed: 3% vs 10-20% (baseline 3%, same seeds).
- Wren focus deaths before 5:00 9%.
- Out-of-band boss win|reach at full Twilight (100% vs 60-75) and fight length 64-71 s: same pattern as before.

## Security / fit
Security check: no new deps, no input/save/URL surface touched (data + sim only; new tunables are read from shipped JSON with code fallbacks equal to the JSON). Fit check: Halo's ground burns a lone foe inside the wide ring harder (holy ground that scorches the one that slipped between candles); Wall of Wings and Talon Mark were trimmed, not changed in verb.
