# 40 - Final boss and arena design (research for the Elder Treant)

Date: 2026-10-20. Purpose: inform the Elder Treant (end of run, own arena, no timer, 3 phases, light-flood victory).

Labels: OFFICIAL = developer/publisher source. COMMUNITY = wiki/guide/forum. OPINION = review, blog, or my own analysis.
Honesty note: web coverage was thin. Several wikis (Fandom) returned HTTP 402/403 and Prima Games pages blocked fetch, so those facts come from search-result snippets only. Where a fact was not found it is marked UNVERIFIED. No numbers below are invented; anything I computed myself is labelled "own arithmetic".

## 0. Source coverage at a glance

| Game | What was verified | Gaps |
|---|---|---|
| Vampire Survivors | Reaper spawns at 30:00, extra Reaper per minute after (COMMUNITY); The Ender merges Reapers (COMMUNITY) | Exact speed/damage/HP not retrieved; killable vs not is disputed |
| Halls of Torment | Bosses appear by survival time, 4 bosses per stage; Lord of Hate / Lord of Regret attack lists (COMMUNITY) | No arena/barrier info found; Prima page itself blocked |
| Brotato | Wave lengths, wave 20 = 90 s with 1-2 bosses, win on boss kill (COMMUNITY wiki) | Arena size, boss timing in wave not stated |
| 20 Minutes Till Dawn | Boss spawns trap player in a shrinking electric barrier (COMMUNITY wiki snippet) | Could not re-fetch page to confirm numbers |
| Hades | Extreme Measures structure and heat cost; final boss 3 phases (COMMUNITY) | No Supergiant statement on telegraphs found |
| Hollow Knight | Only secondary design commentary | No Team Cherry primary source found |
| Dead Cells | Boss Stem Cell tier effects (COMMUNITY) | No boss arena/telegraph source found |
| Enter the Gungeon | Dodge Roll dev Q&A (OFFICIAL), boss build process | Nothing on boss rooms or telegraph timing |
| Binding of Isaac | Boss challenge room, damage-taken affects reward (COMMUNITY) | Nothing on door locking |
| Spirit Hunters: Infinite Horde | Nothing boss-specific found | Entire game unverified for bosses |
| Soulstone Survivors | Dev forum reply on Cathedral boss and ground hazards (OFFICIAL via Steam) | No arena wall info |
| Death Must Die | Generic boss-pattern advice only | No arena info |
| HoloCure | Stage boss at 20:00 ends the stage (COMMUNITY forum) | Whether regular spawns continue unverified |

## 1. Arena boundaries

### Evidence
- 20 Minutes Till Dawn: when a boss spawns, a rectangular electric barrier traps the player for 1 minute while slowly shrinking. COMMUNITY (search snippet of the wiki). https://20-minutes-till-dawn.fandom.com/wiki/Enemies . The wiki also lists Shub-Niggurath at 2500 health, spawning at 5:00 and 15:00 elapsed (COMMUNITY, https://20-minutes-till-dawn.fandom.com/wiki/Forest ). So this game uses: hard lock-in + shrink + fixed 60 s duration. Barrier size UNVERIFIED.
- Halls of Torment: bosses arrive by surviving long enough, no trigger arena found. COMMUNITY (Prima: "stay alive long enough"; Frost Knight around 16 min). https://primagames.com/tips/how-to-defeat-lord-of-hate-the-frozen-depths-final-boss-in-halls-of-torment (snippet only). Lord of Hate "dash if you stray too far" acts as a soft leash instead of a wall: advice is stay at medium range. So: no wall, behavioural leash.
- Vampire Survivors: the Reaper has no arena; he chases across the open map and ends the run. COMMUNITY. https://vampire-survivors.fandom.com/wiki/The_Reaper (snippet). The Ender (Cappella Magna) is a single merged entity appearing at 30:00 after a cutscene. COMMUNITY. https://vampire-survivors.fandom.com/wiki/The_Ender (snippet).
- Brotato: waves happen in a single fixed arena all game; boss wave 20 lasts 90 s and the run is won when the boss(es) die. COMMUNITY. https://brotato.wiki.spellsandguns.com/Waves . Arena size not stated.
- Soulstone Survivors: Titan Hunt arenas are described by players as cramped and quickly covered in poison pools; same-size Void Fields arenas used for practice. COMMUNITY (Steam discussion). https://steamcommunity.com/app/2066020/discussions/0/550107551434293201
- Isaac: boss fights happen in a closed room; exact door logic UNVERIFIED in my sources.
- Dead Cells, Hades, Hollow Knight, Gungeon: all use closed arenas (known genre fact; I did not retrieve a source stating sizes). OPINION/UNVERIFIED.

