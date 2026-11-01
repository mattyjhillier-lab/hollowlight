# 37 - Enemy design: silhouettes, telegraphs, tiers, roles, animation, density (Hollowlight)

Checked 2026-10-17. Builds on, and does not repeat, research 10 (roster, archetype table, Chapter 1 timeline, Elder Treant phases) and research 30 (world, POIs, event cadence, chest rewards). Labels: OFFICIAL (developer talk/paper/patch notes), COMMUNITY (fan wiki, datamine, guides, forum), OPINION (articles, reviews, blogs). Where a search found nothing, that is stated as UNVERIFIED rather than filled in.

Honest summary of the evidence: developer talks on survivors-like enemy art are rare. Most hard numbers come from community wikis (Brotato, HoloCure, VS). Several things the brief asked for (Hades/Hollow Knight/Ori readability statements, Dead Cells flash timings, Death Must Die elites, Spirit Hunters tiering) could not be sourced and are marked UNVERIFIED.

## 1. Silhouette and shape language

| # | Fact | Label | Source |
|---|---|---|---|
| 1 | Valve designed each TF2 class with a distinct silhouette that reads with no lighting cues, using body proportions, weapon and outline. Rim highlights (not dark outlines) define edges, and the palette is muted with small saturated accents | OFFICIAL (paper + talks) | https://wiki.teamfortress.com/wiki/Artstyle , https://www.advances.realtimerendering.com/s2007/Mitchell-IllustrativeRenderingInTF2(Siggraph07%20Course%20Notes).pdf |
| 2 | TF2 value rule: highest contrast at chest level (where the weapon is held), darker feet to lighter chest gradient. The point is "read the threat fast", not realism | OFFICIAL (GDC 2008 slides, via search summary; slides not opened) | https://cdn.steamstatic.com/apps/valve/2008/GDC2008_StylizationWithAPurpose_TF2.pdf |
| 3 | Ori's early prototype was black-and-white silhouettes (blockouts for play first, light and colour added after) | OFFICIAL (Xbox Wire quote of lead artist) | https://news.xbox.com/en-us/?p=4339 |
| 4 | Ori uses glow as a gameplay mechanic (lights areas you enter). No Moon Studios statement on enemy silhouette readability found | OPINION (preview) | https://selectbutton.com/articles/ori-and-the-blind-forest-preview |
| 5 | Hades: Supergiant describes itself as a "game design-led team" and keeps art provisional until gameplay settles. No primary statement on enemy silhouette or red-for-danger found; one secondary article claims readability by pose, timing and silhouette (low quality site, discount) | OFFICIAL (MCV interview) + UNVERIFIED claim | https://mcvuk.com/business-news/behind-the-art-of-hades-we-value-artistic-integrity-and-excellence-in-artistic-craft-at-supergiant-however-were-first-and-foremost-a-game-design-lead-team/ |
| 6 | Hades armoured variants are marked by a helm and larger body plus more health (the "mark" is shape and size, not only colour) | COMMUNITY (guide) | https://primagames.com/gaming/hades-guide-pact-of-punishment-modifiers-heat |
| 7 | Dead Cells sprites start as 3D models and are batch-converted to pixel art by a private tool; normal-mapped sprites allow dynamic lighting. No official source found on its flash/telegraph timings | OFFICIAL (artist writing, via summaries) | https://80.lv/articles/case-study-dead-cells-character-art-pipeline/ |
| 8 | Hollow Knight: no Team Cherry statement on silhouette readability found | UNVERIFIED | (searched, nothing usable) |
| 9 | Vampire Survivors was built around "as much stuff on-screen as possible" using a Castlevania-style asset pack; simplicity was deliberate but not stated as a readability policy | OPINION (interviews) | https://www.pockettactics.com/vampire-survivors/interview , https://80.lv/articles/vampire-survivors-developer-on-its-design-sudden-success |

Reading for Hollowlight: the only hard, citable silhouette rule is TF2's (distinct outline per role, edges by rim light, muted palette with small saturated accents). That maps well onto our faceless-with-eye-points rule: the outline carries the role, the eye-points carry "alive and facing you".

