# 01 Enemy scaling and wave ramps

Labels: DATAMINED / OFFICIAL (wiki or dev) / COMMUNITY-MEASURED / OPINION. "RECALLED" = from general genre knowledge, NOT verified this session; treat as OPINION.
Research limits: web search returned little primary datamine for VS, HoloCure, Survivor.io, Soulstone, Death Must Die, Spirit Hunters. Gaps marked.

## Verified numbers

| Game | Finding | Label | Source |
|---|---|---|---|
| Brotato | Enemy HP = base + hpPerWave x (wave-1); damage same; speed does NOT scale with wave/danger. Tree 10 HP +5/wave; Bruiser 20 +11; Pursuer 10 +24; Chaser 1 +1 | OFFICIAL (wiki) | https://brotato.wiki.spellsandguns.com/Enemies |
| Brotato | 20 waves; wave lengths 20,25,30,35,40,45,50,55,60 s (waves 1-9), wave 20 = 90 s; endless waves 60 s. ~ 20 min total; final wave boss | OFFICIAL | same |
| Brotato | Hard cap 100 enemies on screen; excess non-elite randomly dies without loot | OFFICIAL | same |
| Brotato | Danger tiers are NOT stacked: D3 +12% HP/dmg, D4 +26%, D5 +40%; D2+ adds elite/horde waves (waves 11-18 at D4); D5 = 2 bosses (each 75% HP) | OFFICIAL | https://brotato.wiki.spellsandguns.com/Dangers |
| Brotato | Elites on waves <=12 spawn at 75% HP (early-elite discount). Elite mutation (enrage) at HP% or time threshold, e.g. 60% HP or 25 s | OFFICIAL | Enemies page |
| Brotato | Curse -> enemy HP scaling was reduced 2.5*curse -> 2*curse in patch 1.1.1.0 (devs nerf stacking difficulty levers) | OFFICIAL | https://brotato.wiki.spellsandguns.com/Patch_1.1.1.0 |
| 20 Minutes Till Dawn | Spawns defined as "sessions": enemy type, start/end time, HP, max live count, spawn interval, count per tick. Darkness raises batch size and shortens interval but NOT max count | OFFICIAL (wiki) | https://20-minutes-till-dawn.fandom.com/wiki/Enemies |
| 20MTD | Enemy HP is a range by spawn time (Tentacle 24-250, Lurker 50-500, Big Sploder 500-2000) => HP grows roughly 10x over 20 min for same type | OFFICIAL | same |
| 20MTD | Endless: every 10 min HP += 5 x base HP (i.e. +500% base), speed += 0.2 x base; boss attack speed +0.25 | OFFICIAL | https://20minutestilldawn.wiki.gg/wiki/Modes |
| 20MTD | Elder elite 1000 HP, first appears 3:00 elapsed, max 1, 10 s interval; 10 min "Quickplay" = first 10 min of standard | OFFICIAL | Enemies page |
| Vampire Survivors | Enemy HP multiplier is tied to the PLAYER LEVEL at spawn time in some entries (Death HP quoted 655,350 x level; unverified) | OFFICIAL wiki, partially verified | https://vampire-survivors.fandom.com/wiki/Enemies |
| Halls of Torment | Agony Mode: performance-driven meter; each Agony level raises enemy count, HP and XP dropped (dynamic difficulty, XP reward offsets risk) | OFFICIAL (guide) | https://primagames.com/gaming/halls-of-torment-what-is-agony-mode |
| Soulstone Survivors | Curse levels per map (5 tiers) add modifiers: limit healing, buff bosses, more suicide barrel goblins, more/tougher elites, multi-boss. Players report "AOE carpets" clutter at high curse | COMMUNITY (reviews/Steam) | https://rogueliker.com/soulstone-survivors-review , https://hardcoregamer.com/previews/stomping-the-lords-of-the-void-in-soulstone-survivors/429724/ |
| HoloCure | Enemy stats are per-enemy fixed with appearance windows (e.g. 0:00-3:00); no continuous scaling formula found; bosses fixed HP (Goriela 180k highest) | OFFICIAL wiki | https://holocure.wiki.gg/wiki/Stage_1 |

## Patterns (synthesis, OPINION unless noted)

| Pattern | Games | Implication for Cursed Forest |
|---|---|---|
| HP scales LINEARLY in time/wave, not exponentially | Brotato (linear/wave), 20MTD endless (linear per 10 min) | Matt's hpScale {0.26, 0.012} is in family. Keep linear; add the multiplier on top via tier |
| Speed does not scale | Brotato | Don't scale enemy speed with time; keep for elites/tiers only |
| Variety/tier-up replaces raw HP | HoloCure, VS, 20MTD (new enemy at fixed minutes) | New enemy type every ~2 min; raw HP growth moderate |
| Density via "max alive" cap + spawn interval | 20MTD sessions, Brotato cap 100 | Use cap ~150-250 on 640x360 view; ramp interval, not just count |
| Damage taken per hit scales slower than HP | Brotato (both linear, small increments) | Contact damage +4%/min (current) is fine; check per-hit vs HP regen |
| Elites/bosses get early-game discount | Brotato 75% | Apply to boss at 10:00 only if player power peaks earlier |
| Difficulty tiers = flat % + new mechanics, not stacked | Brotato D3 12 / D4 26 / D5 40 | Use tiers: +15/+30/+45% HP and dmg, with one new mechanic each |
| Dynamic difficulty tied to kill speed | Halls of Torment Agony | Optional later; risky for bot tuning |
| Timed enrage on elites (HP% or time) | Brotato | Good "behaviour change" mechanic for elites |

## Swarm / wave events (RECALLED, OPINION)
- VS-style: scripted "walls" (ring/line of enemies) at minute marks every ~1-2 min; Brotato: horde waves from wave 11 at D2+. 20MTD: batches via session ticks.
- Recommended for 15 min: swarm event every ~75-90 s from 1:00 (Matt has 60/150/240/360/450/540/660). Gap 150->240->360 is long; add events at 300 and 600, and make 2 of them ring-encircle type (player must move through gap).
- Pacing rule of thumb: ~30% of run easy (learning), peak pressure at 60-75% mark, boss at ~66% (10:00), last 5 min = victory lap only if player overbuilt.

## Gaps (not found in this session)
Exact VS XP table / HP scaling, HoloCure enemy HP formula, Survivor.io tables, Death Must Die scaling, Spirit Hunters scaling. Datamine repos on GitHub/Discord would be the next step.
