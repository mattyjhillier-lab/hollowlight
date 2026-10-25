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