## 2. Telegraph standards

| # | Fact | Label | Source |
|---|---|---|---|
| 10 | A telegraph is delivered by a mix of animation, SFX, VFX and sometimes voice or rumble; it is what makes damage fair ("player failed a known question") | OPINION (Game Developer article) | https://gamedeveloper.com/design/enemy-attacks-and-telegraphing |
| 11 | That article gives no durations; it only says a telegraph need not be long. No official Dead Cells or Hades wind-up timings were found | OPINION + UNVERIFIED timings | same |
| 12 | Dead Cells (player guide): enemies telegraph with a red aura and a "!" above the head, then you roll or parry. Two channels, colour plus icon | COMMUNITY (guide) | https://www.playstationlifestyle.net/2018/08/06/dead-cells-tips/ |
| 13 | Dead Cells elite on first hit or below 50% HP: time slows briefly and the player is knocked away (a built-in "reset" beat) | COMMUNITY (wiki) | https://deadcells.wiki.gg/wiki/Elite |
| 14 | Reaction budget: simple visual reaction averages about 215-265 ms (about 13-16 frames at 60 fps); choosing between two stimuli is slower (about 380 ms in one forum test). Startup frames overstate reactability because the early frames are often unreadable | COMMUNITY (fighting-game analysis, forums) | https://ki.infil.net/reaction.html , https://www.forums.dustloop.com/topic/10626-ability-to-react-to-overheads/ |
| 15 | Hades Louts: charge direction locks once the wind-up starts; the answer is to read the telegraph and leave the path | COMMUNITY (Steam thread) | https://steamcommunity.com/app/1145360/discussions/0/3096760955446404395 |
| 16 | Enter the Gungeon: projectile hitboxes are small (centre pixels) and not drawn; players complained when impact particles were the same pink-red as enemy bullets; sound is used for wind-up cues but is hard to dodge by | COMMUNITY (fan wiki, forums) | https://enterthegungeon.fandom.com/wiki/Hitbox , https://steamcommunity.com/app/311690/discussions/0/364040166685628084 |
| 17 | Brotato: Buffer and Stonefish buff nearby enemies, who are then outlined in red (buff shown on the buffed, not only on the caster) | COMMUNITY (wiki) | https://brotato.wiki.spellsandguns.com/Enemies |
| 18 | Brotato Slasher Egg: stationary, hatches into a Slasher after 5 s unless killed (a timed threat you can see and pre-empt) | COMMUNITY (wiki) | https://brotato.wiki.spellsandguns.com/Enemies |

Reading: published numbers support a floor near 0.5-0.7 s for a wind-up that is also readable (about 265 ms reaction plus time for the cue itself to register, more on a phone with a thumb on glass). Treat 0.6 s as the minimum for anything that can hurt, longer for big hits. This is OPINION built on rows 14-15, not a measured standard.

## 3. Tiering: fodder, elite, miniboss, boss, chests

