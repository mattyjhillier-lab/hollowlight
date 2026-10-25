# Final retune plan (PLAN phase, 2026-10-25)

Status: measuring. Nothing in src/ changed; only scripts/bot.mjs (bot kit fix), scripts/rt-matrix.mjs, scripts/rt-summary.mjs.
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
