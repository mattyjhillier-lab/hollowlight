# RT3 + RT2 follow-ups: handoff (safe-stop 2026-10-26, WIP on wip/rt3, NOT merged)

## Built on this branch (tests 1161/1161 green after each step)
- scripts/tree-budget.mjs: the 'COMBAT TOTAL NaN' bug is fixed. Pity-timer drop effects (heartPity/magnetPity have no weight) now count 0. The total now reads 24.1 (cap 40); light 7.7.
- Bolts boss rule (Matt pick 1): `weapons.json spirit_bolts.boss: 2`, applied generically in Sim.hurt. Any weapon with a top-level `boss` multiplies its damage on a boss, burns included; only Bolts has it. evo-home: Bolts evolution boss ratios are unchanged (tempest 1.75x, lance 2.44x, pages 1.75x).
- Ravens Watch base 90 -> 80 (Matt pick 3). tests/ravens.test.mjs hint golden is now 80 -> 92.
- Bolts first-evolution nudge (RT3, trial): `spirit_bolts.evoNudge {pair 6, partnerRank 2, partnerMult 4}`, read per weapon in src/sim/cards.js (falls back to balance.evoNudge). RESULT: BAD. Revert or halve it (see b).

## Measurements (Twilight, Bond 0, Blessings + dodge on; data docs/design/rt3-data, summarise: node docs/design/rt3-data/sum.cjs <file>)
(a) Bolts boss 2x + Watch 80, no nudge (a.jsonl, complete, 1536 runs):
| cell | before (RT2 try 3) | now |
|---|---|---|
| fresh Bolts win, random 96 (W/E) | 4 / 7 | 17 (11-25) / 24 (17-33), fight 102 s, wgr 79-80 |
| fresh Bolts FOCUS 48 (W/E) | - | 21 / 27 |
| fresh Ravens random 96 (W/E) | 44 / 55 | 33 (25-43) / 47 (37-57): still above 30 |
| fresh Ravens FOCUS 48 (W/E) | - | 35 / 50 |
| Bolts first evo fresh / mid | 7:27-7:42 / 6:26-7:18 | 7:27-7:42 / 6:21-7:14 |
| mid tree (half) win W/E, 96 each | Wolves 43/43, Ravens 24/44, Bolts 43/42, Chain 45/49, Orbit 42/45 | Wolves 42/48, Ravens 32/45, Bolts 45/49, Chain 43/51, Orbit 32/33 |
The RT3 mid band 30-55 is MET for every start before any RT3 lever (Orbit at the low edge, 32/33). No L5/L6 change is needed.
Orbit-Wren deaths before 5:00 are still 9%. This is pre-boss and no lever in this branch touches it.

(b) + Bolts evoNudge (b.jsonl, 459/480 runs, stopped): fresh first evo did NOT move (7:27-7:29). Mid Bolts jumped to 67 / 66, ABOVE the 55 band edge (evo 6:05-6:21). Fresh 13/26 random, 21/22 FOCUS.
-> Recommend: revert the evoNudge (remove spirit_bolts.evoNudge; the cards.js hook is harmless). Accept a Bolts first evo of about 7:30, or ask Matt.

## Next (resume)
1. `git worktree add C:\Users\matty\hl-rt3 wip/rt3`, npm install. Remove the `"evoNudge"` line from spirit_bolts in weapons.json; npm test.
2. Gates: build, npm audit, evo-home (Ravens kite numbers re-checked: murder_storm 2.05-2.07, spearhead 1.85-2.05, ok), tree-budget.
3. Merge origin/dev, tests, then merge to dev. Add LOCKED/QUEUE rows: Bolts boss 2x, Watch 80, budget fix, RT3 mid band met with no lever. Ravens fresh 33/47 is still above 30: a decision for Matt.
