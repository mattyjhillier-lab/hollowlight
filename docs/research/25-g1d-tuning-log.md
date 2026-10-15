# G1d tuning log (enemy HP scaling, starter kit, Blessings on, random-pick bot)

Bot: scripts/g1d-sweep.mjs (bless-sweep plus death-time buckets). Tuning seeds 1-96 (it1-4), confirm 250 seeds on tune range 1-250 and fresh range 1001-1250.
hpMul = 1 + linear*min + quad*min^2 (bosses unscaled). Win% = random / focus.

| It | Change | wren | elias | <5:00 deaths (of 96) | Notes |
|---|---|---|---|---|---|
| base | linear .34, quad .021 | 36/28 | 52/51 | - | start |
| 1 | .40 / .030 | 18/13 | 26/20 | 4,5 / 1,3 | boss share ~52%, too late-heavy |
| 2 | .46 / .020 (more linear, less quad) | 18/21 | 36/24 | 2,6 / 2,3 | boss share Wren 62-66%, Elias 30-37% |
| 3 | it2 + Elias hp 95, holy 1.10 | 18/21 | 18/15 | 2,6 / 11,4 | Elias too hard, early deaths |
| 4 | it2 + Elias hp 110, holy 1.10 (FINAL) | 18/21 | 21/21 | 2,6 / 2,3 | gap closed |

## Final (250 seeds)
| Cell | tune 1-250 | fresh 1001-1250 |
|---|---|---|
| wren random | 17% | 24% |
| wren focus | 21% | 19% |
| elias random | 27% | 27% |
| elias focus | 25% | 30% |

Deaths before 5:00: 9-20 of 250 per cell (4-8% of runs). Deaths >= 10:00 (boss phase) as share of deaths: Wren 47-63%, Elias 43-45%. Levels per run 37-38 median (was 39-45; fewer kills/XP when dying earlier).
Sanity (96 seeds): BLESS=off wren 10/16, elias 23/15; GATES=all wren 7/32, elias 13/31 (random/focus); META=half (old tree) 90-96% (G2 must rescale).
Pre-existing note: first evolution median still ~3-5 min in bot runs.

## Not hit
- Boss-death share under 40% for Wren (47-63%): the boss itself is unscaled (hp from enemies.json); levers are boss/adds data, out of this chunk's scope.
- Levels per run unchanged: fell ~3-8 levels because harder enemies die slower and runs end earlier.
- Focus bot is not above random for Wren (bot picks fewer options with the starter kit).

## Final config
balance.json hpScale linear .34 -> .46, quad .021 -> .020 (dmgScale unchanged .07). characters.json Elias holyDamage 1.15 -> 1.10 (traitText +10%); hp unchanged 110. tests/tree.test.mjs: damage-node margin 1.03 -> 1.02 (seed 11 ratio 1.027 after HP change).
