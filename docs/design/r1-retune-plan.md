# R1 retune checkpoint: prep, measurements and plan (2026-10-18)

Prep only. Nothing here changes dev, LOCKED or any shipped data. All numbers: bot sweeps on committed `origin/dev` 5ac498d (measured in a worktree), Blessings on, GATES=starter unless stated, bot = `scripts/g1d-sweep.mjs` (wren/elias x random/FOCUS). Noise: +/-10 pts at 96 seeds, +/-6-7 at 192 seeds. Treat anything under ~8 pts as noise.

## 1. Merge dry run (w2-rally into origin/dev)
- Branch = ONE commit (3ed2ef0, 2026-10-15) off 5b246648. Contents: Wren's Pack Howl replaced by **Rally the Pack** (`rally_pack`, 60 s cd, 6 s window, wolves converge on and pin the toughest non-boss enemy within 240 px (a boss only if nothing else is near, never pinned), wolf bite damage +50% (`ability.bonus 0.5`), no speed boost, no fear). New sim state `sim.rally`, `buffs.rally`, `updateRally`, `pickRallyTarget`, events `rally`/`rallyEnd`, `RunScene.rallyMoment()` (amber ring, pup flare, ember puff), toasts, emblem, tests/rally.test.mjs, ABILITY=off switch (already on dev). Touches ONLY the wolves (weapons.js ghostWolves). **Ravens: no code reads rally.target.** A comment in Sim.js ("Ravens read this.rally.target from W8a on") is a stale promise; Matt withdrew it, ravens stay independent. Delete that comment on merge, and fix the LOCKED row 21 text "Rally the Pack calls wolves AND ravens" at lock time.
- Conflicts: 8 files, 10 hunks. **Code (6 files, 7 hunks), all mechanical:** `src/app.js` (toast lines: keep rally + 'Howl' + wheel), `src/data/tree.json` (sp_dur text: keep dev's Candle Wheel wording, with "Rally the Pack"), `src/ui/hudsvg.js` (EMBLEM_OF: union of both), `src/scenes/RunScene.js` (keep both rallyMoment and dev's E9 evolveMoment(evoId)), `src/sim/Sim.js` (keep the rally branch, drop the branch's stale Sanctuary branch, keep dev's candle_wheel branch), `src/sim/weapons.js` 2 hunks (dev rewrote the wolf block: Echo Pack, Alpha, Rend, bite rate, Light Trails: take dev's block and swap `howl` for the `rallying` multiplier on dmg only; the branch's leap/maul code is dead on dev because Light Trails replaced Pouncing, so drop it and keep only the `rallyT` retarget block). **Docs (2 files):** LOCKED.md and QUEUE.md append conflicts, trivial (keep both).
- Semantic leftovers (not conflicts, found by the tests): `tests/rally.test.mjs` asserted Elias = sanctuary (now `candle_wheel`); `tests/title.test.mjs` hero-select text 'Pack Howl' -> 'Rally the Pack'; `scripts/gen-tree.mjs` sp_dur desc; probe scripts mention packHowl (not in `npm test`). `buffs.packHowl` is gone from src; nothing on dev still reads it after the merge.
- Result of the resolved merge (scratch worktree, removed afterwards): **npm test 656/656 green** after those two test-string fixes. Effort for the real merge: about 30-45 min, no design work. Do it as a merge commit on `dev`, then delete the branch.
- Balance effect of Rally (the reason it was held), starter 96 seeds, dev -> merged: **Wren random 56% -> 39%, FOCUS 64% -> 29%**; Elias byte-identical (30%/34%, same death times). Pack Howl was worth about +17-35 pts (it doubled bite speed, +25% run speed, fear); Rally is +50% bite for 6 s. Ability on vs off (merged, ABILITY=off): Wren 39/29 -> 41/34, Elias 30/34 -> 30/34 => active abilities are now a modest share (within noise, 0-5 pts), as locked.

## 2. Current state vs locked targets
Dev as committed (Rally NOT merged), 96 seeds, deaths by minute bucket:

| cell | win % | deaths <5:00 | 5-7 | 7-9 | 9-11 | 11+ | boss (>=10:00) share of deaths |
|---|---|---|---|---|---|---|---|
| Wren random | 56 | 4 | 15 | 10 | 12 | 1 | 29% |
| Wren FOCUS | 64 | 7 | 12 | 9 | 5 | 2 | 17% |
| Elias random | 30 | 13 | 35 | 12 | 4 | 3 | 9% |
| Elias FOCUS | 34 | 5 | 37 | 9 | 6 | 6 | 14% |

Dev + w2-rally merged, 192 seeds (the real R1 start point, `base192`): Wren random 38 / FOCUS 34; Elias random 29 / FOCUS 34. Deaths <5:00: Wren 15 / 11 (8% / 6% of runs), Elias 31 / 17 (16% / 9%). The 5-7 min bucket is the death bulge (Elias 66-70 of ~130 deaths, Wren 43-47). Boss share of deaths Wren 25% / 21%, Elias 10%. First evolution median (32 seeds): Wren 4:01 / 3:47, Elias 4:49 / 3:36 (target ~4:00: ok). Blessing picks/run: Wren 1.3-1.5, Elias 1.2 (first offer ~10:25; D1 emptied the Blessing pool, expected). Hearts 8-10/run, magnets 5-7/run.

