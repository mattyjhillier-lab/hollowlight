# Final retune plan (PLAN phase, 2026-10-25)

Status: PLAN done 2026-10-25 (baseline measured, nothing applied). Nothing in src/ changed; only scripts/bot.mjs (bot kit fix), scripts/rt-matrix.mjs, scripts/rt-summary.mjs.
Targets: docs/LOCKED.md 'FINAL RETUNE TARGETS (Matt, 2026-10-25)'.

## 0. RT0 bot-kit fix (Elias baseline 0%)

Finding: not a start-weapon or kit-grant bug. Elias starts with his kindred Holy Orbit (correct, GATES=starter grants heart + Sanctum Halo gate).
The bot's flee radius (90 u) is wider than the candle ring (38 u at rank 0, 62 u at rank 4), so a bot whose ONLY spirit is the Orbit kites
every foe outside its own ring: about 70 kills and level 18 in 17 minutes, never dies before the boss, then dies to the boss (the boss kite
band 120-170 u is also outside the ring). Same result on the CH1-CH3 commit 63f1b17, so it dates from 'start with any weapon'
(an Orbit-only kit did not exist before character v2). Wren + Orbit shows the same (0%). Elias + Wolves plays normally.

Fix (scripts/bot.mjs only): while every owned spirit is Holy Orbit, the bot adds a pull toward the nearest foe outside ring reach when HP is
above a threshold (grazing, like a human Orbit player), and kites the boss at ring reach between tells. Any other kit is byte-identical
(checked: wren sweep with and without the fix identical). BOT_ORBIT=0 restores the old bot.

Measured with the fix (sweep.mjs, Blessings on, 24 seeds, random): Elias + Orbit 0% -> 13% (pull 0.8; level median 26, first evolution 7:10,
deaths 4:34-14:16); Wren + Orbit 4% (pull 0.5 probe). Rejected variants: a smaller flee radius (ring reach + 6..40 u) is a knife edge
(0% at +6..+30, 13% at +40, 0% at 90: either the crowd wins or nothing is touched). Pull 0.8 + HP gate 40% is the default.

## 1. Baseline matrix (dev 1d10071 + RT0 bot, Blessings on, dodge on, random bot unless noted)

Seeds: headline cells 96 (95% CI shown, about +-9 to +-10 pts at 50%), FOCUS 48, context cells 24 (about +-18 pts). Raw: scripts/rt-matrix.mjs,
summary: scripts/rt-summary.mjs. 'reach' = alive at 14:00 (boss arrives at 840 s); 'fight' = boss kill time - 840 s (winners only).

### 1a. Headline Twilight cells (96 seeds each)

| start | hero | FRESH (none, Bond 0) win % (CI) | dead <5:00 | reach | win given reach | boss share of defeats | fight median s | first evo | MID (half, Bond 0) win % (CI) | MAXED (full, Bond 25) win % (CI) | maxed fight s |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Wolves | Wren | **25** (17-35) | 5 | 25 | 100 | 0 | 84 | 4:02 | **58** (48-68) | **93** (86-96) | 76 |
| Wolves | Elias | **29** (21-39) | 4 | 29 | 100 | 0 | 84 | 4:05 | **65** (55-73) | **94** (87-97) | 78 |
| Ravens | Wren | **84** (76-90) | 1 | 84 | 100 | 0 | 51 | 4:29 | **57** (47-67) | **98** (93-99) | 86 |
| Ravens | Elias | **90** (82-94) | 0 | 90 | 100 | 0 | 51 | 4:46 | **59** (49-69) | **96** (90-98) | 100 |
| Bolts | Wren | **74** (64-82) | 1 | 74 | 100 | 0 | 131 | 5:31 | **79** (70-86) | **99** (94-100) | 89 |
| Bolts | Elias | **75** (65-83) | 0 | 75 | 100 | 0 | 131 | 5:25 | **80** (71-87) | **100** (96-100) | 90 |
| Chain | Wren | **10** (6-18) | 3 | 25 | 42 | 16 | 449 | 4:54 | **59** (49-69) | **94** (87-97) | 107 |
| Chain | Elias | **11** (7-19) | 3 | 27 | 42 | 18 | 448 | 5:01 | **58** (48-68) | **100** (96-100) | 97 |
| Orbit | Wren | **8** (4-16) | 3 | 21 | 40 | 14 | 296 | 7:00 | **53** (43-63) | **96** (90-98) | 112 |
| Orbit | Elias | **22** (15-31) | 2 | 41 | 54 | 24 | 292 | 7:55 | **55** (45-65) | **95** (88-98) | 104 |

Bands (LOCKED): fresh 15-30, mid 30-55, maxed 65-90; boss: win given reach 60-75, boss 20-35% of defeats, fight 75-100 s.
Hero gap (Wren - Elias): within noise for every start except Orbit fresh (-14, CIs overlap a little); the old Wren damage wall is gone at Bond 0
with the shared body.

FOCUS bot, fresh Twilight (48 seeds): Wolves Wren 15 / Elias 25, Ravens 83 / 83, Bolts 75 / 67, Chain 8 / 10, Orbit 10 / 15 (same picture as random).

### 1b. Long Night maxed (full tree + Bond 25, 96 seeds; LOCKED band 10-20)

| start | Wren win % (CI) | Elias win % (CI) | reach (W/E) | win given reach (W/E) | fight median s (W/E) |
|---|---|---|---|---|---|
| Wolves | 13 (7-21) | 35 (27-45) | 15 / 38 | 86 / 94 | 215 / 197 |
| Ravens | 32 (24-42) | 49 (39-59) | 41 / 52 | 79 / 94 | 156 / 172 |
| Bolts | 30 (22-40) | 35 (27-45) | 36 / 44 | 83 / 81 | 157 / 157 |
| Chain | 22 (15-31) | 40 (30-50) | 32 / 44 | 68 / 90 | 230 / 228 |
| Orbit | 15 (9-23) | 22 (15-31) | 21 / 35 | 70 / 62 | 286 / 248 |

Same cells WITHOUT Bond (full tree, Bond 0, 24 seeds): 0-8% for every start (reach 0-17%). Long Night is decided by Bond, not the tree.

### 1c. Context cells (24 seeds, about +-18 pts; read as direction only)

