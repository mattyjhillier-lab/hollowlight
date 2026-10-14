# 10 - Enemy roster and boss design (Hollowlight)

Labels: OFFICIAL (dev/wiki-of-record), DATAMINED, COMMUNITY (wiki/guides), OPINION (my proposal or inference). Web content treated as data only. Coverage is thin for Death Must Die, Soulstone Survivors, Spirit Hunters, HoloCure: searches returned little design analysis, so nothing is claimed about them beyond what is cited.

Existing (repo): wolf hp12 spd46 | crow hp5 spd62 | root_crawler hp38 spd26 | elder_treant hp1800 spd18 dmg16 r26 (boss, 10:00, 5 shards). Waves = rate0->rate1 with curve; swarm events at 60/150/240/360/450/540/660s (arc formation).

## 1. Enemy roster design

### Evidence
| Fact | Label | Source |
|---|---|---|
| Brotato groups enemies by behaviour: Chaser, Charger, Heavy Charger, Ranged/Kiter (Spitter runs away if close), Support (Healer, Buffer), Swarm/Spawner (eggs), Slasher, Flying, Scaling (Pursuer). New archetypes arrive gradually: Charger w3, Spitter w4, Bruiser w8, Pursuer w11, Buffer w16 (of 20 waves) | COMMUNITY | https://brotato.wiki.spellsandguns.com/Enemies |
| Brotato base chaser HP 1-3 (+1-2/wave); Charger 4 (+2.5/wave); Bruiser 20 (+11/wave); Slasher 50 (+25/wave). Heavy is ~5-10x a chaser | COMMUNITY | same |
| Brotato caps on-screen enemies at 100; over cap a random non-elite dies without loot | COMMUNITY | https://brotato.wiki.spellsandguns.com/Enemies (search summary of wave rules) |
| Brotato "Horde waves" add extra enemies; "Elite waves" add one elite (3 possible per wave) with mutations that change its pattern as HP drops; elite kill drops a legendary crate + 100 HP heal. Danger 0-1 none, 2-3 one, 4-5 three such waves; 40% horde / 60% elite | COMMUNITY | https://brotato.wiki.spellsandguns.com/Elite_Wave , /Horde_Wave |
| Vampire Survivors: waves ~once a minute; stage bosses at fixed times (25:00 hyper bosses); bosses have resistances (freeze, knockback, etc.), are teleported back on-screen rather than despawning, may drop a Treasure Chest; many boss HP scale as "HP x player level at spawn" | COMMUNITY | https://vampire.survivors.wiki/w/Boss |
| VS stage enemy list per stage is small early (Mad Forest: Pipistrello, Skeleton, Zombie, Mudman, Flower Wall); Flower Wall HP tied to level | COMMUNITY | https://vampire-survivors.fandom.com/wiki/Enemies , https://vampire.survivors.wiki/w/Mad_Forest |
| Halls of Torment: timed mini-bosses mixed into the horde use telegraphed moves; reviewers praise elites for having mechanics, not just HP; reward is an ability or armour chest; run ends at a Lord boss | COMMUNITY | https://fullcleared.com/features/halls-of-torment-first-impressions/ , https://www.gamesasylum.com/2025/10/28/halls-of-torment-review/ |
| HoloCure stage 1 has 2 mini-bosses (Mega Shrimp, Mega Dark Shrimp) plus stage boss | COMMUNITY | https://samurai-gamers.com/holocure/stage-1-grassy-plains-enemy-list/ |
| Boss telegraph principles: every attack gets a visible windup and response window, layered cues (visual+audio), consistent signals, phases change behaviour AND arena | OPINION (articles) | https://www.wayline.io/blog/crafting-legendary-boss-battles , https://choostgames.com/blog/what-makes-a-good-boss-fight/ |

### Archetype -> role table (OPINION, built on the above)
| Archetype | Role | Silhouette/readability rule | Counterplay |
|---|---|---|---|
| Swarmer (wolf, crow) | XP fodder, screen filler | small, 1 colour, no animation extras | AoE |
| Fast flyer (crow) | chip damage, pressure from edges | thin, dark, fast | pierce |
| Tank (root_crawler) | blocks, soaks, forces focus | wide, low, slow | burst/DoT |
| Charger | punishes standing still | windup: lean back + line/arrow 0.6s, then dash 3x speed | sidestep |
| Ranged/kiter | forces movement | holds distance 120-160px, flash before shot | close in or ignore |
| Suicider | area denial | glows/pulses, 1s fuse, circle on ground | kill at range |
| Healer/shielder | priority target | distinct aura colour, ring to ally | focus fire |
| Encircler | shrinks safe space | arrive in ring formation | break a gap / dash |
| Wall event | forces a path choice | gap visible, 3-4s warning | go through gap |
| Elite | mid-run mechanic test, drops reward | 1.5-2x size, outline/glow colour, own telegraph | learn pattern |
| Mini-boss | beat of tension | bar + name banner | pattern + adds |