GATES=all (full toolkit, dev, Blessings not in that mode): Wren random 16% / FOCUS 44%; Elias 10% / 13%; deaths spread 5-13+ min, boss share Wren 64-72%, Elias 24-44%. Random picks across 5 weapons dilute power (a pick-quality effect, not a bug). Tree (merged build, GATES=preset, no Blessings): META=half Wren 50% / 79%, Elias 79% / 77%; META=full Wren 85% / 95%, Elias 95% / 99% (all deaths at or after the boss, none before 5:00). The soft cap keeps the full tree strong but not total, as designed. Note: tree rows were measured on the OLD hpScale and will drop with step 3.

| locked target | dev (Rally held) | dev + Rally |
|---|---|---|
| no-tree random-pick win 15-30%, both heroes | FAIL: Wren 56-64% | Wren 34-38% (over), Elias 29-34% (top of band / just over) |
| Wren-Elias gap small (<=6 pts) | FAIL: 26-30 pts | ok: 4-5 pts (avg Wren 36 vs Elias 31.5) |
| no deaths before ~5:00 | FAIL for Elias (9-16% of runs), Wren 4-8% | same |
| deaths spread 6-14 min | bunched at 5-7 min (Elias ~50% of deaths), few after 11 min | same |
| first evolution ~4 min | ok (3:36-4:49) | ok |
| abilities a modest share | ok (0-5 pts, noise) | ok |
| boss-death share | Wren 17-29%, Elias ~10% (Elias rarely reaches the boss) | same |

## 3. Knob sensitivity (merged build, 96 seeds, base = Wren 39/29, Elias 30/34; cells = random/FOCUS)
- hpScale.linear 0.46 -> 0.50: Wren 35/36, Elias 22/15. -> 0.55: Wren 22/16, Elias 13/11. About **-15 pts per +0.09 linear** averaged over both heroes (~ -1.7 pts per +0.01); Elias reacts harder than Wren (he dies earlier, scaling bites him mid-run).
- dmgScale.linear 0.07 -> 0.09: Wren 35/22, Elias 27/29. Weak and noisy; not recommended.
- Elias holyDamage 1.15 -> 1.50 (the LOCKED R1 candidate): **Elias 49/47**, Wren unchanged. About +16 pts for +30% damage: too much on its own; 1.30 is the safer pick once hpScale rises (C1/C3).
- Boss HP 3000 -> 4500: **Wren 23/18** (-16/-11), Elias unchanged (he never reaches it). The cleanest Wren-only lever; 3600 is about -8.
- Wave density, wolf/crow rate1 +17%: Wren 36/34 (flat), Elias 26/24 but **deaths <5:00 jump to 17-22 (Elias) / 10-12 (Wren)** (of 96) and the 5-7 min bulge grows. Front-loaded density is the wrong lever for the early-death target.
- XP linear 2.2 (+16%): Wren 23/19, Elias 14/16, levels -25%, Blessing picks collapse: works but removes the toolkit-growth feel; avoid.
- Elias HP 130 -> 150 (C2 vs C1, 192 seeds): deaths <5:00 29 -> 12-16 (about -50%), wins +0 to +5. A real fix for the early-death target.
- Wave curve 0.55 -> 0.7 (less front-loaded; C4 vs C3, 192 seeds): Elias <5:00 deaths 16 -> 8-10 (4-5% of runs), wins flat; Wren FOCUS -8 (boss and later pressure); Wren <5:00 unchanged (16-21): Wren's early deaths are the bot's weak early picks, not density.

## 4. Candidate configurations (merged build, 192 seeds, noise +/-6-7)
| id | change from dev + Rally | Wren rand / focus | Elias rand / focus | <5:00 deaths of 192 (Wren rand,focus / Elias rand,focus) |
|---|---|---|---|---|
| base192 | none | 38 / 34 | 29 / 34 | 15,11 / 31,17 |
| C1 | hpScale.linear 0.50, Elias holy 1.30, boss HP 3600 | 28 / 28 | 30 / 33 | 16,18 / 29,29 |
| C2 | C1 + Elias HP 150 | 28 / 28 | 28 / 38 | 16,18 / 16,12 |
| **C3** | hpScale.linear **0.53**, holy 1.30, boss 3600, Elias HP 150 | **21 / 23** | **22 / 29** | 21,27 / 16,16 |
| C4 | C3 + wolf/crow wave curve 0.7 | 24 / 15 | 23 / 27 | 16,16 / 8,10 |

C3 lands both heroes in the band (Wren avg 22, Elias avg 25.5, gap 3.5). C4 fixes Elias' early deaths but pulls Wren FOCUS to 15 (edge of band, within noise).