| cell | Wolves W/E | Ravens W/E | Bolts W/E | Chain W/E | Orbit W/E |
|---|---|---|---|---|---|
| Twilight full tree, Bond 0 | 58 / 67 | 67 / 75 | 88 / 83 | 88 / 88 | 54 / 71 |
| Twilight NO tree, Bond 25 | 63 / 75 | 100 / 100 | 100 / 92 | 38 / 50 | 42 / 58 |
| Deep Dusk no tree, Bond 0 | 4 / 13 | 17 / 17 | 71 / 42 | 0 / 0 | 0 / 4 |
| Deep Dusk mid tree, Bond 0 (working band 15-30) | 42 / 33 | 38 / 29 | 54 / 54 | 38 / 38 | 21 / 33 |
| Deep Dusk full tree, Bond 0 | 33 / 54 | 46 / 58 | 63 / 79 | 63 / 54 | 25 / 46 |
| Deep Dusk full tree, Bond 25 (working band 35-55) | 88 / 96 | 83 / 67 | 96 / 88 | 100 / 88 | 88 / 88 |
| Long Night mid tree, Bond 0 | 0 / 4 | 0 / 0 | 8 / 8 | 0 / 4 | 0 / 0 |

Bond 25 vs Bond 0 (same tree, Twilight): fresh +27 to +46 pts for Wolves/Chain/Orbit (Ravens/Bolts capped near 100), full tree +6 to +42.
Deaths before 5:00 (Twilight, 96 seeds): 0-5% everywhere (Wolves FOCUS 8%, 48 seeds). Fresh Wolves/Chain/Orbit die mostly 7-14 min;
Ravens/Bolts barely die. First evolution median 4:00-5:30 for Wolves/Ravens/Bolts/Chain, 7:00-7:55 for Orbit (the only slow one).
Full per-cell table (death buckets, p10-p90 death time, gold) in Appendix A.

## 2. Out-of-band cells, ranked (random bot; SURE = whole 95% CI outside the band)

| rank | cell | measured | band | miss | sure? |
|---|---|---|---|---|---|
| 1 | Fresh Ravens (W / E) | 84 / 90 | 15-30 | +54 / +60 | SURE |
| 2 | Fresh Bolts (W / E) | 74 / 75 | 15-30 | +44 / +45 | SURE |
| 3 | Boss threat, every kit except Chain/Orbit starts | win given reach 97-100%, boss 0-5% of defeats | 60-75 / 20-35 | +25 / -20 | SURE (pooled, ~600 reachers) |
| 4 | Boss fight length: fresh Chain 427-450 s, Orbit 280-296 s, Ravens 49-51 s, Bolts 125-131 s | | 75-100 s | slog / too quick | SURE |
| 5 | Fresh Chain/Orbit reachers lose the boss (win given reach 40-54%) | | 60-75 | -10 to -20 | likely |
| 6 | Long Night maxed: Elias Ravens 49, Chain 40, Wolves 35, Bolts 35; Wren Ravens 32, Bolts 30 | | 10-20 | +10 to +29 | SURE |
| 7 | Mid tree Bolts (W / E) | 79 / 80 | 30-55 | +24 / +25 | SURE |
| 8 | Maxed Twilight Chain/Bolts/Ravens | 94-100 | 65-90 | +4 to +10 | SURE (4 cells) |
| 9 | Deep Dusk full tree + Bond 25 | 67-100 | 35-55 working | +12 to +45 | SURE (24 seeds) |
| 10 | Fresh Chain (W / E) | 10 / 11 | 15-30 | -4 / -5 | maybe (CI to 18-19) |
| 11 | Fresh Orbit Wren | 8 | 15-30 | -7 | maybe (CI 4-16) |
| 12 | Mid tree Wolves Elias 65; Ravens/Chain/Wolves 57-59 | | 30-55 | +2 to +10 | maybe |
| 13 | Orbit first evolution 7:00-7:55 | | ~4 min (stage-1 aim) | +3 to +4 min | SURE |
| 14 | Hero gap on Orbit: Wren 8 vs Elias 22 fresh, 54 vs 71 full (24) | | small | -14 / -17 | maybe |

In band: fresh Wolves (25 / 29) and fresh Orbit Elias (22); other mid-tree cells (53-59, at the edge); maxed Wolves/Orbit (93-96, top edge);
Long Night maxed Wren Wolves 13 / Orbit 15, Elias Orbit 22 and Wren Chain 22 (edge); early deaths.

## 3. Levers

| # | lever (file / key) | what it moves | expected effect | risk |
|---|---|---|---|---|
| L1 | src/data/weapons.json `<weapon>.stats.*.base` / `perRank` (Ravens power 7+3, Bolts power 10+3.5, Chain power 12+6, Orbit power 10+4, radius 38) | one starting weapon at every power state | the only lever that separates the starts; size per step to measure (start at 10% power steps) | moves mid/full tree and evolution ratios (evolutions read base): re-run evo-home.mjs |
| L2 | weapons.json Chain `area.first` (first hit x1.5); Chain first-target pick in src/sim/weapons.js (nearest within 220 u) | Chain boss (single-target) damage | first hit x2 should roughly halve the 450 s slog; target pick is CODE (decision 2) | boss fight only; trash clear unchanged |
| L3 | src/data/enemies.json `elder_treant.fight.dmg` {light 6, mid 10, heavy 15}, `pressure`, phase `gap` | boss threat (win given reach, boss share) | B7 what-if: dmg x2 -> Wren beat-given-reach 79%, x3 -> 68%; Elias barely moved | slams that feel unfair; check Gentle Light |
| L4 | enemies.json `elder_treant.hp` 36000 (+ tiers bossHp 1 / 1.5 / 2) | fight length for every kit at once | cannot fix the 51 s vs 450 s spread (that is L1/L2); keep 36000 as locked unless RT2 proves 75 s impossible | none if untouched |
| L5 | src/data/balance.json `hpScale` {0.53, 0.02}, `dmgScale` 0.07; chapters.json wave `rate1` / `curve` | pre-boss difficulty, every start and tree state | moves all Twilight cells together; also how many reach 14:00 | moves the 5:00 line; harder nights scale on top |
| L6 | src/data/tree/core.json budget / category caps (combat PE 30.99 / 31) | mid and full tree power | trims mid 57-80 and maxed 93-100; caps move Elias more than Wren (tree-impact.md) | locked x2 ceiling rule; re-run tree-impact |
| L7 | balance.json `bond.total` {hp 10, ward 8, speed 6, damage 5}, `bond.perks` | maxed cells, Long Night | Bond 25 = +27 to +46 pts | LOCKED size (Matt): not a lever without a reopen |
| L8 | src/data/tiers.json `template.hard.enemyHp` 1.1 (sheet said 1.45), `enemyDmg` 1.15, `density` 1.15, marks share | Deep Dusk only | full + Bond 25 at 67-100: enemyHp 1.25-1.45 is the first step | none outside Deep Dusk |
| L9 | tiers.json `template.expert.enemyHp` 2.0, `enemyDmg` 1.3, `density` 1.3, `heartPity` 1.3 | Long Night only | maxed 13-49: +10-20% enemyHp or dmg aims at 10-20 | Bond-0 full tree already 0-8%, goes to ~0 |
| L10 | balance.json `evoNudge` {pair 4, partnerRank 2, partnerMult 3} or Orbit's pair stat ranks | first-evolution time | Orbit 7-8 min toward ~5 min | global unless scoped to Orbit data |
| L11 | tiers.json `template.normal.assist` (Gentle Light enemyDmg 0.7, enemySpeed 0.9, heartSooner 1.5); balance.json `endless` density / swarm | extras only | Gentle Light Wren 71% vs sheet 45-60; Endless dark time 1:40-2:41 vs 3-6 min | Twilight assist / endless only |

