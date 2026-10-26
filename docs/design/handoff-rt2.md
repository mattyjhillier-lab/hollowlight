# RT2 boss-threat pass: handoff (safe-stop 2026-10-26, WIP on wip/rt2b)

State: try 1 sweep STOPPED at 397/1920 runs (seeds ~1-20 per cell). Not verified, not merged. Resume, don't restart.

## Changes on this branch (try 1)
- src/sim/weapons.js: Chain first strike prefers a live, non-immune boss within the same 220 u (jumps still go to adds) (locked RETUNE PLAN DECISIONS 2).
- src/sim/weapons.js + weapons.json `holy_orbit.stats.radius.bossReach: 16`: Orbit lights touch a boss at e.r + u.r + 1 + 16 (wider crown contact; bot unchanged).
- enemies.json `elder_treant.fight.dmg` {6,10,15} -> {12,20,30} (x2; started at x2 not x1.5 because B7 what-if showed x2 -> ~79% win-given-reach; x1.5 kept as the fallback if x2 overshoots). HP 36000 unchanged. Tier enemyDmg still multiplies (boss.js damage()). Heavy x2 = 30 (Long Night 39) vs 100 HP: still 3+ hits, tells unchanged.
- tests/boss.test.mjs: dmg golden -> [12,20,30]. npm test 1161/1161 green at try 1.

## Try table (Twilight, random bot, Blessings + dodge on; fresh = none/Bond 0, mid = half/Bond 0)
| try | lever | runs | pooled win-given-reach fresh / mid | boss % of defeats fresh / mid | fight med s W/R/B, Chain, Orbit (pooled) |
|---|---|---|---|---|---|
| base (dev 4ba5a16) | none | 1920 (96/cell) | 88 (84-91) / 96 (94-98) | 6 / 4 | 93, 157, 193 (fresh Chain 408, fresh Orbit 245, fresh Bolts 198) |
| 1 (partial) | Chain boss-first + Orbit bossReach 16 + dmg x2 | 397 (~20/cell, noisy) | 62 (50-72) / 83 (74-89) | 17 / 11 | 90, 124, 138 |
Partial read: direction right; fresh near band, mid still above 75; Chain/Orbit reachers now lose more (45 / 52 wgr) while W/R/B 90.
Per-cell baseline table: `node docs/design/rt2-data/sum.cjs docs/design/rt2-data/base.jsonl`.

## Resume
1. `git worktree add C:\Users\matty\hl-rt2b wip/rt2b`, npm install.
2. Copy docs/design/rt2-data/try1.jsonl to scratch, then `CELLS='\|(none|half)\|normal\|b0\|random' node scripts/rt-matrix.mjs <scratch>/try1.jsonl 96 24 11 48` (resumes; ~70 min left, 11 workers). Do not edit src/ while it runs (workers re-import per chunk).
3. Summarise with sum.cjs. Next tries per plan: x2.5 if mid still > 75 (or x1.5 if fresh overshoots below 60); max 3 tries total.
4. Then guards: RT1 fresh bands (48 seeds; already inside these cells), Ravens fresh (RT1 default: if > 30% try Watch ~80 is a RT1 follow-up, report only), Orbit-start Wren deaths < 5:00 (base 9%), bot dodge sanity, build, npm audit, LOCKED/QUEUE rows.
Open note: fresh Bolts fight 198 s is RT1's power (L1), not a boss lever; report as a miss if it stays > 100.