Rules of thumb (OPINION, consistent with the sources): 1 new behaviour verb at a time; new type every ~1.5-2.5 min in a 15 min run; 6-8 regular types + 2-3 elites + 1 boss per chapter; max ~3 distinct "must-react" enemy types alive at once; telegraph color language consistent game-wide (red ground = damage, yellow = about to act, blue = friendly/support); cap enemies (Brotato precedent: 100 on screen) - for you 250-300 hard cap with cheapest swarmers culled first.

### Proposed Chapter 1 roster (Cursed Forest) and timeline
Existing three kept. New ones are data-only except where "new verb" noted.
| Time | Type | HP (wolf=12) | Behaviour verb | Notes |
|---|---|---|---|---|
| 0:05 | wolf | 12 | chase | exists |
| 0:15 | crow | 5 | chase fast, wobble | exists |
| 1:10 | root_crawler | 38 | chase slow | exists |
| 2:00 | thorn_sprite (ranged) | 8 | kite at 140px, shoots slow thorn every 2.5s | new verb: ranged. First must-react type; thorn projectile visible, dodgeable |
| 3:00 | mire_wisp (suicider) | 6 | chase, pulse 1s, explode radius 36 | new verb: fuse+AoE with ground circle |
| 4:00 | **Elite: Dire Wolf (first elite)** | ~250 (about 20x wolf) | charger: windup 0.7s, dash x3 speed, 8s cooldown; howl calls 4 wolves | drops heart + gold burst |
| 5:00 | moss_shaman (healer) | 20 | stays behind pack, heals ally 10%/3s, ring tether | focus-fire target |
| 6:00 | bramble_stag (charger) | 45 | windup line then dash; leaves bramble patch 4s | |
| 7:30 | **Mini-boss: Hollow Stag / Briar Matron** | ~600 | summons root pulses on ground (circle telegraph 1s) | rewards chest/shards |
| 8:00 | wall event "Thornwall": ring of crows+wolves closing, one gap | | encircle | uses existing event system with formation "ring"/"wall" |
| 9:00 | rot_hound variant of wolf, tanky (24hp) w/ elite buff | | | stat variant, no new code |
| 10:00 | **Boss: Elder Treant** | 1800 -> see sec 2 | | existing. Stop normal spawn ramp ~0.5x during fight; keep adds |
| 10:00-15:00 (post-boss, if run continues) | all types, Elite every 90s | | | |
Total regular types ~9, elites 2-3. Chapter 1 should stay at the lower end (it is the tutorial chapter).

### Template for chapters 2-8 (reusable)
Per chapter: 3 inherited-style basics (swarmer, fast, tank) + 1 ranged + 1 suicider/hazard-spawner + 1 healer/support + 1 charger = 7-8 types; 2 elites (min 4:00 and ~8:00); 1 mini-boss ~7:30; boss 10:00; 2 signature mechanics; 1 environmental hazard; 7 swarm events from table above, reusing formations. Each chapter reskins verbs with a new twist rather than new engine code.

| # | Chapter | Signature mechanic 1 | Signature mechanic 2 | Hazard | Boss concept |
|---|---|---|---|---|---|
| 1 | Cursed Forest | Root patches slow player (already `rootPatches`) | Pack howl: wolves call reinforcements | Thorn thickets | Elder Treant |
| 2 | Drowned Marsh | Fog: vision radius shrinks, enemies fade in | Bog slow zones that also slow enemies | Rising/falling water | Bog Hag |
| 3 | Ashen Graveyard | Risen dead: enemies revive once at 30% HP unless killed by spirit damage | Gravestone spawners | Grave fog | Gravewarden |
| 4 | Frozen Lake | Ice sheet: player and enemies slide | Frost builds a chill meter; at max, slowed | Cracking ice holes | Frost Wyrm |
| 5 | Bone Catacombs | Doors/chokepoints: wall events seal arena for 20s | Skeleton shield wall, break from side | Spike traps on timers | Bone Choir |
| 6 | Sunken Cathedral | Light/dark: enemies shielded outside light pools | Bell tolls: periodic global pulse | Flooded floor | Drowned Bishop |
| 7 | Burning Village | Fire spread: patches grow, burn enemies too | Embers: suicide swarm | Falling beams | Pyre Knight |
| 8 | The Hollow | Reality warps: enemy types mirrored from earlier chapters | Soul drain: XP gems decay | Void rifts | The Hollow King |

