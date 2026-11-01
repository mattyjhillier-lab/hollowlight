# Ablation re-run (2026-10-30, branch wip/ablate-rerun, data untouched)
Live bot (dodge, Blessings, Bond, random picks), Twilight unless noted, 48 paired seeds per cell (C: 96). Script `scripts/ablate-rerun.mjs <A|B|C> [seeds]` (SEED0 offsets seeds; RAW=file dumps runs); raw runs `ablate-rerun-raw-{A,B,C,C2}.jsonl`, tables `ablate-rerun-{A,B,C,C2}.txt`. Cells: fresh = no tree Bond 0; mid = half tree Bond 0; maxed = full tree Bond 25; Long Night = expert tier, full, Bond 25. Per-cell noise: win% SE 5-7, paired delta SE 7-9 (about 4 when pooled over the 4 cells).

## A. Hero ability on vs off (target +2..+5 win points)
| cell | Wren on/off, delta (SE) | Elias on/off, delta (SE) |
|---|---|---|
| fresh | 21/29, -8.3 (8.3) | 23/13, +10.4 (7.4) |
| mid | 33/33, 0.0 (7.3) | 31/27, +4.2 (8.9) |
| maxed | 79/81, -2.1 (8.1) | 83/85, -2.1 (8.1) |
| Long Night max | 4/4, 0.0 (4.2) | 19/8, +10.4 (6.8) |
Pooled over cells: Wren -2.6 (3.6), Elias +5.7 (3.9). Read: Wren's Pelt Dash is indistinguishable from zero (never clearly positive; fresh -8 is 1 SE); Elias's Sanctuary is at or a bit above the top of the band in the cells where it matters (fresh, Long Night +10 at 1.4-1.5 SE). Nothing is a runaway; both are "modest", but Wren's ability is closer to "no measurable effect" than "+2..+5". Caveat: in tree cells the "off" bot still fires 1.5-5.7 uses/run through the tree's auto-activate node, so off is not pure there (fresh is pure). Unresolved at this n: to separate +3 from 0 needs about 400 pairs per cell.

## B. Gated evolutions present vs stripped (strip 'evos'; starter-free evolutions Howling Legion / Sanctum Halo stay)
Delta evos minus noevos: Wren mid +4.2 (10.3), Wren maxed -8.3 (5.8), Elias mid -18.8 (10.2), Elias maxed -8.3 (5.0). Looks like evolutions hurt, but the cause is pick dilution, not weak evolutions:
- Runs that evolve at all win 75-100% (mid 75/100%, maxed 94%); runs that never evolve win 11-50%. Evolved runs in the evos arm: Wren/Elias mid 16/10 of 48, maxed 36/36; noevos arm: mid 13/22, maxed 38/44.
- With 15 recipes live, the evoNudge spreads stat cards over many pairs, so the random bot completes fewer pairs (Elias mid: 10 vs 22 runs evolved; first evo 11:59 vs 10:25). With only the free starter pair live the nudge funnels picks into it.
- Conclusion: evolutions help when taken (about +60-80 points conditional); the run-level negative is a random-picker/nudge-dilution effect of the open recipe list (a human who commits to one pair does not pay it). Not a "never below base" or power problem. Targets (1.8-2.3x home, cap 3x) are measured by evo-home, not this row; not moved.

## C. Wren + Spirit Bolts reading about 64% (band 15-30%)
Pooled 96 seeds, fresh tree, Bond 0, Twilight (random / FOCUS):
- signature only (Wolves): 24 / 24; + Bolts starter grant: 64 (65, 63) / 45 (42, 48); + Ravens grant: 34 / 40; + Orbit grant: 31 / 24; starting WITH Bolts only: 30 / 32; all gates open (Wolves start): 1-2 / 3 (dilution again).
Findings:
1. Starter-only profile cannot take it: Bolts is treeGate, adoption in the signature-only cell is Wolves 100% and nothing else. The 64% cell is hypothetical: a fresh save plus the Bolts heart and the Tempest gate, with nothing else bought. gates-kits builds exactly that. A real player who owns Bolts has spent gold on the tree; the mid-tree cells (RT3 row: Bolts 45/49 at 96 seeds) are the reachable reading and sit inside 30-55.
2. Mechanism: with two weapons the win is almost exactly "both starter-gate evolutions complete". Wolves+Bolts: 61 of 96 runs evolve twice and all 61 win; 0 or 1 evolution wins 0 of 35. Wolves+Ravens: 34 twice, 97% win; Wolves+Orbit: 37 twice, 81%. Bolts reaches the double evolution in 64% of runs vs 35-39% for the others (Tempest pair Count+Swiftness completes quickly; first evo about 7:00-7:30). The ability to win then comes from the two-evolution kit, not from Bolts raw power (Bolts alone 30/32%, inside the band).
3. Over-strong once unlocked? Not on its own (Bolts-only start 30%, and mid tree 45/49). It is the best second weapon for Wren by about 30 points in the fresh-plus-grant cell only.
No data change proposed: the problem is confined to an unreachable profile. If Matt wants the cell in-band anyway, the smallest lever is the Tempest recipe (e.g. making the pair stats slower to complete); I did not measure it because it would move the mid-tree Bolts cells (already 45/49) and the Bolts evolution band for a state players cannot be in. Locked targets moved: none. (Open from before and unchanged: Bolts first evo ~7:30 vs 5:30 target.)

## Probe note
`scripts/live-probe.mjs` now also returns seed, weapon ids and evolution ids per run (additive). Machine was otherwise idle; about 125 minutes of runs.
