# 07 Balance log

Tools: `node scripts/sweep-all.mjs [seeds]` (parallel, both chars x both bots, adds boss time-to-kill and deaths by window; `SEED_FROM=n` shifts seeds), `node scripts/sweep.mjs <char> <n>` (`FOCUS=1`, `VERBOSE=1`), `node scripts/evo-dps.mjs` (evolution DPS probe).

Noise warning: the sim is chaotic (one extra RNG draw reshuffles every run). Two disjoint 48-seed sets of the same config differed by up to 20 points. Early rows (12/24 seeds) are indicative only; decisions after row 7 used 48-96 seeds. W = win% as wren-random / wren-focus / elias-random / elias-focus.

| # | Change | Win% W (wren r/f, elias r/f) | Level med (w r/f, e r/f) | First evo med (w r/f) | Evos (focus) | Deaths |
|---|---|---|---|---|---|---|
| 0 | Baseline (12 seeds) | 42/58, 58/33 | 37/47, 45/40 | 9:41 / 7:07 | 2 | wren-random 2:59, 5:17; focus 4:57, 5:00 |
| 1 | maxEnemies 380->240, evoNudge 4/3, pity heart 30 / magnet 45, wolf+crow rate0 0.5, events 60:6 wolves, 150:14 crows, new 300:26 crows and 600:28 wolves (24 seeds) | 17/38, 33/50 | 29/28, 38/41 | 6:17 / 6:17 | 1-2 | 2 focus <5:00 |
| 2 | Wren hp 70, wolf power 8, wolf curve 0.7, crow/wolf rate1 up, hpScale quad .014 | 29/58, 17/25 | 36/46, 28/26 | 7:49 / 6:01 | 2 / 1 | Elias collapsed (fewer enemies = less XP), reverted the curve and rate1 changes |
| 3 | Revert curve/rate1/hp quad (keep Wren buffs) | 42/50, 50/54 | 37/36, 46/46 | 6:46 / 6:19 | 2 | none < 5:00 |
| 4 | Part B evolution retune + dive bombers fix (see 08) | 46/50, 50/63 | 37/39, 44/47 | 6:46 / 6:19 | 2 | none < 5:00 |
| 5 | hpScale .30/.015, dmgScale .05 | 46/54, 29/54 | 38/47, 33/46 | 7:50 / 5:43 | 2 | 1 each <5:00 |
| 6 | hpScale quad .02, dmgScale .06, events 240:10 wolves, 300:22 crows | 21/50, 25/38 | 30/39, 29/37 | 8:11 / 5:18 | 2 / 1 | none < 5:00 |
| 7 | xp 5/1.8/.03 (48 seeds) | 52/63, 25/27 | 48/49, 32/36 | 6:58 / 5:07 | 2 | Wren snowballs on faster levels, Elias does not; reverted |
| 8 | xp 6/1.9/.03, Elias hp 100 (48) | 29/56, 23/31 | 36/47, 30/30 | 7:56 / 5:26 | 2 / 1 | 2 focus <5:00 |
| 9 | Holy Orbit base power 10, radius 38, spin 2.2 (48) | 35/52, 31/38 | 38/47, 37/32 | 7:16 / 5:40 | 2 / 1 | early deaths 3:52, 4:21 |
| 10 | Forced heart after 75 s dry spell (hp < 80%), wolf/crow rate0 0.4, crows from 20 s (48) | 27/50, 25/33 | 38/47, 33/32 | 6:32 / 5:13 | 2 / 1 | 1 <5:00 |
| 11 | Elias holyDamage 1.15, orb power +4/rank (48) | 23/48, 29/52 | 38/47, 35/47 | 6:18 / 5:33 | 2 | 1 <5:00 |
| 12 | Boss 3000 hp, dmg 13 (TTK was 28-44 s, now 40-50 s), 600 swarm 20, 150 swarm 12, 240 swarm 8 | 38/50, 33/40 | 38/42, 34/36 | 7:40 / 5:33 | 2 | 3 wren-focus 4:01-4:32 |
| 13 | Wolves start with 2 (power 7), Wren hp 60, Elias hp 110 (48) | 25/69, 33/42 | | | | no wren <5:00 except focus count-0 builds |
| 14 | hpScale .34/.021, dmgScale .07 (96 seeds, final) | 21/46, 31/41 | 37/44, 36/37 | 7:08 / 5:06 | 1 / 2 | 3 of 384 runs < 5:00 |