## 5. Proposed R1 plan (ordered; every step except 1 is a data-only change)
1. **Merge w2-rally** (Rally the Pack) as in section 1; fix the 2 test strings + gen-tree text; remove the stale ravens comment. Balance effect is the measured Wren drop (56/64 -> 38/34). Verify: npm test, GATES=starter 192-seed sweep (expect Wren ~36, Elias ~31, gap <=6). Needs Matt only for the LOCKED wording fix (ravens independent).
2. **Elias: holyDamage 1.15 -> 1.30 and HP 130 -> 150** (traitText "+30% holy damage"). Not +50% (Elias 48%). This changes the LOCKED "Elias stats" and "Elias kit decision" rows (R1 candidate was +50%): **Matt decides** (one-tap: 1.30 + HP 150 recommended / 1.50 as locked candidate / keep 1.15).
3. **hpScale.linear 0.46 -> 0.53** (quad 0.020 unchanged). Changes the LOCKED "Base difficulty" row (0.46/0.020, "no-tree win ~17-30%"): the row's own aim is the band, and the W-batch (D1, W4 guard, W7 bite rate, E3) made the toolkit stronger, so the constant has to move. **Matt decides.** Predicted: both heroes ~20-26%.
4. **Boss HP 3000 -> 3600** (enemies.json elder_treant). Pulls Wren (the hero who reaches the boss: 25% of her deaths) down without touching Elias, keeping the Wren-Elias gap <= 6, and lifts the boss-death share. Optional if step 3 alone lands Wren under 30. Needs Matt (player-facing).
5. **Early-death fix, only if the bot still shows >5% of Elias runs dying before 5:00 after steps 1-4:** wolf/crow wave `curve` 0.55 -> 0.65 (C4 used 0.7); keep the 60/150 s swarm events. Wren's early deaths (4-14%) are bot pick quality; judge "no deaths before ~5:00" on a real playtest. Needs Matt (taste).
6. **Re-baseline**: 192-seed sweep, random and FOCUS, both heroes, GATES=starter with Blessings; GATES=all; META=half/full; `stat-ranks`, `evo-home` (evolution bands 1.8-2.3x, 3x cap, never below base: these are damage ratios and do not move with hpScale), `gates-softcap`, `tree-budget`, `gates-pace` (unlock pacing slows when runs are harder). Record in LOCKED (R1 BUILT row), QUEUE and evolutions-second-review section 6 row R1.
7. Only then: weapon roster review and the skill tree redesign sheet.

Predicted end state (C3, 192 seeds): Wren 21-23%, Elias 22-29%, gap ~3.5; first evolution 3:40-4:50; deaths mostly 5-9 min with a boss tail (Wren boss share ~26%); abilities within noise; full tree about 10 pts lower than the 85-99% measured on the old hpScale.

## 6. Risks
- The bot is not a human: random picks and weak kiting understate human skill; 15-30% is a bot band. A real playtest after R1 must confirm; if humans win more, step 3 may be too hard for new players. Mitigation: hpScale stays a one-line data change.
- Noise: +/-6-7 at 192 seeds; do not read single cells under ~8 pts. Always report random and FOCUS.
- hpScale steps hit Elias harder than Wren (he dies mid-run). Re-check his <5:00 deaths after step 3; HP 150 is the guard.
- Higher hpScale lowers levels reached (-5 to -10%) and Blessing offers: C3 gives Wren 0.7-0.9, Elias 0.75-0.9 picks per run (at the floor after D1). A first-offer-level tweak may be needed (separate decision).
- Deaths-spread target (6-14 min) will stay bunched at 5-9 min with this bot; late deaths come from the tree and play skill, not these constants.
- GATES=all random cells (Wren 16%, Elias 10%) already sit under the band; step 3 lowers them further. Acceptable if the 15-30% band means the starter pool; confirm with Matt.
- If Wren falls below 20% after step 3, relax step 4 (boss HP back to 3000) before touching hpScale.
- Each 192-seed 4-cell sweep takes about 8-10 min on this machine.

## 7. What needs Matt
1. Elias holy +30% and HP 150 (instead of the locked +50% candidate or staying at +15%).
2. hpScale.linear 0.46 -> 0.53 (changes LOCKED Base difficulty).
3. Boss HP 3000 -> 3600 (optional, recommended).
4. Early-curve change (only if needed) and the "starter pool only" reading of the 15-30% band.

## 8. Reproduce
`node scripts/r1-whatif.mjs <checkout> <label> <seeds> "file.dot.path=value" ...` copies the checkout's src and scripts to a temp dir, patches the data JSON and runs `scripts/g1d-sweep.mjs` (4 cells, 16 workers). Example C3: `node scripts/r1-whatif.mjs . c3 192 balance.hpScale.linear=0.53 characters.elias.traits.holyDamage=1.3 enemies.elder_treant.hp=3600 characters.elias.hp=150`. Env passes through (ABILITY=off, GATES=all|preset, META=half|full, BLESS=off, SEED_FROM). The merged checkout was a throwaway worktree.
