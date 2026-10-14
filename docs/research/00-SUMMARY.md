# 00 Summary and target numbers

Honesty note: web search surfaced few primary datamines (VS XP table, HoloCure HP, Survivor.io, DMD, Spirit Hunters scaling all NOT found). Verified: Brotato (wiki), 20MTD (wiki), HoloCure XP formula (needs recheck), VS evolution rules, Soulstone/Spirit Hunters/DMD from player reviews. Targets below are OPINION informed by those; tune with the bot.

## Findings in one table
| Topic | Finding | Label |
|---|---|---|
| HP scaling | Linear per wave/time, speed unscaled (Brotato, 20MTD) | OFFICIAL |
| Density | Spawn "sessions" with max alive + interval; tiers change batch size not cap | OFFICIAL |
| Tiers | Flat +12/26/40% HP and dmg, not stacked, plus new mechanics | OFFICIAL |
| Evolution | max weapon + passive + boss chest; ~1/3 into run | OFFICIAL/COMMUNITY |
| Meta | Small % nodes feel useless; risk-for-reward tiers sustain | COMMUNITY |

## Recommended targets for Cursed Forest
| Parameter | Target |
|---|---|
| Total level-ups per 15 min | 38-45 |
| Level cadence | L5 @0:50, L10 @2:15, L20 @5:30, L30 @9:30, L40 @14:00 (15 s early -> 25 s late) |
| First evolution (median) | 5:30 (p10 4:00, p90 8:30); focused 5:00, random 7:00 |
| Evolutions by 15:00 | focused 2-3, random 1-2 |
| Evolution power | 1.8-2.3x maxed base DPS + at least one behaviour change; hard cap 3x. Evolutions must not scale off the stats already maxed for the unlock |
| Bot win rate | random-pick 15-25%, focused 45-60%, god-mode N/A; human target 60-75% at tier 0 |
| Death-time shape | deaths spread 6-14 min; <40% of deaths at the boss |
| Enemy HP | linear: HP = base x (1 + 0.26*m + 0.012*m^2?) keep current; add elite/enrage mechanics instead of more HP; add tier table +15/30/45% |
| Enemy speed | unscaled |
| Alive cap | ~200 enemies; gems merge at 300 |
| Swarm events | every 75-90 s from 1:00: add 300 s and 600 s; 2 ring encircles |
| Hearts | 25-30% max HP, ~1 per 75-100 s, pity 2.5 min, rarer per tier |
| Magnet | ~1 per 90-120 s + boss |
| Boss (10:00) | 45-60 s time-to-kill for a typical build |
| Meta | noticeable nodes (5-10%+ or new verb); whole tree <= +40% power; difficulty tiers 1-5 with +15-25% reward each |

## Next steps
1. Run bot with current settings, measure level times and evolution share of damage.
2. Review the 11 evolutions per 02/03 (one new verb each, <=2.3x).
3. Retune xp curve to hit cadence; delay first evolution to 5:30 (e.g. 5-rank pair needs 10 picks; reduce bump weights ~x1.6).
4. Re-sweep bot to hit win-rate targets.
5. To fill gaps, check VS/HoloCure datamine repos on GitHub.

Files: 01-scaling-waves.md, 02-xp-levelups-evolutions.md, 03-summons-pickups-meta.md, 04-pitfalls.md