### Analysis (OPINION, own)
- Three families: hard wall (20MTD, Hades, Isaac), soft leash via boss behaviour (Halls of Torment), none (VS Reaper). Only the first two make a "fight" rather than a chase.
- Brotato and 20MTD show the survivors-like idiom: the arena is mostly the normal playfield (or a slightly smaller rectangle), not a new room. Own arithmetic for Hollowlight: the view is 640x360; an arena of roughly 2x the screen width (about 1280x720) keeps kiting possible at 76-96 units/s (about 13-17 s to cross) while keeping the boss on screen most of the time. This is a proposal, not a sourced number.
- Shrinking is proven (20MTD) but it is a timer in disguise; the Elder Treant has no timer, so use it only as a limited pressure ramp (see section 3) or not at all.

## 2. Moves, phases, telegraphs

### Evidence
- Hades final boss: fight restarts at 0 HP with full health restored and brief invulnerability; phase 2 adds Soul Vases spawned around the area; with Extreme Measures 4 phase 3 shrouds the area in darkness. COMMUNITY. https://primagames.com/gaming/hades-true-ending-persephone-extreme-measures-4 (snippet). One Steam user complains boss healing between phases makes the fight drag. COMMUNITY/OPINION. https://steamcommunity.com/app/1145360/discussions/0/2995417278833132922
- Hades telegraph quality: one article argues Hades bosses' readable animations carry the tell, with distinct windup/vulnerability/recovery even in busy fights. OPINION. https://geekchamp.com/the-art-of-hades-showcases-the-talent-that-went-into-this-beautifully-vibrant-game/
- Hollow Knight-style bosses: heavier attacks get a brief delay; phase 2 is a change of tempo and moveset not only a health bar bump; Silksong analysis: phase 1 is a repeating pool of random patterns, phase 2 a new set and a new loop triggered by a condition. COMMUNITY/OPINION (guides and blogs). https://www.wayline.io/blog/crafting-legendary-boss-battles , https://choostgames.com/blog/what-makes-a-good-boss-fight/ . No Team Cherry primary quote found. UNVERIFIED as official.
- Halls of Torment Lord of Hate attack list: scattered circle strikes that spread gradually, pulsing rings with safe gaps, a six-line linear strike, a dash if you stray too far, slow ice projectiles, a spinning four-way. Lord of Regret: slow telegraphed attacks and repeated damage-immune orbs that absorb splash. COMMUNITY. https://primagames.com/tips/how-to-defeat-lord-of-hate-the-frozen-depths-final-boss-in-halls-of-torment and https://primagames.com/tips/how-to-defeat-lord-of-regret-the-ember-grounds-final-boss-in-halls-of-torment (snippets). Key lesson: bullet-heaven bosses use ground shapes (rings with gaps, lines, circles) rather than aimed projectiles because the player cannot aim.
- Gungeon: 21 bosses (OFFICIAL, https://www.gamedeveloper.com/design/q-a-the-guns-and-dungeons-of-i-enter-the-gungeon-i- ); boss built by pitch then programmer prototyping bullet patterns and team feedback; the dodge roll with invincibility frames was added as an answer to many bullets that "wasn't just weaving through them" (OFFICIAL, same). Telegraph timing not discussed in that article. The Bunker boss was cut for being "pretty static and uninteresting to fight" (COMMUNITY wiki quote, https://enterthegungeon.wiki.gg/wiki/Bunker ). Lesson: static bosses fail; a pattern set per boss is the unit of design.
- Soulstone Survivors Cathedral boss: dev said the first stage is "a bit of a race" to push him to the next stage before the ground is too littered with damage areas; homing balls leave permanent damage zones. OFFICIAL (dev reply on Steam). https://steamcommunity.com/app/2066020/discussions/0/603029004750948981 . Another thread: red zones only hurt once filled so a timed dodge is enough; speed should be enough to escape but not so high you run into other zones. COMMUNITY. https://steamcommunity.com/app/2066020/discussions/0/550107551434293201

### Telegraph durations
- Visual simple reaction time is about 180-200 ms; auditory 140-160 ms. OPINION/secondary (student presentation citing a literature review, to be checked against the original). https://gradex.staffs.ac.uk/wp-content/uploads/2025/05/5480_Artificact-Development-Presentation-Joey.pdf
- I found NO published standard telegraph duration. The brief's norm of 0.4-0.8 s is plausible but UNVERIFIED as a sourced figure. Own reasoning (OPINION): simple reaction is about 0.2 s, add perception of which zone, decide direction and move out of a ground shape; in a bullet-heaven the player is also watching dozens of enemies, so 0.6-1.0 s for a ground decal at 76-96 u/s hero speed is a safer starting point (a 1.0 s tell lets the hero cross roughly 76-96 units, about 12-15 percent of the screen width). Playtest to tune. General guidance says telegraph timing and clarity decide whether a hit feels fair. OPINION. https://bugnet.io/blog/how-to-design-enemy-attack-telegraphs
- Number of simultaneous threats: not found as a norm. Evidence from Halls of Torment shows one shape type per move (ring, line, circle) with an attack every few moments. UNVERIFIED count. Proposal (OPINION): max 1 big telegraphed threat plus at most 1-2 minor lingering ones at once in phase 1; scale to 2 big in phase 3.

## 3. Pressure without timers

- 20MTD: a 1-minute shrinking barrier is pressure with a built-in end. COMMUNITY (above).
- Vampire Survivors: one additional Reaper per minute after 30:00 while the first lives. COMMUNITY. https://vampire-survivors.fandom.com/wiki/The_Reaper (snippet; the wiki says unlimited). This is an unbounded escalation timer: lose-state pressure by multiplication. Sources disagree on whether the Reaper can be killed normally (Rogue Ranker calls it run termination; Fandom lists kill strategies with Crimson Shroud and Infinite Corridor). https://rogueranker.com/vampire-survivors-bosses/ , COMMUNITY.
- Soulstone Survivors Cathedral boss: lingering damage zones accumulate until the arena is unusable, a natural soft enrage (OFFICIAL dev framing "race"). https://steamcommunity.com/app/2066020/discussions/0/603029004750948981
- Hades: no enrage, pressure comes from phase restarts and added mechanics (Soul Vases, darkness). COMMUNITY. See section 2.
- Brotato Endless mode: waves continue past 20 with rapidly rising difficulty. COMMUNITY. https://brotato.wiki.spellsandguns.com/Waves
- Analysis for no-timer (OPINION): the options are (a) lingering hazard that accumulates (Soulstone) and bounded by cleanup, (b) damage ramp per phase, (c) add waves at HP thresholds, (d) arena shrinks one step per phase (not continuously). Avoid unbounded multiplication (VS Reaper) because the brief says "beat it or die" and an invisible soft clock violates "no timer". Option (a) plus (b) keeps the fight a pressure race without a clock number on screen.

## 4. Adds during the boss fight

- Brotato: elite waves add one Elite to the regular enemies; Horde waves add extra enemies, drops reduced 35 percent. COMMUNITY. https://brotato.wiki.spellsandguns.com/Elite_Wave . Boss waves keep normal spawning in my reading but this was not stated, UNVERIFIED.
- Hades Extreme Measures/Middle Management: "adds either one Elite Enemy or another distraction to mini-boss battles", 2 Heat per rank. COMMUNITY. https://www.rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards
- Lord of Regret orbs are immune and absorb splash, a boss-created obstacle rather than an enemy. COMMUNITY (above).
- HoloCure: whether regular spawns continue during the stage boss UNVERIFIED. https://steamcommunity.com/app/2420510/discussions/0/3810661398182497854
- Own analysis (OPINION): for a summon-based auto-attacker, adds are also a damage sponge for the player's area weapons, so adds change who the player's weapons hit. Recommend stopping ordinary wave spawns when the arena forms (clear readable field) and replacing them with boss-owned adds (saplings/roots) in capped numbers at phase changes.

## 5. Pickups and healing in arenas

- Brotato: killing an Elite drops a Legendary Loot Crate; picking it up also heals 100 HP. COMMUNITY. https://brotato.wiki.spellsandguns.com/Elite_Wave
- Dead Cells Boss Stem Cells: first cell makes health fountains available only at every other passage; at second tier fountains are empty but there is 1 free flask charge in those rooms. COMMUNITY. https://www.trueachievements.com/game/Dead-Cells/walkthrough/9 (snippet). Healing scarcity is one of the dial settings.
- Isaac: damage taken during the boss fight lowers the chance of an Angel Room afterwards (reward tied to flawless play). COMMUNITY (low-quality sources, treat with caution). https://bindingofisaacrebirth.wiki.gg/wiki/Room
- Hades: the community complaint is boss self-healing between phases makes the fight drag (opinion above). Full-heal-on-phase-start was reported as a complaint, not a design target.
- Hollowlight lock (CLAUDE.md): heart heal 30 percent max HP, pity timer, boss always drops one. Own analysis (OPINION): since the arena stops the player from collecting anything outside, spawn a small guaranteed heart at each phase break inside the arena.

## 6. Spectacle and readability

- Hades: telegraphs are carried by animation posture/timing, not hidden behind effects. OPINION. https://geekchamp.com/the-art-of-hades-showcases-the-talent-that-went-into-this-beautifully-vibrant-game/
- Gungeon: bullet-clearing effect on table flip "deletes enemy bullets in a small radius" (OFFICIAL, Dodge Roll Q&A) shows the genre values giving players a clearing tool.
- Hades phase 3 under Extreme Measures shrouds the area in darkness - a deliberate visibility reduction as difficulty. COMMUNITY. https://primagames.com/gaming/hades-true-ending-persephone-extreme-measures-4
- Design blog framing: the player always has the tools and information to survive. OPINION. https://choostgames.com/blog/what-makes-a-good-boss-fight/
- Soulstone Survivors forum: arena swallowed by poison pools within seconds is a common complaint (COMMUNITY), which means decal accumulation hurts readability.
- Own analysis (OPINION), supported by the above: reserve the brightest/most saturated treatment for real threats; all safe ground, glows and the world's recovering light must be dimmer or cooler than the threat decal; threat shapes should have a consistent colour and a fill-in animation showing time remaining (Soulstone "filled and trigger"). Hollowlight's identity (light = life) conflicts with "bright = danger", so draw threats in a distinct corrupt hue and keep the warm lantern glow for the player and safe zones.

## 7. Victory payoff

- Brotato: run is won when the wave-20 boss(es) die; Endless mode optional afterwards. COMMUNITY. https://brotato.wiki.spellsandguns.com/Waves
- HoloCure: killing the stage boss ends the stage mode with a stage-cleared notice. COMMUNITY (forum). https://steamcommunity.com/app/2420510/discussions/0/3810661398182497854
- Vampire Survivors: The Ender is a 30:00 cutscene boss; defeat reward UNVERIFIED (page not fetched).
- 20MTD: boss drops a tome with an optional unique upgrade. COMMUNITY. https://20-minutes-till-dawn.fandom.com/wiki/Enemies (snippet)
- Dead Cells: beating a boss yields a stem cell for the next difficulty. COMMUNITY. https://www.trueachievements.com/game/Dead-Cells/walkthrough/9
- I found no sourced data for slow-mo length, screen flood duration or credits timing. UNVERIFIED. Everything on pacing is OPINION: a brief hit-stop on the killing blow, a short slow-mo, then the flood, before the results screen. Keep input unlocked for a moment so the player can walk in the returning colour.

## 8. Difficulty tiers

- Hades Extreme Measures: 3 ranks, each arms one Underworld boss with new battle techniques; heat 1 for rank 1, 2 each for ranks 2 and 3 (5 total). COMMUNITY. https://www.rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards . Extreme Measures 4 is a separate unlock for the final boss (after seeing the true ending; 100 gems). COMMUNITY. https://primagames.com/gaming/hades-true-ending-persephone-extreme-measures-4
- Middle Management adds Elite/distraction to mini-bosses (2 Heat per rank, 2 ranks). COMMUNITY (rpgsite above).
- Dead Cells Boss Stem Cells: five tiers (5BC hardest); tier effects include stronger enemies, fewer heal fountains, double cell drops, empty fountains but a free flask. COMMUNITY. https://www.trueachievements.com/game/Dead-Cells/walkthrough/9
- Brotato Danger: Danger 0-1 none, 2-3 one challenge wave, 4-5 three; on Danger 5 both bosses spawn in wave 20 (COMMUNITY via gameplay.tips; the "75 percent HP" claim for each is from that guide and is not verified). https://gameplay.tips/guides/brotato-danger-5-guide.html , https://brotato.wiki.spellsandguns.com/Waves
- Pattern: the best tiers add new moves, not only HP (Hades), or reduce recovery resources (Dead Cells). OPINION synthesis.

## 9. Gaps to resolve before building (UNVERIFIED items)
- Vampire Survivors Reaper numbers (speed, damage, HP) and Ender attack details.
- Halls of Torment: whether any boss uses a barrier arena.
- 20MTD barrier size and shrink rate.
- Any official dev statement on telegraph duration (Hades/Hollow Knight/Gungeon).
- Spirit Hunters boss structure.
Next step if Matt wants: pull these from wiki.gg or Steam guides by hand (Fandom blocks automated fetch) or watch a playthrough and time tells with a stopwatch.

## Takeaways for the Elder Treant

1. Arena: a hard-wall arena forms around the player and the Treant (20MTD, Hades, Isaac pattern); size roughly 2x screen width (about 1280x720), own proposal, so a 76-96 u/s hero needs 13-17 s to cross and kiting still works. Walls are drawn as roots/thorns that grow in over ~1.5 s, not a sudden cage.
2. Stop normal wave spawning when the arena forms (OPINION, supports readability); clear stray enemies with a light pulse so the field is clean.
3. Tells: ground decals with a fill-in timer; minor moves 0.6-0.8 s, big moves 1.0-1.5 s (own proposal, no published standard; reaction time ~0.2 s is the floor). Never fire the same tell with two different results.
4. Threat budget: one big telegraphed threat at a time in phase 1, up to 2 overlapping in phase 3; ground shapes (rings with gaps, lines, circles, cones) not aimed shots, because the player cannot aim (Halls of Torment pattern).
5. Phases: change the verb, not the numbers (Hollow Knight/Silksong commentary): P1 slam/root-line pattern pool, P2 adds a new set (e.g. thorn rings and sapling adds), P3 a new loop plus arena change. Short invulnerable phase transition with a heart (Hades has a phase restart; avoid full-heal on the boss, players complained).
6. Pressure without a clock: lingering root/thorn patches that accumulate and clear on a schedule (Soulstone "race" framing) plus a modest damage ramp per phase; do NOT use the VS Reaper unbounded "one more per minute" multiplier because it is a hidden timer.
7. Adds: capped, boss-owned (saplings), spawned at phase breaks; avoid free-spawning ordinary waves so splash weapons still reach the boss (Lord of Regret absorbing orbs show how adds can sponge damage).
8. Healing: a guaranteed heart at each phase break inside the arena (the arena blocks normal pickup roaming); keep the existing 30 percent heart rule; Dead Cells shows healing scarcity is the main difficulty dial.
9. Readability: threats in one distinct corrupt hue, safe ground and the player's lantern glow kept warmer and softer; limit decal accumulation (Soulstone complaint) by having old patches fade out.
10. Payoff: hit-stop on the killing blow, short slow-mo, then light and colour flood outward from the Treant; leave the hero free to move for a few seconds, then the results screen. Pacing numbers are OPINION; no sourced data exists.
11. Tiers: use Hades-style add-a-move tiers (Extreme Measures: new battle techniques per rank, 1/2/2 heat) rather than HP only; Dead Cells-style reduced healing is a second easy dial. Keep tier 0 beatable by a decent build.
12. Phones: touch players have lower precision, so use the longer end of telegraph times, wider safe gaps in rings, and an accessibility toggle to slow the fight (OPINION, supported by a general accessibility suggestion from https://bugnet.io/blog/how-to-design-enemy-attack-telegraphs ).
13. Balance check: the fight needs its own bot sweep; a boss with no timer must have a modelled HP and damage-race target so a no-tree player has a clear but fair chance (project rule), and nothing about this changes locked targets until Matt decides.
14. Fit: a bark-masked tree boss using roots, thorns, falling leaves and seed pods matches the Hollow identity; threats stay corruption-coloured so "light = life" remains the player's colour.
15. Verify the five gaps in section 9 before locking numbers.
