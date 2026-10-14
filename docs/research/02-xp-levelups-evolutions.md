# 02 XP, level-up cadence, evolutions

## Verified

| Game | Finding | Label | Source |
|---|---|---|---|
| HoloCure | Start lvl 1, 79 EXP for lvl 2. Formula quoted: next req = round((4*(L+1))^2.1) - round((4*L)^2.1) (render garbled, doesn't give 79 at L1; polynomial ~L^1.1 per-level growth) | OFFICIAL wiki (needs recheck) | https://holocure.wiki.gg/wiki/Stage_1 (search snippet) |
| Vampire Survivors | XP gems: blue up to 2 XP, green up to 9, red beyond. ~400-500 gems on map cap; extras merge into a red gem | OFFICIAL wiki | https://vampire-survivors.fandom.com/wiki/Experience_Gem |
| Vampire Survivors | Level req claims: 8n^2 (itch user) vs "linear" (Steam user). CONFLICTING, unverified. Widely recalled: lvl2 =5 XP, then +10/level to lvl 20, +13 to 40, +16 after (linear, with jumps) | COMMUNITY / RECALLED | https://itch.io/post/10422513 |
| Vampire Survivors | Pacing is limited by kill rate, not pickup speed | COMMUNITY | Steam discussion 3717188244455231479 |
| VS evolution | Weapon at max level (usually 8) + matching passive (any level) + open a chest after a boss kill. Silver chest holds the evolution | OFFICIAL guides | https://primagames.com/gaming/vampire-survivors-weapon-evolution-guide |
| VS evolution timing | First boss chest ~ minute 10 of a 30 min run (RECALLED), i.e. first evolution typically at ~1/3 of run; "from ~10 min you'll likely get it" | COMMUNITY | primagames guide |
| Spirit Hunters | 15 min runs; each skill max level 25; 4 main abilities + up to 5 pets; mods unlock after a skill level; complaint: upgrades +1% unimpactful; balance/difficulty-spike complaints | COMMUNITY (reviews) | https://seasonedgaming.com/2023/07/21/review-spirit-hunters-infinite-horde-unending-spirit/ |
| 20MTD | Elite/boss chest gives character-specific upgrade + 36 XP | OFFICIAL wiki | https://20-minutes-till-dawn.fandom.com/wiki/Enemies |
| 20MTD | Enemy kills give ~1 XP each for small enemies | OFFICIAL wiki | same |
| Brotato | No XP levels in-run: level-up per wave end; ~20 level-ups for 20 waves (1 per 20-60 s equivalent) (RECALLED) | RECALLED | wiki |

## Level-up frequency (RECALLED + OPINION; no verified table)
| Game | Run | Typical levels | Sec/level (approx) |
|---|---|---|---|
| Vampire Survivors | 30 min | ~50-80 (lvl 60+ common with bonus) | ~25-35 avg; first levels 5-10 s apart |
| HoloCure | ~20 min | ~40-70 | ~20-30 |
| 20MTD | 20 min | ~30-45 | ~30-40 |
| Spirit Hunters | 15 min | ~30-45 (RECALLED) | ~20-30 |
| Brotato | 20 waves | 20 (1/wave) | ~60 |
Best summary: early game <=10 s per level for first 5 levels, ~15-20 s mid, 25-35 s late. Level-up dopamine budget: a choice every ~20 s keeps engagement; >40 s feels slow.

## Evolution design
| Point | Detail | Label |
|---|---|---|
| Gate | VS: max weapon + passive + boss chest; evolution arrives as a RARE REWARD event, not a card. First one at ~30% of run | OFFICIAL/COMMUNITY |
| Power | Evolutions in VS are roughly 1.5-3x base weapon DPS plus wider area/pierce; some (Holy Wand) are mostly stat bumps, others (Bloody Tear lifesteal, Thousand Edge) change feel. Best-loved evolutions CHANGE BEHAVIOUR | RECALLED/OPINION |
| Unfocused vs focused | VS lets you evolve 2-4 weapons by min 20; evolving all 6 is "win"; so evolution count, not size, drives power | OPINION |
| Power creep sources | Stat stacking (area, cooldown, amount) multiplicative with evolution; evolution on top of maxed stats = x3-x6 effective | OPINION |

## Recommended for Cursed Forest
| Parameter | Current | Recommended |
|---|---|---|
| Levels per 15 min | unknown (check bot) | 38-45 total (stat ranks capacity: 4 slots x ~21 picks = 84, so NO full build) |
| Level cadence | | L1 at ~8 s; L5 by 0:50; L10 by 2:15; L20 by 5:30; L30 by 9:30; L40 by 14:00 (~15 s -> 25 s avg) |
| Picks to first evolution | 10 stat ranks of a pair + weapon | 11-13 specific picks -> with 3 random cards and bump x2.2, expect 18-22 levels => ~5:30 (focused) / ~7:00 (typical) |
| First evolution time | median 4:00 | median 5:30; p10 4:00; p90 8:30 |
| Evolutions per run | up to 4 | typical 1-2 by 10:00, 2-3 by 15:00 for focused |
| Evolution power vs maxed base | ? | 1.8-2.3x effective DPS AND >=1 behaviour change; never >3x |
