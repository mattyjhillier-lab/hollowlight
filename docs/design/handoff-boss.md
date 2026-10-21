# Handoff: Elder Treant boss build (safe-stop 2026-10-21)

## Done (committed + pushed on dev)
- 859873e B0 + moves (sim): src/sim/boss.js (data-driven from enemies.json elder_treant.fight, validated), Sim hooks, arrival at 14:00 (waves stop, foes crumble to gems, free magnet, held sim.clock), Root Ring r 230, HP 6000, damage 6/10/15 x tier, six moves over three phases, phase floors + stagger + heart + Husk Calls, pressure, level-up hold, DR4 recap copy, AL-6 re-timed, bot boss dodge model, scripts/boss-sweep.mjs + boss-det.mjs, tests/boss.test.mjs (21 incl. escape checks at Elias 76 u/s after 0.35 s).
- f814cd9 B1 + B3 + B4 (render): src/gfx/boss/bossview.js + bossart.js + husk/treant.js (ported First Husk Elder art, 15 frames, lazy bake at 10:00), ring + roots + outside wash + banner + fight zoom/clamp + edge arrow, all tells in DR2 style, victory beat (hit-stop, kneel, mask, flood over the map, hero line, results after 6 s), HUD HELD/DAWN, tests/boss-render.test.mjs, screenshots docs/screenshots/boss/.
- Determinism gate: 12 runs byte-identical to the pre-boss build up to t=599.

## On branch wip/boss only (not on dev)
- scripts/boss-perf.mjs (boss view own frame cost) and re-shot screenshots after the nightlayer fix (no floating eye dots).

## Verified numbers
- Tests: 901, 899 pass; the 2 fails are the known timing flakes under load (T1 synthetic tree, T2 hostile compact), pass alone.
- Perf (RTX 3060 headless, 350 foes held in the ring): BossView own cost High 0.19 / Med 0.14 / Low 0.09 ms per frame (gates 0.5 / 0.3 / 0.2). Bake 1.2-1.8 s, atlas High 7.1 MB, Low 0.9 MB.
- DR2 red-orange share within 240 px of the hero: max ~1.6% (gate 4%). Boss body vs floor |dL*| ~10-14.
- Starter sweep (96 seeds/cell, BLESS on, DODGE on, BEFORE the pooled-tell fix): win% Wren 28/24, Elias 18/27 (random/FOCUS); reach 14:00 = win (P(beat|reach) 100%); fight median 12-14 s (target 75-100 s); boss share of defeats 0%.

## Design problem to report to Matt (needs a decision, HP is locked)
- At the locked HP 6000 the fight lasts ~13 s (kits do ~400 DPS once waves stop). Lever: boss HP ~24k-36k (what-if sweeps were queued, not finished). Raising HP will drop the starter win rate below 15-30% (R1); levers for that belong to the FINAL retune.

## Not finished / next step
1. Re-run sweeps (killed at safe-stop): `node scripts/boss-sweep.mjs 96`, `DODGE=0 ...`, `GATES=all META=full ...`, and what-ifs `ENEMY_PATCH='{"elder_treant":{"hp":36000}}' node scripts/boss-sweep.mjs 48` and hp 24000.
2. Update docs/LOCKED.md (BUILT row with numbers), docs/QUEUE.md, boss-treant-v1.md status header.
3. Merge wip/boss extras to dev (boss-perf.mjs + new screenshots).
4. Remaining chunks: B5 (sound cue hooks / polish), B6 tier rules check (Ironbark on saplings blocked: marks not built), B7 balance pass (HP decision), B8 real-phone check.

## Boss HP what-if sweeps (2026-10-21; BLESS on, DODGE on; fight = median s among wins; 96 seeds/cell base, 48 seeds/cell others; +/- = 95% CI)
| HP | Starter win% (wren r/f, elias r/f) | Starter fight med | Full-tree win% (GATES=all META=full) | Full-tree fight med | Boss deaths |
|---|---|---|---|---|---|
| 6000 | 28/24, 18/27 (+/-8-9) | 12-14 s | 38/50, 60/77 (48 seeds, +/-12-14) | 16-20 s | 0 starter; 0 full |
| 24000 | 27/19, 19/23 (+/-11-13) | 42-43 s | 35/50, 60/77 | 49-67 s (p90 86-108) | 0 starter; 1/31 full (wolf:contact) |
| 36000 | 27/19, 19/23 | 62-64 s | 35/50, 60/77 | 69-94 s (p90 123-159) | 0 starter; 1/31 full (wolf:contact) |
- Win% does not move with HP: starter wins = reach 14:00 (P(beat|reach) 100%); starter 15-30% holds at all HPs. Full-tree 35-77% is unchanged by HP (above the starter target; a tree-balance matter, not boss).
- Fight length is linear in HP (~1.7 s per 1000 HP starter, ~2.3 s per 1000 full tree); adds share of damage falls 25% -> 8% -> 6%.
- No HP hits 75-100 s for both: starter would need ~44-58k, full tree is already 69-94 s at 36k (48k would give ~90-125 s).
- Recommendation: 36000 (starter 62 s, full tree 69-94 s); 40-44k if the starter fight must reach 75 s.