## 4. Tuning order RT1..RT7 (small data chunks; measured with `CELLS=<regex> node scripts/rt-matrix.mjs`)

Anti-loop rules for every pass:
- One lever family per pass, at most 3 iterations, each iteration one data change measured on the pass's target cells at 96 seeds.
- A cell PASSES if its point estimate is inside the band, or within 3 pts of an edge with the 95% CI overlapping the band.
- After a pass, GUARD cells of earlier passes are re-run at 48 seeds. A guard that leaves its band by more than its CI half-width is repaired by
  halving THIS pass's step, never by reopening an earlier pass's lever.
- Target not met after 3 iterations: stop, keep the best iteration, record the miss for Matt (no 4th iteration).
- No pass touches an earlier pass's lever. One final reconciliation pass (RT8) only with Matt's go.

| pass | lever | target cells (seeds) | measurable target | guard cells | stop rule |
|---|---|---|---|---|---|
| RT1 starts | L1 (+L10 for Orbit's evolution pace) | fresh Twilight, every start x both heroes, random 96 + FOCUS 48 | every start 15-30% random; FOCUS 10-35; spread between starts <= 15 pts; Orbit first evo <= 5:30 | early deaths <= 5%; evo-home.mjs 1.8-2.3x home, never < base | 3 iterations, 10% power steps (Ravens/Bolts down, Chain up, Orbit from the locked +20%) |
| RT2 boss | L2 (if decision 2 = A or B) then L3 | fresh + mid Twilight reachers (96 per cell, pooled reachers >= 150) | win given reach 60-75, boss 20-35% of defeats, fight median 75-100 s for Wolves/Ravens/Bolts, <= 150 s for Chain/Orbit | RT1 fresh bands (48) | 3 iterations of boss damage x1.5 / x2 / x2.5; HP stays 36000 unless fight median < 60 s after RT1 |
| RT3 mid tree | L5 only if fresh stays in band, else L6 | mid Twilight (half, Bond 0), every start, 96 | 30-55 | RT1 + RT2 (48) | 3 iterations |
| RT4 maxed Twilight | L6 (full-tree caps) | full + Bond 25 Twilight, 96 | 65-90 | RT1-RT3 (48) | 3 iterations; if only Bond keeps a cell above 90, stop and ask Matt (Bond locked) |
| RT5 Deep Dusk | L8 | Deep Dusk mid Bond 0 + full Bond 25, 96 each | bands from decision 1 | tier-only knob: Twilight unchanged by construction (24-seed spot check) | enemyHp 1.25 / 1.35 / 1.45 |
| RT6 Long Night | L9 | Long Night full + Bond 25, 96 | 10-20 every start; deaths before 4:00 <= 5% | RT5 cells (48) | 3 iterations; accept Bond-0 full tree near 0% (the locked band is for maxed players) |
| RT7 extras | L11 | Gentle Light fresh Twilight 96; Endless dark time 24 | Gentle Light 45-60; Endless median 3-6 min | RT1 fresh (untouched by construction) | 2 iterations |

Cost: about 7 passes x 3 iterations; with 11 workers 15-40 min per iteration (Long Night and Orbit runs are slowest).
RT1 first because every later band sits on the starting weapons; boss (RT2) before trees because boss threat changes how many runs win at
every power state; harder nights last (tier-only knobs cannot disturb Twilight).

## 5. Decisions for Matt (only what the plan cannot settle alone)

1. **Deep Dusk target bands** (not locked yet; RT5 needs them). (A, recommended) mid tree 15-30%, full tree + max Bond 35-55% (the tier sheet's
   working bands); (B) one band 30-50% for any full-tree player whatever the Bond; (C) leave Deep Dusk as it is (67-100% maxed) and tune Long Night only.
2. **Chain Lightning boss slog** (a code change in one case). Chain strikes the nearest foe first, so the boss's adds soak it: fresh Chain boss fights
   last about 7.5 min and half of reachers lose. (A, recommended) Chain's first strike prefers the boss when it is in range (chain jumps still go to
   adds); (B) data only: a bigger first-hit bonus for Chain; (C) accept it as Chain's weakness and only lift Chain's base power in RT1.
3. None. Bond 25 is a big swing (+27 to +46 pts) but it is locked; the plan tunes around it and reports any band only Bond breaks (RT4 stop rule).

## 6. Verify notes (this PLAN chunk)
- Tests: npm test 1161/1161 (one run under full sweep load had one assertion fail and passed on re-run; likely a timing test under CPU load).
- Security: scripts only (bot.mjs, rt-matrix.mjs, rt-summary.mjs), no new deps, npm audit 0 vulnerabilities, no secrets, no src/ change.
- Fit: the bot change makes the probe play Orbit the way a person would (graze the crowd); the game is unchanged.
- Data: 6,240 runs; raw jsonl stays in the session scratchpad (not committed). Re-run: `node scripts/rt-matrix.mjs out.jsonl 96 24 11 48` (about 4.5 h, 11 workers), then `node scripts/rt-summary.mjs out.jsonl`.

## Appendix A. Full matrix (rt-summary.mjs output)

