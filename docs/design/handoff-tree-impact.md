# Handoff: tree impact work (paused 2026-10-18 night)

## Done and pushed on dev
- Commit "Tree impact audit": scripts/review/{impact-lib,impact-groups,impact-sweep,tree-impact}.mjs + docs/design/tree-impact.md (analytic per-node marginal PE, findings, felt-impact table).

## On this branch (wip/tree-impact), NOT on dev: Lever 1 (unverified at 96 seeds)
- src/data/tree/core.json: lore cap 2->0, choice cap 1->0 (loaned to live categories until Card Fan / Almanac / Hearth-key / Night Gate go live); tagS 5->6.4, tagM 5->6.4, dmg 2.5->2.7, cast 3->3.6, perWeapon 7->8.6 (cap-sum stays exactly 15.18); ma_focus and ma_pow3 +2 -> +3, ma_cast -2 -> -3 (descs updated).
- Tests updated for the new constants: tests/t3.test.mjs, tests/treedata.test.mjs, tests/tree.test.mjs, tests/fixtures/tree-v2-rescale.json. Full npm test was green except savev3 "hostile compact trees", which is a timing flake under CPU load (passes alone).
- Live combat PE 9.78 -> 11.08.

## Numbers so far (HEAD incl. EN3/EN4; GATES=all, Blessings on; win % random/FOCUS; 48 seeds = +-7 pts)
- No tree, all gates open (96 seeds random): Wren 2, Elias 8. Starter (GATES=starter, 48): Wren 6, Elias 13 (older T3 report said 24/23: EN3/EN4 made the game harder).
- Full tree BEFORE (96 seeds): Wren 10/40, Elias 43/46. Half tree BEFORE (48): Wren 6/27, Elias 21/33.
- Full tree + Lever 1 (48 seeds, cap 8.5): Wren 21/40, Elias 50/52. Not yet run at 96 seeds or for half.
- What-if (never ship): every combat face and cap x2 (TREE_K=2): Wren 40/58, Elias 56/67; x1.5 on top of Lever 1: Wren 23/40, Elias 60/69.
- Sustain-only nodes: Wren 4, Elias 10; non-sustain: Wren 19, Elias 27 (random, 48).
- Group ablation (32 seeds random, +-18): Elias loses most without Hearts (-16), revive (-13), area (-13), magic power (-9); Wren without Status (-22), Damage (-16), Summon power (-9).

## Still to run (worktree trick: git worktree of HEAD under scratchpad so Husk WIP does not skew sweeps; copy scripts/review/impact-*.mjs and src/data/tree/core.json in; node_modules junction)
1. From the worktree with Lever 1 data: `THREADS=12 node scripts/review/impact-sweep.mjs full 96 1 0,1` and `half 48 1 0,1`; compare to the BEFORE rows above.
2. Verify starter unchanged: `node scripts/review/impact-sweep.mjs starter 48 1 0` must give Wren 6 / Elias 13 exactly (tree is null so it is by construction).
3. Optional measured per-node ablation: `node scripts/review/tree-impact.mjs 24 docs/design/tree-impact.md` (slow, ~85 nodes x 2 heroes x 24 seeds).
4. Update docs/design/skill-tree-v2.md budget table (loan note), docs/LOCKED.md rows, docs/QUEUE.md; merge Lever 1 to dev only after step 1 shows no regression.
5. Sweeps must run in the FOREGROUND (or run_in_background); a nohup background process was starved by the OS.

## Open decisions for Matt
- The full tree cannot reach 45-55 / 65-75 inside the 15.5 / 5.0 ceilings: Lever 1 adds only +13 % tree power. About x2 is needed (Wren 40/58, Elias 56/67). Options: raise the combat ceiling (reopens a locked row), accept a lower target band, or shrink/merge weapon-cluster knots (each is ~0.01 PE; pools are 2.3-3x oversaturated).
- Wren vs Elias gap is mostly hero baseline (2 vs 8 with no tree); a Wren-only fix (wolf damage/bleed) is a hero-balance chunk, not tree data.