| # | Fact | Label | Source |
|---|---|---|---|
| 19 | HoloCure Stage 1 minibosses: Mega Chumbud 2:00 (600 HP), Tako Grande 4:00 (1,800), Mega Dark Chumbud 6:00 (2,500), Giant Dead Batter 8:00 (3,500); stage boss Fubuzilla 10:00 (8,000). All drop Holozon Boxes. That is a miniboss every 2 minutes in a 10-minute stage | COMMUNITY (wiki) | https://holocure.wiki.gg/wiki/Stage_1 |
| 20 | HoloCure Holozon Box: 1 item (or 3 on 9%), 5% super; normal box 70% weapon / 30% item; fallback chain tries a weapon up to 5 more times, then pays HoloCoins; player may accept or discard | COMMUNITY (wiki) | https://holocure.wiki.gg/wiki/Holozon_Box |
| 21 | VS chests come from bosses only. Bronze (usually before 10:00, no evolution), Silver (usually after 10:00, can evolve), Gold, Arcana, Dark. Size 1/3/5 items rolled per boss (example: 50% / 10% / 3%, fallback 1 item); Luck scales size only, not contents | COMMUNITY (wiki) | https://vampire.survivors.wiki/w/Treasure_Chest |
| 22 | VS bosses: not despawned, teleported back on screen; resist freeze/knockback; many scale as HP x player level at spawn (applied once) | COMMUNITY (wiki) | https://vampire.survivors.wiki/w/Boss |
| 23 | Brotato elites: Danger 0-1 none, 2-3 one elite wave, 4-5 three (waves 11/12, 14/15, 17/18). Kill drops a legendary crate with a guaranteed tier-4 item and heals 100 HP. Elites change pattern at a set HP% or time, whichever comes first (Rhino: 60% HP or 25 s) | COMMUNITY (wiki) | https://brotato.wiki.spellsandguns.com/Elite_Wave , https://brotato.wiki.spellsandguns.com/Enemies |
| 24 | Brotato elite list shows one verb each: Rhino charges, Butcher slashes in fans, Monk summons eggs, Colossus fills space with bullets, Mother spawns adds | COMMUNITY (wiki) | https://brotato.wiki.spellsandguns.com/Enemies |
| 25 | Dead Cells elites: slightly larger, a name tag always above them, an aura; higher damage, speed and health; 20% resist to crowd-control; better loot (extra 6% legendary chance) | COMMUNITY (wiki) | https://deadcells.wiki.gg/wiki/Elite |
| 26 | Halls of Torment: timed minibosses appear through a 30-minute run; kill gives a magic ability or an armour chest; "champions" drop scrolls/items. One forum thread says blue outline = elite with reliable scroll, yellow outline = champion with random loot (anecdotal) | COMMUNITY + OPINION (reviews) | https://fullcleared.com/features/halls-of-torment-first-impressions/ , https://steamcommunity.com/app/2218750/discussions/0/4360121922350543981/?l=english |
| 27 | 20 Minutes Till Dawn: "easy" bosses drop a chest with a character-specific upgrade and 36 XP; spawns run in timed "sessions" (enemy, start/end time, HP, cap) | COMMUNITY (fan wiki) | https://20-minutes-till-dawn.fandom.com/wiki/Enemies |
| 28 | Spirit Hunters: developer reply says minibosses are larger special versions of normal enemies and spawn in the same zone as the normal type | COMMUNITY (Steam thread, dev reply) | https://steamcommunity.com/app/1914580/discussions/0/3457094584923738513 |
| 29 | Hades Pact of Punishment: armoured elites get extra perks per rank; "calisthenics" adds +15% enemy HP per rank (so elites are rebalanced by multipliers, not new art) | COMMUNITY (guide) | https://primagames.com/gaming/hades-guide-pact-of-punishment-modifiers-heat |

Gaps: no source found for elite HP multipliers in Halls of Torment, Soulstone Survivors, Death Must Die or Spirit Hunters (UNVERIFIED). The only sourced multipliers: Brotato elites roughly 700-750 HP per wave versus 1-3 for a chaser (about 100x+, COMMUNITY, wiki page rows); HoloCure minibosses are 50-300x a basic fan (needs the fan HP table, not fetched, so treat the ratio as UNVERIFIED).

## 4. Behaviour roles and how many must-react types at once

| # | Fact | Label | Source |
|---|---|---|---|
| 30 | Brotato introduces new behaviour types gradually (Charger w3, Spitter w4, Bruiser w8, Pursuer w11, Buffer w16 of 20); Charger/Bruiser share a 2.5-3.5 s charge cooldown; Spitter flees when close | COMMUNITY (wiki) | https://brotato.wiki.spellsandguns.com/Enemies (see research 10) |
| 31 | Brotato Looter: 10% chance to appear from 25 s, flees, drops a crate (a "chase me" bonus role) | COMMUNITY (wiki) | https://brotato.wiki.spellsandguns.com/Enemies |
| 32 | Halls of Torment reviews: elites praised for having mechanics, not just HP; bosses spawn minions and bullet patterns | OPINION (reviews) | https://www.gamesasylum.com/2025/10/28/halls-of-torment-review/ , https://rogueliker.com/halls-of-torment-review/ |
| 33 | Gungeon: the dodge roll is the answer to dense fire; deaths feel fair because the player has a tool, not because bullets were readable | OPINION (review) | https://www.thexboxhub.com/enter-gungeon-review/ |