| hero | start | tree | tier | Bond | bot | n | win % (95% CI) | dead <5:00 | deaths 5-7 / 7-10 / 10-14 / boss (% of runs) | death median (p10-p90) | reach boss | win given reach | boss share of deaths | fight median (p90) | first evo (evolved) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| elias | Chain | none | Twilight | 0 | focus | 48 | **10** (5-22) | 2 | 8 / 13 / 50 / 17 | 12:13 (5:53-18:59) | 27 | 38 | 19 | 450 s (455) | 5:08 (81%) |
| elias | Wolves | none | Twilight | 0 | focus | 48 | **25** (15-39) | 8 | 4 / 10 / 52 / 0 | 11:57 (4:59-12:50) | 25 | 100 | 0 | 83 s (84) | 4:03 (90%) |
| elias | Orbit | none | Twilight | 0 | focus | 48 | **15** (7-27) | 0 | 6 / 21 / 40 / 19 | 11:20 (7:22-17:38) | 33 | 44 | 22 | 296 s (369) | 7:10 (60%) |
| elias | Ravens | none | Twilight | 0 | focus | 48 | **83** (70-91) | 0 | 4 / 8 / 4 / 0 | 8:44 (5:04-13:09) | 83 | 100 | 0 | 51 s (55) | 5:08 (88%) |
| elias | Bolts | none | Twilight | 0 | focus | 48 | **67** (53-78) | 0 | 6 / 17 / 10 / 0 | 8:45 (5:45-12:12) | 67 | 100 | 0 | 131 s (132) | 5:33 (81%) |
| wren | Chain | none | Twilight | 0 | focus | 48 | **8** (3-20) | 4 | 17 / 15 / 35 / 21 | 11:58 (5:14-20:11) | 29 | 29 | 23 | 450 s (451) | 5:45 (71%) |
| wren | Wolves | none | Twilight | 0 | focus | 48 | **15** (7-27) | 8 | 8 / 10 / 58 / 0 | 11:59 (6:03-13:14) | 15 | 100 | 0 | 85 s (86) | 4:01 (75%) |
| wren | Orbit | none | Twilight | 0 | focus | 48 | **10** (5-22) | 0 | 21 / 25 / 29 / 15 | 9:43 (6:08-15:32) | 25 | 42 | 16 | 295 s (389) | 6:32 (60%) |
| wren | Ravens | none | Twilight | 0 | focus | 48 | **83** (70-91) | 0 | 8 / 8 / 0 / 0 | 7:12 (5:21-9:55) | 83 | 100 | 0 | 52 s (54) | 4:57 (88%) |
| wren | Bolts | none | Twilight | 0 | focus | 48 | **75** (61-85) | 2 | 8 / 13 / 2 / 0 | 7:06 (5:47-9:01) | 75 | 100 | 0 | 131 s (132) | 5:15 (83%) |
| elias | Chain | none | Twilight | 0 | random | 96 | **11** (7-19) | 3 | 7 / 20 / 43 / 16 | 11:54 (6:46-19:28) | 27 | 42 | 18 | 448 s (451) | 5:01 (80%) |
| elias | Wolves | none | Twilight | 0 | random | 96 | **29** (21-39) | 4 | 3 / 3 / 60 / 0 | 12:09 (6:27-13:09) | 29 | 100 | 0 | 84 s (86) | 4:05 (90%) |
| elias | Orbit | none | Twilight | 0 | random | 96 | **22** (15-31) | 2 | 5 / 28 / 23 / 20 | 11:41 (7:12-16:24) | 42 | 53 | 25 | 292 s (353) | 7:55 (63%) |
| elias | Ravens | none | Twilight | 0 | random | 96 | **90** (82-94) | 0 | 2 / 7 / 1 / 0 | 8:57 (6:27-13:41) | 90 | 100 | 0 | 51 s (54) | 4:46 (94%) |
| elias | Bolts | none | Twilight | 0 | random | 96 | **75** (65-83) | 0 | 7 / 11 / 6 / 0 | 8:27 (5:41-11:54) | 75 | 100 | 0 | 131 s (132) | 5:25 (82%) |
| wren | Chain | none | Twilight | 0 | random | 96 | **10** (6-18) | 3 | 8 / 19 / 45 / 15 | 11:36 (6:10-19:54) | 25 | 42 | 16 | 449 s (452) | 4:54 (77%) |
| wren | Wolves | none | Twilight | 0 | random | 96 | **25** (17-35) | 5 | 2 / 5 / 63 / 0 | 12:11 (7:21-13:10) | 25 | 100 | 0 | 84 s (85) | 4:02 (91%) |
| wren | Orbit | none | Twilight | 0 | random | 96 | **8** (4-16) | 3 | 19 / 30 / 27 / 13 | 9:42 (5:47-15:57) | 21 | 40 | 14 | 296 s (310) | 7:00 (55%) |
| wren | Ravens | none | Twilight | 0 | random | 96 | **84** (76-90) | 1 | 3 / 9 / 2 / 0 | 7:50 (6:23-11:20) | 84 | 100 | 0 | 51 s (54) | 4:29 (90%) |
| wren | Bolts | none | Twilight | 0 | random | 96 | **74** (64-82) | 1 | 10 / 14 / 1 / 0 | 7:12 (5:31-8:30) | 74 | 100 | 0 | 131 s (132) | 5:31 (76%) |
| elias | Chain | none | Twilight | 25 | random | 24 | **50** (31-69) | 0 | 0 / 0 / 33 / 17 | 12:47 (10:58-20:34) | 67 | 75 | 33 | 427 s (430) | 4:45 (100%) |
| elias | Wolves | none | Twilight | 25 | random | 24 | **75** (55-88) | 0 | 4 / 4 / 17 / 0 | 11:54 (5:53-12:05) | 75 | 100 | 0 | 80 s (81) | 3:44 (96%) |
| elias | Orbit | none | Twilight | 25 | random | 24 | **58** (39-76) | 0 | 4 / 4 / 21 / 13 | 13:18 (8:59-18:31) | 71 | 82 | 30 | 280 s (328) | 6:00 (83%) |
| elias | Ravens | none | Twilight | 25 | random | 24 | **100** (86-100) | 0 | 0 / 0 / 0 / 0 | - (---) | 100 | 100 | - | 49 s (51) | 4:37 (100%) |
| elias | Bolts | none | Twilight | 25 | random | 24 | **92** (74-98) | 0 | 0 / 8 / 0 / 0 | 7:27 (7:10-7:27) | 92 | 100 | 0 | 125 s (126) | 5:08 (92%) |
| wren | Chain | none | Twilight | 25 | random | 24 | **38** (21-57) | 0 | 4 / 8 / 33 / 17 | 12:43 (7:13-20:21) | 54 | 69 | 27 | 428 s (430) | 4:16 (96%) |
| wren | Wolves | none | Twilight | 25 | random | 24 | **63** (43-79) | 0 | 13 / 4 / 21 / 0 | 11:59 (5:47-13:33) | 63 | 100 | 0 | 80 s (83) | 3:43 (88%) |
| wren | Orbit | none | Twilight | 25 | random | 24 | **42** (24-61) | 0 | 0 / 21 / 29 / 8 | 13:16 (7:04-16:04) | 50 | 83 | 14 | 283 s (349) | 6:32 (75%) |
| wren | Ravens | none | Twilight | 25 | random | 24 | **100** (86-100) | 0 | 0 / 0 / 0 / 0 | - (---) | 100 | 100 | - | 50 s (53) | 4:35 (100%) |
| wren | Bolts | none | Twilight | 25 | random | 24 | **100** (86-100) | 0 | 0 / 0 / 0 / 0 | - (---) | 100 | 100 | - | 125 s (126) | 5:35 (100%) |
| elias | Chain | none | Deep Dusk | 0 | random | 24 | **0** (0-14) | 0 | 17 / 46 / 29 / 8 | 9:13 (5:50-13:08) | 8 | 0 | 8 | - (-) | 5:32 (54%) |
| elias | Wolves | none | Deep Dusk | 0 | random | 24 | **13** (4-31) | 0 | 13 / 8 / 67 / 0 | 12:01 (5:36-12:35) | 13 | 100 | 0 | 122 s (126) | 4:26 (92%) |
| elias | Orbit | none | Deep Dusk | 0 | random | 24 | **4** (1-20) | 4 | 13 / 25 / 25 / 29 | 11:17 (5:24-19:12) | 33 | 13 | 30 | 428 s (428) | 9:33 (38%) |
| elias | Ravens | none | Deep Dusk | 0 | random | 24 | **17** (7-36) | 4 | 13 / 29 / 38 / 0 | 9:43 (5:54-12:56) | 17 | 100 | 0 | 72 s (76) | 4:51 (79%) |
| elias | Bolts | none | Deep Dusk | 0 | random | 24 | **42** (24-61) | 4 | 17 / 17 / 8 / 13 | 8:33 (5:11-16:40) | 54 | 77 | 21 | 194 s (195) | 5:11 (58%) |
| wren | Chain | none | Deep Dusk | 0 | random | 24 | **0** (0-14) | 13 | 25 / 25 / 25 / 13 | 8:56 (4:50-18:11) | 13 | 0 | 13 | - (-) | 6:08 (50%) |
| wren | Wolves | none | Deep Dusk | 0 | random | 24 | **4** (1-20) | 13 | 17 / 4 / 63 / 0 | 11:38 (4:48-12:34) | 4 | 100 | 0 | 122 s (122) | 3:56 (75%) |
| wren | Orbit | none | Deep Dusk | 0 | random | 24 | **0** (0-14) | 13 | 29 / 25 / 25 / 8 | 7:38 (4:53-13:19) | 8 | 0 | 8 | - (-) | 6:16 (38%) |
| wren | Ravens | none | Deep Dusk | 0 | random | 24 | **17** (7-36) | 0 | 25 / 42 / 17 / 0 | 8:49 (5:28-12:32) | 17 | 100 | 0 | 75 s (77) | 5:01 (75%) |
| wren | Bolts | none | Deep Dusk | 0 | random | 24 | **71** (51-85) | 8 | 13 / 8 / 0 / 0 | 5:32 (4:06-9:13) | 71 | 100 | 0 | 194 s (195) | 5:20 (75%) |
| elias | Chain | half | Twilight | 0 | random | 96 | **58** (48-68) | 0 | 0 / 4 / 35 / 2 | 12:00 (10:35-13:41) | 60 | 97 | 5 | 122 s (209) | 7:23 (86%) |
| elias | Wolves | half | Twilight | 0 | random | 96 | **65** (55-73) | 0 | 0 / 1 / 34 / 0 | 12:02 (11:03-12:58) | 65 | 100 | 0 | 85 s (149) | 6:59 (90%) |
| elias | Orbit | half | Twilight | 0 | random | 96 | **55** (45-65) | 0 | 0 / 6 / 38 / 1 | 11:53 (9:21-13:48) | 56 | 98 | 2 | 125 s (176) | 7:39 (84%) |
| elias | Ravens | half | Twilight | 0 | random | 96 | **59** (49-69) | 0 | 0 / 2 / 38 / 1 | 11:51 (10:38-13:23) | 60 | 98 | 3 | 102 s (200) | 7:49 (88%) |
| elias | Bolts | half | Twilight | 0 | random | 96 | **80** (71-87) | 0 | 0 / 3 / 16 / 1 | 11:51 (9:20-13:25) | 81 | 99 | 5 | 94 s (176) | 7:32 (92%) |
| wren | Chain | half | Twilight | 0 | random | 96 | **59** (49-69) | 0 | 0 / 4 / 36 / 0 | 11:49 (9:47-13:10) | 59 | 100 | 0 | 101 s (173) | 6:55 (86%) |
| wren | Wolves | half | Twilight | 0 | random | 96 | **58** (48-68) | 0 | 0 / 6 / 35 / 0 | 11:57 (9:47-13:14) | 58 | 100 | 0 | 87 s (133) | 6:55 (89%) |
| wren | Orbit | half | Twilight | 0 | random | 96 | **53** (43-63) | 0 | 0 / 9 / 34 / 3 | 11:19 (8:21-13:02) | 56 | 94 | 7 | 125 s (185) | 7:00 (78%) |
| wren | Ravens | half | Twilight | 0 | random | 96 | **57** (47-67) | 0 | 0 / 4 / 39 / 0 | 11:48 (10:09-12:52) | 57 | 100 | 0 | 97 s (194) | 7:57 (89%) |
| wren | Bolts | half | Twilight | 0 | random | 96 | **79** (70-86) | 0 | 0 / 1 / 20 / 0 | 11:46 (10:35-13:32) | 79 | 100 | 0 | 95 s (147) | 7:17 (93%) |
| elias | Chain | half | Deep Dusk | 0 | random | 24 | **38** (21-57) | 0 | 0 / 17 / 42 / 4 | 11:53 (8:18-13:20) | 42 | 90 | 7 | 141 s (314) | 6:23 (71%) |
| elias | Wolves | half | Deep Dusk | 0 | random | 24 | **33** (18-53) | 0 | 0 / 17 / 50 / 0 | 11:49 (9:33-13:41) | 33 | 100 | 0 | 123 s (157) | 7:33 (75%) |
| elias | Orbit | half | Deep Dusk | 0 | random | 24 | **33** (18-53) | 0 | 0 / 13 / 50 / 4 | 11:43 (8:50-13:13) | 38 | 89 | 6 | 158 s (254) | 8:37 (79%) |
| elias | Ravens | half | Deep Dusk | 0 | random | 24 | **29** (15-49) | 0 | 0 / 17 / 54 / 0 | 11:21 (8:05-13:21) | 29 | 100 | 0 | 143 s (313) | 6:15 (71%) |
| elias | Bolts | half | Deep Dusk | 0 | random | 24 | **54** (35-72) | 0 | 0 / 0 / 42 / 4 | 11:48 (10:50-13:48) | 58 | 93 | 9 | 135 s (218) | 7:49 (79%) |
| wren | Chain | half | Deep Dusk | 0 | random | 24 | **38** (21-57) | 0 | 0 / 25 / 33 / 4 | 10:30 (7:40-13:51) | 42 | 90 | 7 | 144 s (240) | 6:53 (75%) |
| wren | Wolves | half | Deep Dusk | 0 | random | 24 | **42** (24-61) | 0 | 0 / 4 / 54 / 0 | 11:59 (10:05-13:14) | 42 | 100 | 0 | 116 s (131) | 7:37 (79%) |
| wren | Orbit | half | Deep Dusk | 0 | random | 24 | **21** (9-40) | 0 | 0 / 21 / 58 / 0 | 11:27 (7:45-13:22) | 21 | 100 | 0 | 141 s (257) | 7:24 (75%) |
| wren | Ravens | half | Deep Dusk | 0 | random | 24 | **38** (21-57) | 0 | 0 / 21 / 42 / 0 | 11:35 (7:34-12:56) | 38 | 100 | 0 | 149 s (230) | 6:49 (79%) |
| wren | Bolts | half | Deep Dusk | 0 | random | 24 | **54** (35-72) | 0 | 4 / 4 / 38 / 0 | 11:58 (9:38-13:02) | 54 | 100 | 0 | 121 s (183) | 6:29 (92%) |
| elias | Chain | half | Long Night | 0 | random | 24 | **4** (1-20) | 0 | 13 / 71 / 13 / 0 | 8:28 (6:47-10:08) | 4 | 100 | 0 | 139 s (139) | 8:42 (33%) |
| elias | Wolves | half | Long Night | 0 | random | 24 | **4** (1-20) | 0 | 4 / 79 / 13 / 0 | 8:23 (7:21-10:36) | 4 | 100 | 0 | 159 s (159) | 5:46 (29%) |
| elias | Orbit | half | Long Night | 0 | random | 24 | **0** (0-14) | 0 | 21 / 29 / 33 / 17 | 10:05 (6:00-21:08) | 17 | 0 | 17 | - (-) | 12:02 (17%) |
| elias | Ravens | half | Long Night | 0 | random | 24 | **0** (0-14) | 0 | 8 / 58 / 33 / 0 | 9:07 (7:04-12:11) | 0 | - | 0 | - (-) | 6:30 (21%) |
| elias | Bolts | half | Long Night | 0 | random | 24 | **8** (2-26) | 4 | 13 / 50 / 21 / 4 | 8:52 (6:31-11:39) | 13 | 67 | 5 | 137 s (137) | 7:03 (50%) |
| wren | Chain | half | Long Night | 0 | random | 24 | **0** (0-14) | 4 | 21 / 67 / 8 / 0 | 8:05 (5:46-9:47) | 0 | - | 0 | - (-) | 6:57 (13%) |
| wren | Wolves | half | Long Night | 0 | random | 24 | **0** (0-14) | 8 | 21 / 58 / 13 / 0 | 7:52 (5:18-11:31) | 0 | - | 0 | - (-) | 6:45 (29%) |
| wren | Orbit | half | Long Night | 0 | random | 24 | **0** (0-14) | 4 | 33 / 38 / 25 / 0 | 7:34 (5:15-11:43) | 0 | - | 0 | - (-) | - (0%) |
| wren | Ravens | half | Long Night | 0 | random | 24 | **0** (0-14) | 0 | 17 / 58 / 25 / 0 | 8:05 (6:40-12:47) | 0 | - | 0 | - (-) | 6:43 (21%) |
| wren | Bolts | half | Long Night | 0 | random | 24 | **8** (2-26) | 0 | 17 / 63 / 13 / 0 | 8:19 (6:51-10:02) | 8 | 100 | 0 | 149 s (149) | 4:39 (38%) |
| elias | Chain | full | Twilight | 0 | random | 24 | **88** (69-96) | 0 | 0 / 4 / 8 / 0 | 11:58 (9:41-12:09) | 88 | 100 | 0 | 93 s (194) | 6:18 (100%) |
| elias | Wolves | full | Twilight | 0 | random | 24 | **67** (47-82) | 0 | 0 / 4 / 29 / 0 | 12:24 (9:06-13:45) | 67 | 100 | 0 | 76 s (109) | 7:05 (96%) |
| elias | Orbit | full | Twilight | 0 | random | 24 | **71** (51-85) | 0 | 0 / 0 / 29 / 0 | 12:15 (10:27-13:52) | 71 | 100 | 0 | 131 s (281) | 6:13 (92%) |
| elias | Ravens | full | Twilight | 0 | random | 24 | **75** (55-88) | 0 | 0 / 4 / 21 / 0 | 12:22 (8:23-12:57) | 75 | 100 | 0 | 92 s (137) | 5:59 (92%) |
| elias | Bolts | full | Twilight | 0 | random | 24 | **83** (64-93) | 0 | 0 / 0 / 17 / 0 | 12:45 (11:56-13:26) | 83 | 100 | 0 | 94 s (224) | 6:13 (96%) |
| wren | Chain | full | Twilight | 0 | random | 24 | **88** (69-96) | 0 | 0 / 4 / 8 / 0 | 11:42 (7:22-11:50) | 88 | 100 | 0 | 112 s (190) | 7:33 (92%) |
| wren | Wolves | full | Twilight | 0 | random | 24 | **58** (39-76) | 0 | 0 / 0 / 42 / 0 | 12:23 (11:47-13:42) | 58 | 100 | 0 | 76 s (98) | 5:39 (96%) |
| wren | Orbit | full | Twilight | 0 | random | 24 | **54** (35-72) | 0 | 0 / 0 / 46 / 0 | 11:56 (11:30-13:29) | 54 | 100 | 0 | 96 s (177) | 5:57 (92%) |
| wren | Ravens | full | Twilight | 0 | random | 24 | **67** (47-82) | 0 | 0 / 0 / 33 / 0 | 11:56 (10:58-13:49) | 67 | 100 | 0 | 87 s (153) | 6:18 (100%) |
| wren | Bolts | full | Twilight | 0 | random | 24 | **88** (69-96) | 0 | 0 / 0 / 13 / 0 | 11:51 (11:41-12:27) | 88 | 100 | 0 | 92 s (149) | 6:46 (100%) |
| elias | Chain | full | Twilight | 25 | random | 96 | **100** (96-100) | 0 | 0 / 0 / 0 / 0 | - (---) | 100 | 100 | - | 97 s (173) | 6:54 (98%) |
| elias | Wolves | full | Twilight | 25 | random | 96 | **94** (87-97) | 0 | 0 / 0 / 6 / 0 | 11:56 (11:21-13:54) | 94 | 100 | 0 | 78 s (136) | 6:50 (100%) |
| elias | Orbit | full | Twilight | 25 | random | 96 | **95** (88-98) | 0 | 0 / 1 / 4 / 0 | 12:18 (9:22-13:00) | 95 | 100 | 0 | 104 s (179) | 6:17 (100%) |
| elias | Ravens | full | Twilight | 25 | random | 96 | **96** (90-98) | 0 | 0 / 0 / 4 / 0 | 13:24 (12:14-13:29) | 96 | 100 | 0 | 100 s (146) | 6:23 (100%) |
| elias | Bolts | full | Twilight | 25 | random | 96 | **100** (96-100) | 0 | 0 / 0 / 0 / 0 | - (---) | 100 | 100 | - | 90 s (137) | 6:14 (100%) |
| wren | Chain | full | Twilight | 25 | random | 96 | **94** (87-97) | 0 | 0 / 0 / 6 / 0 | 13:15 (12:00-13:34) | 94 | 100 | 0 | 107 s (179) | 6:18 (97%) |
| wren | Wolves | full | Twilight | 25 | random | 96 | **93** (86-96) | 0 | 0 / 0 / 7 / 0 | 12:37 (11:40-13:40) | 93 | 100 | 0 | 76 s (116) | 6:32 (98%) |
| wren | Orbit | full | Twilight | 25 | random | 96 | **96** (90-98) | 0 | 0 / 0 / 3 / 1 | 13:44 (12:32-14:54) | 97 | 99 | 25 | 112 s (175) | 6:19 (99%) |
| wren | Ravens | full | Twilight | 25 | random | 96 | **98** (93-99) | 0 | 0 / 0 / 2 / 0 | 11:55 (11:34-11:55) | 98 | 100 | 0 | 86 s (164) | 6:18 (100%) |
| wren | Bolts | full | Twilight | 25 | random | 96 | **99** (94-100) | 0 | 0 / 1 / 0 / 0 | 9:17 (9:17-9:17) | 99 | 100 | 0 | 89 s (160) | 6:24 (99%) |
| elias | Chain | full | Deep Dusk | 0 | random | 24 | **54** (35-72) | 0 | 0 / 8 / 38 / 0 | 12:04 (9:50-13:35) | 54 | 100 | 0 | 155 s (260) | 6:55 (92%) |
| elias | Wolves | full | Deep Dusk | 0 | random | 24 | **54** (35-72) | 0 | 0 / 0 / 42 / 4 | 11:51 (11:23-12:46) | 58 | 93 | 9 | 134 s (180) | 7:23 (88%) |
| elias | Orbit | full | Deep Dusk | 0 | random | 24 | **46** (28-65) | 0 | 0 / 4 / 50 / 0 | 11:56 (11:15-13:26) | 46 | 100 | 0 | 174 s (289) | 6:47 (96%) |
| elias | Ravens | full | Deep Dusk | 0 | random | 24 | **58** (39-76) | 0 | 0 / 13 / 29 / 0 | 11:22 (9:27-13:49) | 58 | 100 | 0 | 127 s (212) | 6:21 (96%) |
| elias | Bolts | full | Deep Dusk | 0 | random | 24 | **79** (60-91) | 0 | 0 / 4 / 17 / 0 | 11:44 (9:20-12:01) | 79 | 100 | 0 | 127 s (246) | 7:01 (92%) |
| wren | Chain | full | Deep Dusk | 0 | random | 24 | **63** (43-79) | 0 | 0 / 4 / 33 / 0 | 11:44 (7:57-12:10) | 63 | 100 | 0 | 162 s (221) | 5:16 (88%) |
| wren | Wolves | full | Deep Dusk | 0 | random | 24 | **33** (18-53) | 0 | 0 / 8 / 58 / 0 | 11:55 (8:49-12:33) | 33 | 100 | 0 | 142 s (182) | 7:46 (83%) |
| wren | Orbit | full | Deep Dusk | 0 | random | 24 | **25** (12-45) | 0 | 0 / 17 / 50 / 8 | 11:56 (9:21-17:49) | 33 | 75 | 11 | 194 s (212) | 6:12 (88%) |
| wren | Ravens | full | Deep Dusk | 0 | random | 24 | **46** (28-65) | 0 | 0 / 0 / 50 / 4 | 11:49 (11:33-13:59) | 50 | 92 | 8 | 147 s (223) | 6:14 (96%) |
| wren | Bolts | full | Deep Dusk | 0 | random | 24 | **63** (43-79) | 0 | 0 / 0 / 38 / 0 | 11:55 (11:36-12:30) | 63 | 100 | 0 | 135 s (190) | 7:16 (96%) |
| elias | Chain | full | Deep Dusk | 25 | random | 24 | **88** (69-96) | 0 | 0 / 4 / 8 / 0 | 10:09 (8:30-12:52) | 88 | 100 | 0 | 139 s (196) | 5:59 (96%) |
| elias | Wolves | full | Deep Dusk | 25 | random | 24 | **96** (80-99) | 0 | 0 / 0 / 4 / 0 | 11:50 (11:50-11:50) | 96 | 100 | 0 | 132 s (214) | 7:14 (100%) |
| elias | Orbit | full | Deep Dusk | 25 | random | 24 | **88** (69-96) | 0 | 0 / 0 / 13 / 0 | 11:56 (11:54-12:28) | 88 | 100 | 0 | 153 s (224) | 6:16 (100%) |
| elias | Ravens | full | Deep Dusk | 25 | random | 24 | **67** (47-82) | 0 | 0 / 0 / 29 / 4 | 12:07 (11:41-16:22) | 71 | 94 | 13 | 139 s (301) | 6:35 (92%) |
| elias | Bolts | full | Deep Dusk | 25 | random | 24 | **88** (69-96) | 0 | 0 / 0 / 13 / 0 | 12:06 (11:50-12:51) | 88 | 100 | 0 | 127 s (224) | 6:33 (100%) |
| wren | Chain | full | Deep Dusk | 25 | random | 24 | **100** (86-100) | 0 | 0 / 0 / 0 / 0 | - (---) | 100 | 100 | - | 147 s (245) | 6:31 (100%) |
| wren | Wolves | full | Deep Dusk | 25 | random | 24 | **88** (69-96) | 0 | 0 / 4 / 8 / 0 | 12:51 (7:24-13:53) | 88 | 100 | 0 | 122 s (162) | 5:46 (92%) |
| wren | Orbit | full | Deep Dusk | 25 | random | 24 | **88** (69-96) | 0 | 0 / 0 / 13 / 0 | 12:05 (11:40-12:15) | 88 | 100 | 0 | 172 s (221) | 6:00 (100%) |
| wren | Ravens | full | Deep Dusk | 25 | random | 24 | **83** (64-93) | 0 | 0 / 0 / 17 / 0 | 11:44 (11:27-12:06) | 83 | 100 | 0 | 111 s (205) | 7:19 (96%) |
| wren | Bolts | full | Deep Dusk | 25 | random | 24 | **96** (80-99) | 0 | 0 / 0 / 4 / 0 | 10:46 (10:46-10:46) | 96 | 100 | 0 | 136 s (194) | 6:56 (100%) |
| elias | Chain | full | Long Night | 0 | random | 24 | **4** (1-20) | 0 | 4 / 46 / 33 / 13 | 9:58 (7:24-16:47) | 17 | 25 | 13 | 579 s (579) | 6:19 (50%) |
| elias | Wolves | full | Long Night | 0 | random | 24 | **0** (0-14) | 0 | 13 / 63 / 21 / 4 | 8:45 (6:24-12:08) | 4 | 0 | 4 | - (-) | 5:32 (50%) |
| elias | Orbit | full | Long Night | 0 | random | 24 | **8** (2-26) | 0 | 0 / 58 / 33 / 0 | 9:22 (8:16-11:22) | 8 | 100 | 0 | 539 s (539) | 6:39 (54%) |
| elias | Ravens | full | Long Night | 0 | random | 24 | **4** (1-20) | 0 | 4 / 67 / 17 / 8 | 8:16 (7:25-13:31) | 13 | 33 | 9 | 123 s (123) | 7:41 (42%) |
| elias | Bolts | full | Long Night | 0 | random | 24 | **0** (0-14) | 0 | 4 / 42 / 54 / 0 | 10:17 (7:56-12:21) | 0 | - | 0 | - (-) | 6:21 (67%) |
| wren | Chain | full | Long Night | 0 | random | 24 | **4** (1-20) | 0 | 17 / 50 / 25 / 4 | 9:08 (6:55-13:06) | 8 | 50 | 4 | 133 s (133) | 8:24 (38%) |
| wren | Wolves | full | Long Night | 0 | random | 24 | **4** (1-20) | 0 | 13 / 67 / 13 / 4 | 8:44 (6:38-11:20) | 8 | 50 | 4 | 98 s (98) | 5:49 (46%) |
| wren | Orbit | full | Long Night | 0 | random | 24 | **0** (0-14) | 0 | 17 / 54 / 25 / 4 | 8:56 (6:51-12:18) | 4 | 0 | 4 | - (-) | 7:00 (54%) |
| wren | Ravens | full | Long Night | 0 | random | 24 | **0** (0-14) | 0 | 8 / 54 / 33 / 4 | 9:05 (7:07-13:01) | 4 | 0 | 4 | - (-) | 5:47 (54%) |
| wren | Bolts | full | Long Night | 0 | random | 24 | **0** (0-14) | 0 | 0 / 67 / 29 / 4 | 9:01 (7:20-12:04) | 4 | 0 | 4 | - (-) | 5:25 (58%) |
| elias | Chain | full | Long Night | 25 | random | 96 | **40** (30-50) | 0 | 0 / 21 / 35 / 4 | 10:47 (8:44-13:37) | 44 | 90 | 7 | 228 s (369) | 6:50 (75%) |
| elias | Wolves | full | Long Night | 25 | random | 96 | **35** (27-45) | 0 | 0 / 24 / 39 / 2 | 11:32 (8:31-13:06) | 38 | 94 | 3 | 197 s (314) | 6:22 (72%) |
| elias | Orbit | full | Long Night | 25 | random | 96 | **22** (15-31) | 0 | 1 / 24 / 40 / 14 | 12:14 (8:25-19:19) | 35 | 62 | 17 | 248 s (488) | 7:26 (68%) |
| elias | Ravens | full | Long Night | 25 | random | 96 | **49** (39-59) | 0 | 0 / 17 / 31 / 3 | 11:41 (8:19-13:33) | 52 | 94 | 6 | 172 s (344) | 7:12 (78%) |
| elias | Bolts | full | Long Night | 25 | random | 96 | **35** (27-45) | 0 | 0 / 16 / 41 / 8 | 11:43 (8:31-15:50) | 44 | 81 | 13 | 157 s (280) | 7:01 (79%) |
| wren | Chain | full | Long Night | 25 | random | 96 | **22** (15-31) | 0 | 2 / 33 / 32 / 10 | 10:24 (8:01-17:57) | 32 | 68 | 13 | 230 s (390) | 6:50 (66%) |
| wren | Wolves | full | Long Night | 25 | random | 96 | **13** (7-21) | 0 | 1 / 34 / 50 / 2 | 10:43 (8:11-13:19) | 15 | 86 | 2 | 215 s (329) | 5:53 (65%) |
| wren | Orbit | full | Long Night | 25 | random | 96 | **15** (9-23) | 0 | 4 / 42 / 33 / 6 | 9:48 (7:40-13:32) | 21 | 70 | 7 | 286 s (555) | 6:32 (66%) |
| wren | Ravens | full | Long Night | 25 | random | 96 | **32** (24-42) | 0 | 0 / 20 / 40 / 8 | 11:32 (8:35-18:15) | 41 | 79 | 12 | 156 s (316) | 7:33 (76%) |
| wren | Bolts | full | Long Night | 25 | random | 96 | **30** (22-40) | 0 | 1 / 21 / 42 / 6 | 11:30 (8:16-13:57) | 36 | 83 | 9 | 157 s (326) | 7:05 (78%) |