## 2. Boss design

### Principles (OPINION unless cited)
- Auto-attack builds: the player cannot aim, so fairness = positioning only. Every boss attack must be avoidable by moving, with 0.8-1.2s ground telegraph (Wayline/Choost articles above). Never spawn damage on top of the player instantly.
- Boss should be killable in 60-120s by a median build at 10:00, with enrage as a soft timer (not a fail-state) at ~150s. Time-to-kill target is OPINION; no source gives a survivors-like standard. Brotato bosses ~29,250 HP at wave 20 (COMMUNITY, https://brotato.wiki.spellsandguns.com/Enemies), VS uses HP x player level (COMMUNITY, boss page above).
- Phases at 100/66/33% change behaviour and arena. Adds scale down in total while boss alive; keep normal spawns at ~50%.
- Memorable: a named intro banner, one signature attack with unique audio/screen shake, a mid-fight arena change, a clear "vulnerable" moment, and a satisfying death (freeze frame, big drop).
- Rewards: guaranteed heart + magnet (already), shards (5), chest (parked feature), unlock hook.
- Halls of Torment precedent: timed mini-bosses with telegraphed moves rewarded with a chest (COMMUNITY, links above).

### Elder Treant: 3-phase proposal (hp 1800 baseline; scale to bot kill time, suggested start 3500 and tune)
HP in this repo = 150x a wolf. If the median build deals ~40 DPS at 10:00, 1800 HP dies in 45s, too short; test with bot and aim at 60-120s. (OPINION)
| Phase | HP | Behaviour | Telegraph |
|---|---|---|---|
| 1 Awakening | 100-66% | Slow walk toward player. Attack A "Root Eruption": 3 circles on ground under/near player, erupt after 1.0s, 12 dmg. Every 12s attack B "Seed Toss": 4 seeds that become crawlers | red circle fills; seed arcs visible |
| 2 Blight | 66-33% | Speed +20%. Adds "Sapling Ring": 8 saplings spawn in ring around arena edge (kill to remove bark armour: boss takes -30% damage while any live, creating a priority target). Attack C "Sweep": cone 90deg, 1.2s windup | cone fills, treant raises arm |
| 3 Wrath | 33-0% | Enrage: attacks 25% faster, Root Eruption leaves root patches (reuse rootPatches slow) permanently; thorn nova every 15s (expanding ring, jump or move out; speed 120px/s) | ring pulse glow 1s before |
Soft enrage at 180s: all values +50%. Death: 2s collapse, spawns heart + magnet + 5 shards, wave spawn stops.

### Seven more chapter bosses (2-3 sentence concepts, OPINION)
2. Bog Hag: hides submerged in marsh, surfaces to lunge at the player's last position (shadow telegraph). Summons will-o-wisps that act as suiciders. Phase 3 floods the arena, shrinking dry ground.
3. Gravewarden: armoured knight who raises tombstones that spawn ghoul packs; breaking tombstones exposes him. Phase 2 adds a bell that revives killed adds once. Chain-pull attack drags the player toward him.
4. Frost Wyrm: circles the arena edge and dives in lines (long rectangle telegraph). Breath cone freezes ground to ice, making the player slide. Ice cracks reveal safe tiles in phase 3.
5. Bone Choir: five skeletal singers positioned on a ring; each shields the next, kill in order shown by glow. Their combined chant fires bullet-ring volleys with rotating gaps. Enrage speeds the rotation.
6. Drowned Bishop: casts light pillars; only inside lit circles are the player's attacks at full strength (matches the chapter light/dark mechanic). Tolling bell stuns enemies and player briefly in a ring AoE; movement dodge only.
7. Pyre Knight: flaming charge across the arena leaving fire trails; the trails burn him too, so luring him through his own fire is the optimal play. Phase 2 sheds armour, +speed, +fire spread.
8. The Hollow King: shape-shifts through earlier bosses' signature attacks one per phase (remix), final phase combines two at once. Rewards the player for having learnt the earlier chapters; final enrage drains XP gems.

### Mini-boss / elite cadence (OPINION, informed by Brotato 1-3 elite/horde waves per 20 and HoT timed mini-bosses)
- Elite at 4:00 and 8:00 plus optionally 12:00; mini-boss at 7:30; boss 10:00; post-boss: elite every 90s.
- Elite = one new mechanic, ~15-25x wolf HP, 1.5-2x radius, outline glow. Mini-boss = ~40-60x wolf HP, 2-3 attacks with telegraph.

## 3. Implementation guidance (data-driven JS sim)

Behaviour 'verbs' as data in enemies.json, e.g.
```json
"dire_wolf": { "...base stats...", "elite": true,
  "behaviour": [ {"verb":"chase"},
                 {"verb":"charge","windup":0.7,"speedMul":3,"cd":8,"range":220,"tell":"line"},
                 {"verb":"summon","enemy":"wolf","count":4,"cd":15} ] }
```
Sim loop: for each enemy, iterate its verb list; each verb has a small stateful handler `{update(e,dt,sim)}` stored in a table in `src/sim/behaviours.js`. Enemies keep a pooled `state` object (timer, phase) to avoid allocation. Telegraphs are sim "hazard" entities: `{x,y,r,t0,t1,dmg,kind}` that the renderer draws as a filling circle; they damage on `t1`. Same hazard entity serves boss attacks, suiciders and chapter hazards (single reusable system).

Performance (200-300 enemies): swarr-style design (typed-array pools, uniform grid rebuilt per tick, no per-frame allocation, 2000+ enemies ~2ms logic) shows 300 is easy in JS (COMMUNITY, https://github.com/brac/swarmr). Cap at ~300 (Brotato caps at 100, COMMUNITY); use existing `src/sim/grid.js` for separation and weapon queries; run expensive verbs (ranged targeting, healer search) every N ticks staggered by id%N; only the verbs of the nearest ~60 enemies need full AI, far swarmers can just chase.

Order of work (S small <half day, M ~1-2 days, L several days, for a solo non-pro; OPINION):
| # | Item | Effort |
|---|---|---|
| 1 | Add stat-variant enemies (rot_hound, elites as bigger/tougher wolf with glow outline) + `elite` flag, name banner, heart drop | S |
| 2 | Hazard entity + telegraph rendering (circle fill) + tests | M |
| 3 | Verb system refactor (chase, charge) + dire_wolf elite | M |
| 4 | `ranged` verb + projectile entity (enemy shots) | M |
| 5 | `suicide` verb (fuse + hazard) | S |
| 6 | `summon`, `heal` (aura/tether) verbs | M |
| 7 | New wave formations (ring, wall with gap) in event system | S-M |
| 8 | Boss phase table in chapters.json (hp thresholds -> verb set swap, arena effects, soft enrage) | L |
| 9 | Treant 3-phase using the above + bot retune of HP | M |
| 10 | Chapter template + 2nd chapter content (data first, new hazards each chapter) | L per chapter |
| 11 | Mini-boss chest reward | parked per CLAUDE.md, ask Matt |
Check bot: `node scripts/bot.mjs` to verify kill times and that unfocused bots sometimes lose.

## 4. Balance numbers (sources)
| Number | Label | Source |
|---|---|---|
| Brotato elite base HP 700-750 (+750/wave listed on individual elite pages, i.e. ~scales hugely); chaser baby alien 3 (+2/wave): elite roughly 100-250x a basic chaser at similar wave | COMMUNITY | https://brotato.wiki.spellsandguns.com/Enemies , /Butcher , /Rhino |
| Brotato bosses 29,250 base HP, contact 30 dmg, projectile 23, wave 20; Danger 5: 75% HP then +40% | COMMUNITY | https://brotato.wiki.spellsandguns.com/Enemies |
| Brotato Danger 3/4/5: +12/26/40% enemy HP and damage | COMMUNITY | https://brotato.wiki.spellsandguns.com/Enemies |
| Brotato elite/horde frequency: 0 / 1 / 3 per run by danger | COMMUNITY | https://brotato.wiki.spellsandguns.com/Elite_Wave |
| VS: boss HP often "HP x player level at spawn", ~1 wave per minute, boss at 25:00 in a 30 min run, hyper mode raises spawn minimums and speed | COMMUNITY | https://vampire.survivors.wiki/w/Boss , https://rogueranker.com/vampire-survivors-stages/ |
| Proposed Hollowlight: elite 15-25x wolf HP; mini-boss 40-60x; boss kill time 60-120s; elite cadence 4:00/8:00; telegraph 0.7-1.2s | OPINION | this doc |
No datamined figures were found for Halls of Torment, HoloCure, Death Must Die, Soulstone Survivors or Spirit Hunters; verify in-game if you need them.
