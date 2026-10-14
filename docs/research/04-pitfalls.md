# 04 Balance pitfalls

Mostly COMMUNITY/OPINION. No survivors-specific postmortem found in search; items below are corroborated by player complaints where cited.

| Pitfall | Evidence | Fix for Cursed Forest |
|---|---|---|
| Evolutions multiplicative on top of maxed stats => x3-x6 power spike | OPINION (genre); Matt feedback: Stampede "far too strong" | Cap evolution at ~2x base DPS; evolution should REPLACE a stat bonus with a behaviour; re-balance after stats (stat pair already maxed, so evolution should not scale with the same stats again) |
| First evolution too early flattens the run | Matt data: bot 4:00 | Target median 5:30 |
| Bot/skilled players win nearly always | Bot wins ~all | Target bot win focused ~50%, unfocused ~20% (humans beat a naive bot, so keep bot win < human win) |
| Meta bonuses irrelevant late / too small ("+1%") | Soulstone and Spirit Hunters complaints (see 03) | Fewer, bigger nodes |
| AOE carpet clutter, build diversity loss at high curse | Soulstone Steam/review | Cap overlapping ground AOEs; ICD on zones; per-weapon screen-clutter budget |
| Healing too generous or absent | Soulstone uses limited healing as curse | Hearts rate-tune per tier; keep pity timer |
| Difficulty tiers stacking multiplicatively | Brotato explicitly NOT stacked; devs nerfed curse scaling 2.5 -> 2 | Use lookup table per tier, not compounding |
| Enemy count unbounded => perf and unreadable | Brotato cap 100, VS gem cap 400-500 | Cap alive enemies (~200) and gems (merge) |
| Speed scaling makes kiting impossible | Brotato leaves speed unscaled | Scale HP/damage, not speed |
| Late-game dead time (all stats maxed, nothing to pick) | Spirit Hunters skill cap 25 | Fallback cards give gold/heal; keep stat caps but total capacity > picks (84 capacity vs ~42 picks OK) |
| Dynamic difficulty exploited | Halls of Torment players complain Agony broken after patch | Avoid DDA until core stable |
| Stacking "amount"/count stats | OPINION | Sub-linear summon scaling |
| Boss too easy because player power peaked earlier | OPINION | Boss at 10:00 must demand movement, scale to ~1.5x player DPS-time-to-kill = 45-60 s fight |
| Balance vs content: balancing takes more time than expected | https://justcamh.itch.io/colour-rewind/devlog/169010/reflecting-on-what-went-wrong (generic postmortem) | Keep bot harness; automate sweeps |

## Bot-test discipline (OPINION)
- Run 3 bots: random-pick, focused-pick, "greedy evolution". Report win% and median death time, 200+ seeds each.
- Win target: random 15-25%, focused 45-60%. Death time distribution should have a tail at 7-12 min, not all at the boss.
- Check evolution-share of total damage: target 35-50% of damage after first evolution, not 80%+.