How many must-react types at once: no source states a number (UNVERIFIED). Brotato's ramp (a new reaction verb roughly every 3 waves of 20) is the nearest evidence. OPINION for Hollowlight: at most 2 must-react behaviours on screen at the same time in Chapter 1, plus the swarm itself; introduce one new must-react verb about every 2 minutes.

## 5. Animation personality on tiny sprites

| # | Fact | Label | Source |
|---|---|---|---|
| 34 | Squash and stretch must preserve volume (scaleY = s, scaleX = 1/s); anticipation is a small preparatory move, and leaving it out makes motion feel abrupt | OPINION (animation-principles guides) | https://www.clipstudio.net/en/animation/12-principles/ |
| 35 | Cheap swarm animation (my engineering suggestion, not a sourced rule): one sprite, scale driven by a sine/lookup of (time x speed + per-entity phase offset); 2-3 frame walk plus bob and lean; flip for direction | OPINION | https://www.wayline.io/learn/sprite-animation (search result; not opened) |
| 36 | Vlambeer juice: hit pause, enemy knockback, hit reaction, impact effect and screenshake are the core feel tools; advice to trigger hit pause once per impact, never on held attacks (freeze locks the game) | OPINION (recreation + guide) | https://dkliao.itch.io/the-art-of-screenshake-recreation/devlog/451576/quick-breakdown-of-all-the-effects |
| 37 | No source found for exact hit-flash or hit-stop frame counts (Vlambeer slides not retrieved) | UNVERIFIED | - |

## 6. Density, readability and performance

| # | Fact | Label | Source |
|---|---|---|---|
| 38 | Brotato caps enemies on screen at 100; over the cap a random non-elite/boss dies without loot (counts as a death for item triggers) | COMMUNITY (wiki) | https://brotato.wiki.spellsandguns.com/Enemies |
| 39 | VS: no hard cap confirmed. Poncle rewrote physics and the gameplay loop so large projectile/enemy counts run well; first engine prototype ran about 10x faster but felt less like VS and was reworked | OFFICIAL (patch notes) | https://vampire.survivors.wiki/w/0.7.3 |
| 40 | Phaser 3.60 changelog: mobile pipeline and hybrid batching; performance depends on texture binds and draw calls, so share one atlas across on-screen objects; keep sheets 2048 or less for mobile (the 15,104 binds figure is a synthetic iPhone SE test, not a sprite count) | OFFICIAL (Phaser changelog) | https://unpkg.com/phaser@4.2.1/changelog/v3/3.60/MobilePerformance.md |
| 41 | A legacy Phaser tutorial said a batch flushes at 2,000 objects or a texture change (outdated for 3.60) | COMMUNITY (tutorial) | https://phaser.io/tutorials/advanced-rendering-tutorial/part2 |
| 42 | Brotato Horde waves add extra enemies but with 35% less material drop (more bodies, same reward) | COMMUNITY (wiki) | https://brotato.wiki.spellsandguns.com/Elite_Wave |

## Takeaways for Hollowlight (OPINION)