Final config check (96 seeds each, `node scripts/sweep-all.mjs 96`):

```
bot           win%  lvl  L@5m  firstEvo(p10/p90)  evolved  evos  hearts mag  [<5:00 | boss 10-11 | >=11]  bossTTK
elias/focus    41%   37   19   5:34 (3:52/8:41)   65/96     1     8.4  5.6  [0 | 9 | 13]   0:49
elias/random   31%   36   21   6:58 (4:49/10:13)  54/96     1     9.1  5.4  [0 | 13 | 22]  0:42
wren/focus     46%   44   21   5:06 (3:36/7:37)   79/96     2    10.4  8.3  [2 | 19 | 11]  0:40
wren/random    21%   37   21   7:08 (4:13/9:41)   58/96     1    10.4  6.4  [1 | 19 | 22]  0:45
```

Other changes: pickups (heart ~1 per 85-110 s incl. forced pity, magnet ~1 per 140-160 s; magnet still slightly rarer than the 90-120 s target because it needs >12 gems on the floor), maxEnemies 240 (swarm events and boss adds ignore the cap, so peak is ~280; perf is equal or better than before), `Sim.rollDrops` gained `drops.pityHeartForce`. Evolution numbers moved to `evolutions.json` `tune` blocks (see 08).

## Not hit / needs Matt
- Elias random 31% vs 15-25 target and Elias focus 41% vs 45-60: Elias's orbit weapon suffers from the bot's flee-from-enemies movement, so the focus/random gap is small for him. A real player standing in the horde would do better. Not worth bending the numbers further for the bot.
- Level-ups: focused 37-44 (in range 38-48), random 36-37 (dying runs end early; winning runs reach 47-48).
- Evolutions per run: random median 1 (target 1-2, OK), focus Elias 1 (target 2-3). Lowering the 10-rank evolution requirement would fix it but is a locked-design change, so not done.
- First evolution p10 3:36-4:49 is slightly earlier than the 4:00 target for Wren focus; median 5:06 vs 5:30.

## P1 finish (Spirit Bolts trim, magnet frequency)

- Spirit Bolts power perRank 5 -> 4 (base unchanged). `evo-dps.mjs` maxed bolts: single 126->108, stream10 516->442, stream40 1032->885 (-14%). Evolution ratios unchanged (they scale off base): Tempest 1.62/1.97/2.41x, Lance 2.00/0.91/1.28x, so no `tune` changes. Lance stream ratios were already below 1.8x before the trim (unchanged, flagged for P6).
- Magnet: new `drops.magnetGems` 6 (was hardcoded >12 gems), `pityMagnet` 45 -> 30. Sim.js reads `b.magnetGems ?? 12`.
- Sweep (96 seeds, magnet/run at 15 min): gems 6 + pity 45: 5.4-9.1 (elias ~6, wren ~7-9); gems 6 + pity 30: 7.3-9.8.

```
final (gems 6, pity 30, seeds 0-95)  win%  mag
elias/focus 43%  7.3   elias/random 36%  7.8
wren/focus  43%  9.8   wren/random  17%  7.7
```
Same set, pity 45: wren r/f 18/40, elias r/f 26/46; seeds 96-191: wren 21/45, elias 23/39. Noise is +-7 points. Wren random in 15-25, wren focus 40-46 (marginally under 45 on average, within noise), Elias random 23-36 (above target, known bot-flee issue), Elias focus 39-46.
Tests: 35 pass, none needed changing.
