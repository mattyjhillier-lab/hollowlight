# Connected-unlock rule: economy + balance analysis (2026-10-21, analysis only, nothing in src/ changed)

Inputs: LOCKED 'Tree look + connected-unlock rule'; tree-screen-review.md findings 2-4; dry-run patch `docs/design/tree-connected-patch.md` (`scripts/tree-connected-patch.mjs`); model `scripts/tree-timeline.mjs` (new flags `--rule --links --price --k --creep --econ --calib --tiers`). Timeline = MODEL (24 players x 100 runs; 12 x 320 at 1000 nodes; seed 7), not the Sim.

## 1. Measured economy (bot, Elder Treant 36000 HP, Blessings on, random pick)
| Cell | Seeds/hero | Wren win | Elias win | Win gold | Loss gold (mean death) |
|---|---|---|---|---|---|
| Starter, no tree (Twilight) | 48 | 27% | 19% | 2,800 / 2,792 | 1,021 / 801 (~7:40) |
| Half tree (GATES=all META=half) | 32 | 16% | 47% | 3,087 / 3,022 | ~1,800 |
| Full tree Twilight | 48 | 35% | 60% | 2,979 / 3,008 | 1,848 / 1,977 (~11:00) |
| Full tree Deep Dusk | 48 | 6% | 8% | 2,466 / 3,039 | 1,133 / 1,343 |
| Full tree Long Night | 32 | 6% | 0% | 1,289 / - | 606 / 819 |
Noise: 48 seeds about +-14 pts, 32 seeds about +-17. No deaths before 5:00 on starter except 5 Wren / 1 Elias runs under 5:00 (48 each).
Finding: `tiers.json` goldMul (1.5 / 2.0) is not applied anywhere in src (Sim gold and bankRun ignore it): harder tiers pay LESS gold per run today. Tier shards also come from `chapter.bossShards`, not the tier.

## 2. Timeline results (design tree = live + inert nodes; measured odds unless noted)
| Config | Run-1 buyable / buys | Nothing to buy | Dead zone A | 50% / 90% of nodes | Gold sink opens | First Deep Dusk clear |
|---|---|---|---|---|---|---|
| Today's rules, flat | 14 / 6 | 0.0% | 43.5% | 21 / 49 | 53 | 34 |
| Connected, one-way links | 12 / 6 | 0.0% (0.2-0.5% in other seeds/live) | 43.8% | 22 / 49 | 54 | 36 |
| Connected, links both ways | 12 / 6 | 0.0% | 43.8% | 23 / 48 | 53 | 43 |
| + depth price k 0.15 (total kept) | 12 / 9 | 0.0% | 44.6% | 21 / 46 | 51 | 41 |
| + price creep 6% | 12 / 6 | 0.0% | 14.4% | 26 / 67 | 78 | 41 |
| + price creep 8% | 12 / 6 | 0.0% | 3.8% | 27 / 74 | 87 | 42 |
| + creep 8% + tier proposal | 12 / 6 | 0.0% | 4.7% | 26 / 74 | 85 | 49 |
| Links both, OLD optimistic tier odds | 12 / 6 | 0.0% | 39.3% | 21 / 39 | 43 | 16 |
| LIVE tree, connected, links both | 12 / 10 | 0.0% | 1.1% | 18 / 37 | 44 | (no tiers live) |
| 1000 nodes, today | 12 / 6 | 0.0% | 54.2% | 73 / 128 | 147 | 52 |
| 1000 nodes, connected both | 10 / 6 | 0.0% | 55.1% | 67 / 122 | 139 | 51 |
| 1000 nodes, + creep 8% | 10 / 6 | 0.0% | 37.3% | 84 / 169 | 204 | 64 |

Readings:
- The rule holds back 9 lanterns at run 1-10 (the seals of the three unwoken weapons; the far roots now sit behind bridges) and never leaves a run with nothing to buy once links work both ways. With one-way links 19 gold lanterns sit behind a challenge with no gold route (Chain Lightning second half, Wolves Maul/Hunt, most of the Bolts, Orbit and Raven far halves): 0.2-0.5% of runs had nothing to buy (Chain second half while Overcharge waits on 2 evolutions).
- Prices ALREADY rise with depth: rank-1 mean d1 358, d2 488, d3 754, d5 870, d7 1,203 gold. Re-pricing by depth with the total kept makes shallow lanterns cheaper (run-1 buys 6 -> 9): wrong direction. Price creep is what stretches the gold content and closes the endgame dead zone (43.8% -> 3.8% at 8%) and moves the cosmetic sink from ~run 53 to ~run 87.
- First Deep Dusk clear: 36-43 runs with the measured odds (band 15-25) because the full-tree bot wins Deep Dusk only 6-8% (LOCKED band 25-40%). Rewards cannot fix it (proposal moves it 42 -> 49 because creep keeps gold busy). It is a difficulty problem.
- 1000 nodes: the synthetic economy (C.13: a constellation costs ~5 runs of gold) leaves a 55% dead zone; creep 8% halves it to 37%. Growth economy rule needs its own pass (out of scope).

## 3. Balance check (analytic, treebudget + softFactors; dry-run patch applied in memory)
- Soft cap holds: combat PE at cap 30.36 / 31, sustain 5.00 / 5, before and after the patch; bridges add only gem pull (+5% each, uncapped utility). Prices and links do not change power, only pace.
- Power per branch (marginal combat PE, PE per 1,000 gold): Summoner ring 2.17 (0.59), Magic ring 2.86 (0.38), Wolves / Orbit clusters 1.49 (0.21), Ravens 1.13 (0.18), Bolts 1.04 (0.16), Chain 1.04 (0.14), Light ring 2.43 + all sustain (0.13), Spirit ring 1.39 + rerolls/banishes (0.11), tools 0 combat (utility/info by design). No branch is a trap; the Summoner ring is the best buy per gold (Wren-leaning) but is 5 cheap shallow lanterns, so it is a natural first path, not a wall.
- Win rates vs targets: no-tree 27 / 19 (target 15-30: OK); full tree 35 / 60 random (target 45-55: Wren under, Elias over; the known hero gap, tree-impact.md A, unchanged by this work); Deep Dusk full 6 / 8 (target 25-40: OVER-HARD); Long Night full 6 / 0 (target 5-15: low edge).

## 4. Tier reward proposal (`--tiers proposal`)
Keep the shape, but WIRE it: gold x1.5 Deep Dusk / x2.0 Long Night at bank time (today unused). Proposal on top: Deep Dusk x1.6, first clear +2 shards, Dawnglass dawn 3 / first 8 / run cap 7; Long Night x2.2, +3 shards, dawn 5 / first 12 / cap 11. Only meaningful after Deep Dusk is retuned to its band; the model shows rewards alone do not pull the first clear into 15-25.

## 5. Defaults taken (reversible, override any)
- Bridge lantern: 250 gold, gem pull +5%, from the two nearest gold-only Hearth/Wick lanterns, placed at r 1000 on the group's angle; its long thread is the deliberate path trail.
- Groups whose every root is a challenge (Almanac, Card Fan, Hearth-key; all inert today): the bridge shows as a Challenge (nearest goal behind it) until a lantern behind it can open, so 250 gold is never spent into nothing.
- Cosmetic sink opens when no gold lantern is left (review finding 3), not at "tree complete".