1. **Silhouette is the role.** One distinct outline per role (TF2 rule), faceless bodies, eye-points for "alive". Swarmer = small round, charger = low wedge leaning forward, spitter = tall narrow with a visible mouth-glow, brute = wide and low, healer = floating with a ring. Never two roles with a similar outline at 28 px.
2. **Far enemies read as eye-points, so eye colour carries the tier, not the role.** Fodder = cool dim, must-react = warmer and brighter, elite = gold/amber. Role is read only once the body resolves close up. Test at phone size in the dark-start look before locking.
3. **Telegraph minimum 0.6 s for anything that damages; 0.8-1.0 s for big hits or area hits.** Basis: 215-265 ms simple reaction, slower to choose, plus a touch screen. Never below 0.5 s, even on phone.
4. **One colour language, no exceptions.** One hostile-danger colour (warm red-amber ground decal and eye flare) used only for "this will hurt soon"; player/ally effects never use it (Gungeon complaint, row 16). Add a second channel (a short audio cue, or a shape change) for colour-blind and phone-in-sunlight cases.
5. **Lock direction at wind-up start and show it.** Chargers lock heading when the wind-up starts (Hades Louts) and draw a lane or a lean; this makes crowds fair because the player reads one line, not a guess.
6. **Crowd fairness.** Cap simultaneous must-react attackers on screen (suggest 2-3 telegraphs at once), stagger their cooldowns with a random offset, and never wind-up on spawn; give new spawns a short grace (about 0.8 s) where they only move.
7. **Elite marking: three channels.** Size (about 1.5x), a tinted rim or aura, and a name tag or bar on first sight (Dead Cells). Add a one-time elite spawn sound. Do not rely on size alone, since the dark-start view hides it.
8. **Elite rule: one verb, one phase change.** Each elite is a normal enemy plus one verb (Brotato table), with a single pattern change at about 50% HP or a time limit, whichever first (Brotato mutation rule). Optional Dead Cells-style brief slow-down at the phase change.
9. **Minibosses on a clock, chest on kill.** A miniboss every 2-3 minutes after the first elite (HoloCure is every 2, HoT is "periodic"), each with its own telegraph set. Chest model: guaranteed single reward (1 item, rarely 3), a "take or skip" choice, and a fallback to gold/heart so the roll never pays nothing (VS/HoloCure fallbacks). Luck-style bonus changes the size, not the contents. Evolution chests only from bosses/late minibosses, as in VS. This is consistent with research 30 chest rules; Matt decides final contents.
10. **Introduce roles slowly.** At most 2 must-react behaviours live at once in the first 6 minutes, 3 later; a new verb about every 2 minutes (Brotato pacing). Chapter 1 target: swarmer, flyer, brute (no reaction needed), then spitter, charger, suicider, healer (see research 10 for the timeline).
11. **Animation on a budget.** One idle/walk loop per enemy of 2-3 frames or none: use procedural squash-stretch with a per-enemy phase offset; one hit-flash (white tint for about 2 frames) shared by all; one 3-4 frame death puff shared by role. Anticipation is mandatory only for attackers (a visible crouch or lean before the telegraph ends). Fodder gets personality from walk rhythm, not extra frames.
12. **Hit-stop and shake stay off the crowd.** Apply hit-stop (about 40-60 ms, UNVERIFIED value) only to elite/boss hits, once per impact; crowd kills use a flash and a tiny pop only. Death animations short (under 0.25 s) and low-contrast so 100+ deaths a minute do not clutter the field.
13. **Density.** Draw only what is on screen, share one atlas, use flat sprites for the far eye-point LOD; keep a hard cap (suggest 240 as designed, with a Brotato-style random despawn of non-elites over the cap and a smaller phone cap, to be measured). Measure draw calls and texture binds in Phaser (Phaser changelog), not just sprite counts.
14. **Risks.** (a) Eye-point-only far view may hide telegraphs: telegraphs need ground decals visible at distance, not just body cues. (b) Gold elite eyes may clash with the Warm Lantern pickups and gold UI; check against role colours in docs/IDENTITY.md. (c) Hit-stop and flash on phone can hurt readability or battery. (d) Most numbers here are community wiki and may be patched; none of the Hades/Hollow Knight/Ori/Dead Cells readability claims are developer-confirmed. (e) Faceless enemies lose the "face" channel that games like Hades use for personality; compensate with motion, eye-point behaviour (lean, blink, track) and sound.

Unverified list (do not cite as fact): Hades red telegraph policy; Hollow Knight silhouette process; Dead Cells flash/telegraph timings; Ori enemy readability intent; elite HP multipliers outside Brotato; hit-stop frame counts; Death Must Die and Soulstone elite systems; any hard enemy cap in VS.
