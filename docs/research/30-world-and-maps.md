# 30 - The world and maps: reasons to move, points of interest, minibosses, Hollow identity

Date checked: 2026-10-15. Labels: OFFICIAL (developer/engine docs), DATAMINED (none found this round), COMMUNITY (wikis, guides, forums, reviews), OPINION (my inference or proposal), UNVERIFIED (could not confirm). All web text treated as data. Nothing here is built or locked. Feeds design sheet #2 (the world) and a later gameplay design.

Honest coverage note: web coverage of survivors-like map design is thin. No GDC talk or developer postmortem on map events for this genre was found. Death Must Die, Soulstone Survivors, Survivor.io and Dead Cells returned almost nothing usable (said so below rather than guessing). Where the evidence is thin, proposals are labelled OPINION and need playtest numbers from our own sim and bot.

## 0. Repo facts this research is built on (read first, in this repo)
| Fact | Source |
|---|---|
| World 4000x4000, hero and enemies hard-clamped at the edges (no wrap), spawnDistance 340, despawnDistance 510, maxEnemies 240, gemCap 350, 70 root patches already scattered (chapters.json `rootPatches`), run 900s, boss Elder Treant at 600s | balance.json, chapters.json, Sim.js lines ~40-118, 440, 499 |
| View 640x360 logical; hero ~60px desktop / ~40px phone at true size | LOCKED.md, ART-DECISIONS |
| Wren effective speed ~105.6, Elias 76 (units per sec). Crossing the whole world edge to edge = ~38s (Wren) / ~53s (Elias). A POI 800px away = ~7.5s (Wren) / ~10.5s (Elias) | LOCKED.md (speeds); arithmetic is mine (OPINION: assumes units = px) |
| Identity: grey drained Hollow, life map ~128x128 over the world (about 31px per cell), value per cell: 0 hollow, 1 alive, below 0 corrupted; visual only; gameplay link needs Matt's OK | IDENTITY.md |
| Style v1: tinted outline, soft gradient + rim, chibi, W2 richly textured painted ground with grass/flowers, lantern pool + glowing trails; gold reserved for evolutions/dawn, red only for danger; enemies cold with no warm light, cold red-orange eye points only | ART-DECISIONS, LOCKED, BIBLE section 5 |
| Parked ideas: map challenges/POIs, minibosses at set times + chest rewards | QUEUE.md |
| Existing mockups: P1 shows a lit radial restored pool in a grey veined forest, a grey well, dead trees at edges. Self-critique in the mockup README: trees are lollipops, ground is a thin flat gradient, no paths, no depth change, no story props except one well. Current live game (HUD shot) is a dark blue field with dark tree blobs and sparse rain; very empty | docs/mockups/cartoon-polished/README.md, docs/screenshots/hud1/desk-2 |
| Bible has Grey Alpha elite (howl + charge) and Briar Mother mini-boss (root pulses, drops Blightbulbs, circular thicket of veins) for Chapter 1; both already designed, neither built | BIBLE.md section 5 |
| Performance budgets from the request: sprites <= 600, draw calls <= 25 | task brief |

Key arithmetic insight (OPINION): at ~38s edge to edge the world is small in time terms. Matt's "no reason to move far" is partly because enemies come to you at 340px and everything you need (XP gems) arrives with them. Anything that is NOT delivered to the player is a reason to move.

## 1. How comparable games make maps matter (evidence)
| Game | What the map does | Evidence | Label | URL |
|---|---|---|---|---|
| Vampire Survivors, Mad Forest | Open layout, few obstacles. Only destructibles are braziers (light sources); breaking one drops a random pickup. Brazier spawn chance 10% (up to 50% with Luck), cap 10 on screen. Hazards: a ring of Flower Walls closing in; swarms sweeping across in lines; a Reaper from 30:00. Stage-specific items on the floor. Bosses at fixed times (10:00, 11:00, 15:00, 20:00, 24-25:00), time limit 30:00. No exact map size on the page; wrap-around: not covered (UNVERIFIED). A forum reply says most maps are endless and a few are finite/designed | wiki pages | COMMUNITY | https://vampire.survivors.wiki/w/Mad_Forest , https://steamcommunity.com/app/1794680/discussions/0/3734079155589491092 |
| Vampire Survivors, Inlaid Library | Long hallway, shelves block up/down, enemies only from east/west ends. Relic hunting: "follow the green arrow" to a map item. Shows a stage can be defined by layout + one fetch target | wiki + guide | COMMUNITY | https://vampire.survivors.wiki/w/Inlaid_Library |
| Vampire Survivors, Dairy Plant | Large industrial obstacles; players report open stages make finding floor items slower | wiki + forum | COMMUNITY | https://vampire.survivors.wiki/w/Dairy_plant |
| Vampire Survivors pickups | Floor Chicken heals 30 HP, drops from light sources, chance scaled by Luck. Treasure chests drop from bosses (not light sources). Contents: usually a level-up of an owned item, evolution when requirements are met (typically from bosses after 10:00); coin chests 1/3/5 items about 100-200 / 300-600 / 500-1000 coins at base. Each boss has its own tier odds, e.g. Mad Forest Silver Bat 3% for 5 items, 10% for 3, 50% for 1. Luck only raises chest quality, not whether it drops | wiki | COMMUNITY | https://vampire.survivors.wiki/w/Floor_Chicken , https://vampire.survivors.wiki/w/Treasure_Chest |
| Halls of Torment | Stage 1 blood-trail event: an altar at a crossroads (optional lore book) with two blood trails (spotty, not evenly spaced) leading to two shrines; kill enemies inside purple circles, kill count shown over the shrine; finish both for a Token of Pain that cuts the stage boss's HP (reports say roughly halves it, UNVERIFIED). Event exists only in Stage 1. Chests and ability scrolls kept on the floor give half a level each at run end (player report). Reviewers praise timed mini-bosses with telegraphed moves | forum + guide + reviews | COMMUNITY | https://steamcommunity.com/app/2218750/discussions/5/7179373038239950353 , https://www.gamezebo.com/walkthroughs/halls-of-torment-blood-trail/ , https://fullcleared.com/features/halls-of-torment-first-impressions/ |
| Megabonk (3D survivor-like; useful because it is built around map interactables) | Charge Shrine: stand in a circle a few seconds, leaving resets the charge, then pick 1 of 3 stat boosts (rare golden = legendary). Challenge Shrine: summons a group of enemies marked with a purple icon; kill them all, get a chest. Bloody/Greed shrines add an extra boss or +5% difficulty (risk for reward). Chests cost gold with a price that climbs per chest (first about 30); gold/boss chests free. Green diamonds on the map help locate shrines. Shrine count differs between guides (7 vs 8) | fan guides | COMMUNITY | https://selphie1999gaming.com/game-guides/megabonk/megabonk-shrines-what-they-are-and-how-they-work/ , https://deltiasgaming.com/?p=355916 |
| 20 Minutes Till Dawn | Three maps (Forest, Temple, Pumpkin Patch), Temple unlocked by surviving Forest 20 min. "Easy" bosses (Elder, 1000 HP, melee only) drop a chest with a character-specific upgrade and 36 XP. Mysterious Trees are 45,000 HP map props: killing one makes all the others uproot and chase you, and a secret boss spawns at the end per tree killed (a risk-reward trap object) | wikis | COMMUNITY | https://20-minutes-till-dawn.fandom.com/wiki/Mysterious_Tree , https://20minutestilldawn.wiki.gg/wiki/Bosses |
| Brotato | Fixed single-screen arena. Trees on the map are small destructible resource nodes (10 HP wave 1, +5 per wave; 20% chance to drop a crate, else fruit that heals). Each crate dropped in a wave lowers the next one's chance (halved after one, a third after two). Elite = one per elite wave, drops a legendary crate (guaranteed tier-4 item) and heals 100 HP, only on Danger 2+. A reviewer credits timed waves with preventing aimless circling in open-map survivors-likes | wiki + review | COMMUNITY / OPINION | https://brotato.wiki.spellsandguns.com/Crate , https://brotato.wiki.spellsandguns.com/Enemies |
| HoloCure, Grassy Plains | Timed mini-bosses at 2:00 (600 HP), 6:00 (2,500 HP), 15:00 (7,500 HP), stage boss after 10:00, a "siege" event around 16:25 (version 0.5/0.6; may have changed). Map chest/treasure details not found (UNVERIFIED) | guide | COMMUNITY | https://samurai-gamers.com/holocure/stage-1-grassy-plains-enemy-list/ |
| Soulstone Survivors | Only seasonal event maps found (boss kills inside sigils in order, egg delivery quest). Standard-map shrines/chests: not found (UNVERIFIED) | guides | COMMUNITY | https://gamepretty.com/soulstone-survivors-winterfall-holiday-event-guide-bumbles-lair-seasonal-skills-and-hidden-achievements/ |
| Death Must Die | Store pages mention shrines, god blessings and guardians per circle; no usable mechanics found | store/forum | COMMUNITY | https://steamcommunity.com/app/2334730/discussions/0/4358997447065938138 |
| Diablo 4 (action RPG, not a survivors-like) | Shrines give a short buff (about 30s, plus a speed boost) and the buff icon tells you which you get before clicking; Lunar Greed Shrine summons a Treasure Goblin at kill thresholds (25, 50). Helltide: time-boxed zone event, currency expires with the hour so early entry is rewarded (timing sources conflict) | guides | COMMUNITY | https://gamespot.com/articles/all-shrine-buffs-in-diablo-4/1100-6514750/ , https://primagames.com/tips/diablo-4-helltide-timer-explained |
| Survivor.io, Dead Cells, Hades | No usable map-event mechanics found in searches (UNVERIFIED). Do not cite | - | - | - |
| Achilles: Survivor | Fixed build points on the map that give protection/support; reviewer notes the fixed points limit their strategic value | preview | COMMUNITY | https://godisageek.com/?p=302293 |
| Deep Rock Galactic: Survivor | Run = a series of objectives then extraction, giving movement purpose | review (secondhand) | COMMUNITY | https://rogueranker.com/bullet-heaven-vs-bullet-hell/ (search summary only; UNVERIFIED) |

### Patterns that recur (OPINION, supported by the rows above)
1. Rewards that are not carried to you are what makes the player travel: destructible props that drop pickups (VS braziers), shrines/altars with a stay-here or kill-here task (HoT, Megabonk), fetch items marked with an arrow (VS library relic).
2. Risk is usually one of: stand still in a circle (charge shrine), summon a marked group (challenge shrine), raise difficulty on purpose (greed/bloody shrines), or a trap prop (20MTD trees).
3. Rewards are almost always a CHOICE of small stat/option, a chest, or a boss-weakening token, not raw power. Chests are the standard big-reward container and use tier odds + a fallback so the floor is always useful.
4. Time-anchored mini-bosses with visible names are the genre's pacing spine (HoloCure 2/6/15 min, VS 10-minute spacing, HoT timed minis).
5. Anti-chore devices seen: optional (HoT lore book), rewards that expire or are time-boxed (Helltide), a pity/diminishing chance on crates (Brotato halving), buff icon shown up front (D4).

## 2. Event and challenge design patterns (with bounded numbers)
Numbers below that are not in a cited row are OPINION proposals for our balance, to be validated with `scripts/bot.mjs` (event reward share of total XP/power) before building.

### Pattern catalogue
| Pattern | How it plays | Pull across map | Risk | Typical reward | Anti-chore note | Phone-friendly? |
|---|---|---|---|---|---|---|
| Hold a zone (charge shrine) | Stand in a circle N seconds; leaving pauses or resets | Strong (destination) | Enemies keep coming while you stand | Pick 1 of 3 small boons (Megabonk) | Forgiving: pause not reset; short (6-10s) | Yes: no new input |
| Kill-a-marked-elite | Marked enemy with a named banner | Medium (it comes to you or waits at a place) | Elite hits harder | Chest / heart | Place it at a POI so it is a trip, not a pop-up | Yes |
| Timed wave at a place | Interact, survive a wave, bounded timer | Strong | Spawn pressure | Chest or Blessing | Timer visible; failing costs only the reward | Yes |
| Lantern-lighting / relight (ours) | Touch N lanterns/wells within a time or just hold each briefly; each lit one restores colour | Strong, and chains across the map | Low per step; exposure while travelling | Small XP burst per lit, bigger bonus for the set | Cap sets to 3 per run; chain markers | Yes (walk-in) |
| Destroy nests | Break spawner props; each stops a stream | Medium | Spawners are guarded | Hearts, XP | Only if spawners genuinely reduce density | Yes |
| Curse / greed shrine | Opt in to extra difficulty for better rewards (Megabonk +5% diff, D4 greed goblin) | Strong for skilled players | Self-chosen | Better chest tier | Must be optional and clearly labelled | Yes |
| Treasure goblin (fleeing carrier) | Fast fleeing enemy that drops loot if caught | Strong (chase) | Time wasted if not caught | Gold/XP burst | Fleeing speed < player speed so catching is guaranteed with effort; despawns after ~15-20s | Yes but can pull player away from safety; cap 1 alive |
| Boss/miniboss chest | Guaranteed container from set-time boss | Time-anchored | The fight | Tiered chest (VS odds model) | Always a useful floor reward | Yes |
| Escort | Guard a NPC while it walks | Strong | Fail state | Reward | Escorts are widely disliked in action games (OPINION); skip | Poor |
| Destructible prop drops | Break lamps/barrels for pickups | Constant low pull | None | Heart/magnet/gold chance (VS: 10% spawn, cap 10 on screen) | The cheapest "move around" driver; no UI needed | Yes |

### Reward bounding (OPINION, with the genre examples above)
- Total event reward share target: events together give roughly 8-12% of a run's XP and about 1 Blessing-equivalent power per 3 events, never a direct damage multiplier above what a Blessing already is (existing caps in docs/design/blessings-review.md). Validate with the bot: remove events and check win rate drops by <= 5 percentage points; that is the same "modest share" rule as in CLAUDE.md ability principle.
- Always a floor: if the table rolls an unusable reward (all weapons maxed), fall back to gold/heart/XP (VS fallback pattern).
- Pity/diminishing (Brotato crate halving) so luck cannot stack three chests in a minute.
- Chest tier odds are the right model to copy: the Vampire Survivors per-boss odds table (rare big chest, common small chest, small always the fallback).
- No event rewards a stat that the skill tree gates (evolution recipes, locked weapons) so the progression-gates design is not bypassed. A chest may advance an evolution only by giving the missing stat rank (hidden-recipe rule stays).
- No event may give something that scales with time spent standing still beyond its cap.

### Telegraphing for phones (OPINION from the indicator sources)
- One edge-of-screen arrow per active objective, placed where the line to the target crosses the screen border, rotated toward it; show a distance in metres/steps; hide when on-screen. Known trap: targets behind or on the far side of the camera cause arrows to jump or vanish, test it. Source: https://code.tutsplus.com/positioning-on-screen-indicators-to-point-to-off-screen-targets--gamedev-6644t (COMMUNITY tutorial), https://docs.hutonggames.com/guides/ui-widgets/target-managers/offscreen-indicator/ (engine plugin docs).
- Open worlds have no single "next" objective; a single compass pointer can mislead (forum), so use a tiny minimap/rose plus at most 1-2 arrows (nearest event, current timed event). Source: https://gog.com/forum/general/minimap_or_smart_compass_which_do_you_prefer/page1 (COMMUNITY, weak).
- Compass must stay legible at a glance during action: big enough marks, few of them (https://001.arktimes.com/?p=21438, COMMUNITY opinion, weak).
- Our HUD budget (12/14/16% of screen) is locked; the arrow lives on the screen edge outside it and fades after discovery.

### Spawn placement rules (OPINION)
- POIs never spawn within 700px of the hero start or of each other (min 600px between POIs), never within 250px of the world edge, never inside tree-dense cells.
- Event enemies spawn from the screen edge at spawnDistance 340 like normal swarm events, never ON the hero; fair-spawn rule: no spawn inside 300px of the hero (a 2-second dodge window at Wren speed).
- Events respect maxEnemies 240: event enemies count toward the cap, and an event may only start if live enemies < 200 (so it cannot trigger a wall-to-wall screen), otherwise it waits up to 10s, then skips.
- Do not start an event within 20s before a scheduled swarm (chapters.json events at 60/150/240/300/360/450/540/600/660) or the boss, and do not start two at once.
- Fast-kill weapons (Chain Lightning, evolved wolves) make "kill N" objectives trivial: use time-held or marked-elite objectives, or scale counts by the hero's measured kill rate. Cheap fix: kill-count objectives count only "marked" enemies the event spawns itself (Megabonk purple-icon pattern).

### Cadence per 15-minute run (OPINION; see section 5)
Evidence anchors: HoloCure has 3 minibosses in its first ~15 min; Brotato 0-3 elite/horde waves per 20; VS bosses spaced ~5 min in the first 15; HoT stage 1 has a few shrines and one boss. Proposed: about 5-6 optional events + 3 minibosses + the Treant. That is roughly one beat every ~90s (ours has swarm events every 60-90s already), so events must be sparse and optional.

## 3. Map generation and layout for a 4000x4000 field
### Authored vs procedural (OPINION, evidence thin)
| Option | Pros | Cons | Fit |
|---|---|---|---|
| A. Fully authored fixed map | Predictable art quality; hand-tuned POI placement; screenshots look designed; easy to bot-test | Memorised after a few runs; replay value rests on builds | Good for Chapter 1; fits "painted storybook" look |
| B. Seeded semi-procedural: authored zones + landmark slots filled per seed (our Sim has seeded RNG, mulberry32) | Variety with controlled quality; POIs placed by rules above; bot-testable by seed | More work; risk of ugly combinations | Recommended |
| C. Fully procedural noise/tile world | Maximum variety | Looks generic; hard to make landmarks meaningful; tuning cost | Reject for v1 |
VS "endless vs finite" is a mix, and a community reply says most are endless (UNVERIFIED, forum). We are finite 4000x4000 with hard walls, which is simpler and cheaper.

### Zones and biomes (OPINION)
4000 units is ~38s corner to corner. Use a 3x3 coarse grid of regions (about 1333 units each) rather than many tiny biomes. Proposal in section 5. Different enemy mixes by zone is cheap in data (waves already have `enemy`, `rate`): add optional `zone` weights so wolves favour open meadow, crows favour dead groves, root crawlers favour the root thicket. Risk: players learn to camp in a "safe" zone, so keep mixes overlapping and keep total density the same.

### Ground, props, cost on phones
| Topic | Finding | Label |
|---|---|---|
| Ground texture | Phaser guidance: do not make a TileSprite bigger than the canvas; use a screen-size TileSprite scrolled by tilePosition. One report: 4800x270 TileSprite rendered black on some mobile browsers; another: a TileSprite lost its WebGL context at 1920x1080 on a low-end Android phone | OFFICIAL doc (https://docs.phaser.io/phaser/concepts/gameobjects/tile-sprite) + COMMUNITY (https://phaser.discourse.group/t/tilesprite-not-displaying-on-mobile-browsers/6799) |
| Tilemaps | Static tilemap layers sit in GPU memory and render in one draw call; culling is on by default; a 20,000px masked map ran ~20 FPS on a Nexus 5 until split into <=1000x1000 pieces toggled by visibility (2014-2018 sources, check against current Phaser) | OFFICIAL docs + COMMUNITY (https://www.html5gamedevs.com/topic/10059-large-tilemap-performance-insights/) |
| Our path | Ground = a few baked chunk textures or one screen-size procedural layer with 8-12 hand-authored tiles + decals; blotchiness comes from low-frequency single noise, so use two noise scales + a hand-placed decal pass (OPINION, matches the mockup README call for "a painted ground tile set (8-12 tiles) beats code noise") | OPINION |
| Props | Pool everything; one atlas so sprites batch; target live sprites <= 600 total. Our existing research notes ~500-800 on mobile (docs/research/06). Budget for the world: <= 120 prop sprites alive at once (cull by camera rect + margin), at most ~6 distinct prop atlas frames per type, shared grey+colour variants swapped by life-map sample | OPINION based on repo research 06 |
| Draw calls <= 25 | Ground 1, props batch 2-3, enemies 2-3, spirits/glows additive 2, particles 2, life-map overlay 1, fog/vignette 1-2, HUD is DOM (not counted). Healthy | OPINION |
| Parallax | One or two far-layer sprites (distant grey tree line, mist) scrolling at 0.3-0.6; cheap. Fog bands as 2 additive sprites | OPINION |
| Edge of map | Hard clamp exists. Make the edge read as an edge: dense dead-tree wall plus a heavier vignette and low fog, with a tiny "the Hollow is deeper here" cue, so players do not push against an invisible wall. Wrap-around rejected: it breaks landmark/POI direction and the life map | OPINION |
| Minimap needs | World is 4000 units: a corner minimap (about 90x90 px desktop, hide or shrink on phone) showing hero, POIs discovered, the life-map coloured as soft fill (free, same texture), boss/miniboss ping. Fog-of-war on the minimap (undiscovered POIs hidden) makes exploring itself a reward | OPINION |
| Life-map cost | One 128x128 texture upload per N frames (IDENTITY.md says one small texture + one blend pass). Present in repo (src/gfx/lightmap.js) | repo |

### Landmarks and paths
Landmarks must be seen from afar to pull the player: tall silhouettes (a lone giant tree, a chapel spire) visible past the 640x360 view when within about 400-500 units. Paths (worn trails between POIs) are the cheapest "go this way" cue: a few decal strips, no gameplay. Both OPINION.

## 4. Environmental storytelling and the world that reacts
### How games show progress on the map
Okami restores colour and life as a local, immediate, persistent action: sickly patches bloom into vibrant growth; doing enough restores whole regions; completing a guardian tree restores a whole region; NPCs and wildlife react (COMMUNITY reviews, https://www.pcgamer.com/au/why-i-love-restoring-nature-in-okami). Lessons (OPINION): (1) restoration must be an instant, readable pop, (2) progress is visible in the landscape not a menu, (3) a region has a completing object (here: the Briar Mother, the Elder Treant), (4) the player-driven fix should be the same tool as the fighting verb (our spirits walking = restoring, already the Hollow rule).

### Our life-map options
| Option | What it is | Cost | Pros | Cons |
|---|---|---|---|---|
| V0 Pure visual (as locked) | Light adds life, enemies add corruption; ground/props/trees shaded by the map; trails fade | Low, already designed | Zero balance risk; strong identity; no approval needed | Players may feel it is decoration |
| V1 POIs write to the map in a big way | A POI completion floods a large soft-edged region with permanent colour for the run (and a dawn-time memory) | Low | Gives POIs a visual payoff worth travelling for; hero lantern leaves colour behind; map becomes a mural ("save the night" screenshot from the bible) | Still visual only |
| G1 (needs Matt's OK) Restored ground heals | Standing on life above a threshold gives small regen | Medium | Makes restoring matter mechanically | Can create "stand still" camping; fights the always-moving feel; bible recommends visual for v1 with a test later (BIBLE open question 3) |
| G2 (needs Matt's OK) Corruption debuff | Standing on corrupted ground slows or damages | Medium | Makes enemy corruption threatening and readable | Overlaps root patches (70 existing hazards); feels unfair on phones if veins are hard to see; "red only for danger" colour rule helps but cost is cognitive load |
| G3 (needs Matt's OK) Restored places stay safe-ish | Lit POIs repel the Hollow (smaller spawn density inside) | Medium | Gives player a reason to bring fights back; natural zone control | Camping and easy-mode loophole; interacts with swarm density rules |
Recommendation (OPINION): ship V0 + V1, test G1 only as a tiny, capped bonus after Matt asks, because the gameplay link needs his approval and the bot has not been run for it.

### Reading the screen (pure visual, cheap)
- Hollow ground: desaturated blue-grey, low-contrast, veins visible but not busy. Restored: warm green/gold, flowers, light grass. Corrupted: darker cracked veins, never red.
- Boundary rule from the mockup: a thin warm glow along the edge of restored areas (reads as "light eating dark" in one glance).
- Props come in a grey variant and a coloured variant (README suggests 4 variants per prop); swap by sampling the life map at the prop.
- Cleansed POIs keep a small lasting glow so the player can see what they already did (reduces "did I do that one?").
- Dawn (victory) floods colour from the screen edge (BIBLE section 2 point 3).

## 5. Hollowlight proposals: Chapter 1 Cursed Forest
All proposals are OPINION and need Matt's approval; they follow Style v1 (tinted outline, soft gradient, chibi-friendly rounded shapes, lantern light). Rewards are bounded by section 2 rules. Colour rule: only the hero/spirits/lanterns are warm; POIs are "waiting to be lit": grey with a single ember of potential warmth, brighter when you arrive.

### Landmark/POI types (10)
| # | POI | Looks like (Style v1) | Interaction | Reward (bounded) | Risk | Spawn rule | Hollow fit |
|---|---|---|---|---|---|---|---|
| 1 | Grey Well | Mossy stone well, half-raised bucket (bible detail), a faint ember at the bottom; the mockup already has one | Walk in and hold ~4s inside a ring; ring shows a soft arc fill | Floods a large area with colour; bursts a heal heart + modest XP (about 1 level's worth early, scaled) | Enemies keep spawning during the hold; leaving pauses (not resets) the arc | 3-4 wells per map, min 800 apart | Direct restore verb (Okami lesson) |
| 2 | Lantern Shrine (relight) | Cold lantern on a post; Elias-style light spills when lit | Touch to light (instant). Lighting 3 of the 5 on the map within a minute grants the set bonus | Each: small gem burst; set: a Blessing card choice | Travel between lanterns is the risk; no fail | 5 per map, set check at 3 | Light restores colour in a chain |
| 3 | Wolf Den | Grey cave-mouth/hollow log with sleeping grey pups (bible detail) | Walk in; pups wake in colour and trot off (visual); den spawns a small Hollow Wolf pack once | Pack kill grants a heart + gold; surviving it recolours the den area | One pack of 8-12 wolves at the den | 2 per map, in the meadow zone | Wren's heart beat: kin of the pack |
| 4 | Hollow Nest | Root-knot mound pulsing with a cold light | Kill it (it has HP, shown as a ring) while it spawns crawlers/crows | Stops the stream; drops XP + 1 heart | Guarded spawner | 2 per map, in the dead-grove zone | Corruption source removed |
| 5 | Dead Grove | Cluster of bare grey trees ringed by veins, one with a faint "memory of green" | Walk through the ring; a charge-shrine style stand 6s | Pick 1 of 3 small boons (Megabonk charge-shrine pattern) | Corruption ring around it; standing still | 2 per map | Hollowed trees come back to leaf |
| 6 | Ruined Chapel | Small broken chapel, spire visible from far (landmark), an unlit candle wheel inside | Enter, light the candle wheel (hold 5s); a bell tolls | Chest (see below) + big colour flood; once per run | Tolling bell wakes a heavier wave (elite) | 1 per map, far from start (more than 1500 units) | The Hollow's face in Ch1: drained place of grief; also teases later chapters |
| 7 | Firefly Swarm | Cloud of cold motes drifting through the forest | Walk into it; it follows you for 20s, pulling gems to you (visual + small gem magnetism) | Mini magnet effect + glow | Wanders; none | 2-3 per map, slow drift | Spirit light looking for company |
| 8 | Wisp Lure (greed shrine) | Cracked lantern with a hungry grey flame | Opt in: more enemies for 45s in exchange for a higher chest tier | Bigger chest odds | Self-chosen difficulty | 1 per map, optional | Risk/reward for experts (Megabonk/D4 pattern) |
| 9 | Briar Mother (miniboss) | Walking briar cottage with a hollow doorway mouth (bible) | Kill; root pulses with circle telegraphs, drops Blightbulbs | Chest | The fight | 1 at about 5:30-6:00, spawns at the ruined chapel region | Bible mini-boss; thicket of veins spreads, killing it restores a big circle |
| 10 | Grey Alpha (elite) | 2x wolf, mane of dead branches, pale outline | Howl summons wolves; 0.7s line telegraph charge (bible) | Chest + heart | Pack + charge | At about 3:00 and 8:00 (research 10 suggests 4:00/8:00) | Wren's rival pack leader |

Optional extras: Treasure Wisp (a fleeing grey wisp that drops gold/gems when caught, slower than the hero, despawns after 15-20s) and destructible Lamp Posts/mushrooms that drop a heart or gold (VS braziers pattern: 10% spawn chance, cap 10 on screen as a starting point to tune). OPINION. Both are cheap and need no UI.

### Chest rewards (bounded; interacts with gates and Blessings)
Tiered like the Vampire Survivors model (small always possible, big rare), opened by walking onto it:
| Tier | Contents | Odds idea (OPINION) |
|---|---|---|
| Small (default) | 3 XP burst + gold + a heart (floor) | 100% fallback |
| Medium | +1 stat rank on a weapon the hero owns (not past max; no gated weapon) or a Blessing card choice | Grey Alpha ~35%, Briar Mother ~60% |
| Large | Blessing choice of 3 plus the medium reward, or an evolution-completing stat rank | Briar Mother / chapel 15-25% |
A chest never gives a new weapon the tree has not unlocked and never names an evolution (hidden-recipe rule). Total expected chest power over a run must be validated by the bot against the Blessing caps.

### Map layout sketch (text; 4000x4000, N up)
```
+-------------------+-------------------+-------------------+
| NW Dead Grove     | N Meadow Run      | NE Root Thicket   |
| nest, grove, fog  | open, firefly,    | root crawlers,    |
|                   | wolf den          | nest, thorn dens  |
+-------------------+-------------------+-------------------+
| W Mossy Hollow    | CENTRE Start      | E Old Road        |
| grey wells, lamps | clearing, small   | lantern shrines   |
|                   | grey well ~900    | along a worn path |
+-------------------+-------------------+-------------------+
| SW Graves/Mire    | S Meadow          | SE RUINED CHAPEL  |
| wolf den, grove   | open, firefly     | big landmark,     |
|                   |                   | candle wheel      |
+-------------------+-------------------+-------------------+
```
- Start at the centre with a lit lantern clearing (coloured pool, "your" light).
- Density (OPINION): about 14-18 POIs total, 4-5 close to start (500-900 away, tutorial-safe), 6-8 mid, 3-4 far (1500+), chapel in the far SE corner. Props about 1 prop per 100x100 cell, double in dead groves, half in meadows.
- Landmarks: the chapel spire and one gigantic dead tree (the Elder Treant's hint) visible from afar.
- Edges: dense dead-tree wall plus fog, no POIs within 250 units.
- Different enemy mixes by zone: wolves in meadows/den zones, crows over groves, root crawlers in the thicket (all overlapping).
- A visible path (worn trail) leads from start toward the chapel, with lanterns and wells along it so there is a "guided route" for new players and free exploration for others.

### Cadence timeline for a 15-minute run (OPINION; existing swarms at 60/150/240/300/360/450/540/600/660 are left alone)
| Time | Beat | Notes |
|---|---|---|
| 0:00-1:00 | Quiet start; first POI visible within 500-900 units (grey well) | Teach the interact verb, no pressure |
| ~1:30 | First lantern/event optional | Gives first early Blessing-ish choice only after set |
| ~3:00 | Grey Alpha (elite) + small chest, banner "The old alpha stirs" | Visible countdown chip from 2:30 |
| 4:00-5:00 | Dead Grove / Wolf Den optional events open | Bounded |
| ~6:00 | Briar Mother (miniboss) near the chapel zone, medium-large chest | Counts as the big mid-run beat |
| 7:00-9:00 | Lantern set / chapel (large chest) available; Wisp Lure optional | Heavier events when player is stronger |
| ~8:30 | Grey Alpha 2 (elite, pack larger) | Pre-boss test |
| 10:00 | Elder Treant (existing, unchanged) | boss wins a final colour flood |
| 10:00-15:00 | Post-boss: optional events continue; an elite every ~90s (from research 10) | Keep light |
Totals: about 6 optional events, 3 timed enemies (2 elites + 1 miniboss), plus the boss. Events never fire within 20s of a scheduled swarm.

### UI needs (short)
- Objective chip: tiny pill near the HUD (e.g. "Grey well: 8s") only while an event is active; auto-hide when done.
- Edge arrow for the nearest active/optional event and the timed enemy (name banner ping when it spawns); discovered POIs on the minimap only.
- Miniboss countdown visible from 30s before (design sheet #4/#7).
- Do not add a quest list. Keep the lantern/thread/moon HUD as locked.

### Risk list
| Risk | Why | Mitigation |
|---|---|---|
| Chore feel | Players feel forced to detour | Events optional; no failure penalty beyond missed reward; ~6 per run |
| Power creep | Chests stack with Blessings | Caps, bot ablation, chest floor tiers |
| Camping/standing-still strategies | Hold zones reward not moving | Pause-not-reset, short holds, enemies keep spawning |
| Phone readability | Small screen, thumb occlusion | Few markers, large rings, edge arrows, no extra input |
| Busy screen | Props + enemies + gems + trails | Cull and budget props (<=120 live), grey props low contrast, gold reserved |
| Perf | Life-map + props + fog | One texture, pooled props, atlas, test on a real phone (not yet done) |
| Hard 240 cap + events | Event spawns blocked | Start only under 200 live enemies |
| Chapel far corner is never visited | Long trip for little | Make it visible, chest large, trail leads there |
| Style drift | Props arrive from generic packs | Author props in code per BIBLE/ART rules (unique silhouettes), only generic filler for background |
| Over-scoping | This is a lot | Phase it (below); POIs are parked until Matt approves |

### Suggested build phasing (OPINION, after approval; one chunk at a time)
1. World look only (ground, props, life-map, edge). 2. Destructible lamp props + Treasure Wisp (cheapest pull to move). 3. Grey Well + lantern relight (first real POI) + objective chip/edge arrow. 4. Grey Alpha elite + chest. 5. Briar Mother + chest tiers. 6. Chapel and optional greed shrine.

## 6. DESIGN BRIEF for design sheet #2 (the world)
Goal: a Chapter 1 Cursed Forest that is not empty, shows the Hollow identity in one glance, and gives players reasons to cross the map, without any gameplay link unless Matt asks.

### Three directions to mock up (each shown at true size 60px desktop hero / 40px phone, plus full-screen)
1. GROUND / PROPS / HOLLOW vs RESTORED RENDERING. Options: (a) Painted storybook, grey with glowing restored pools; (b) richer coloured props with strong desaturation; (c) soft hand-drawn texture with hard-edged colour reveal. Show: start clearing, a restored well, dead grove, edge-of-map wall, corrupted veins near a nest, a grey vs coloured pair of the same tree, boundary glow, prop density (about 1 per 100x100 cell) and the sprite/draw-call budget annotated.
2. POI VISUAL LANGUAGE. One family of shapes: ring of light on the ground, a small ember when interactable, ring fill while holding, lasting glow after cleansing. Mock up the 10 POIs above in grey (idle), active, and cleansed, at 40px-phone hero scale, plus chest tiers.
3. MINIMAP / COMPASS. (a) Corner minimap with life-map fill and fog of war; (b) no minimap, edge arrows only; (c) compass strip. Show desktop and phone portrait, including the objective chip and a miniboss countdown, inside the locked HUD budget.

### True-size constraints
Hero 60px desktop / 40px phone (Elias 75/50); enemies cold with no warm light; gold reserved; red only for danger (also eye points). Interaction rings must read at 40px: ring thickness at least 3px, glow radius at least 24px, no text smaller than HUD minimums.

### Decisions Matt must make (max 5, with recommendations)
| # | Decision | Recommendation |
|---|---|---|
| 1 | Do optional map events + minibosses go ahead (parked ideas), and in which order? | Yes, phased as in section 5: cheap pulls first (lamps/wisp), then Grey Well + lanterns, then elites/chests |
| 2 | Map approach: authored zones with seeded landmark slots (B) vs fully fixed (A)? | B: seeded slots, bot-testable, more replay |
| 3 | Life-map: keep purely visual (V0+V1), or approve a small gameplay link (restored ground heals/guards)? | V0+V1 now; revisit a tiny capped link after playtest |
| 4 | Chest rewards: Blessing choice + stat rank (medium/large tiers, never gated weapons/evolution names)? | Yes with the floor fallback and bot validation |
| 5 | Minimap on phone: corner map, or edge arrows only? | Edge arrows + tiny optional minimap, test on a real phone |

## 7. Sources list (checked 2026-10-15)
- https://vampire.survivors.wiki/w/Mad_Forest , /Inlaid_Library , /Dairy_plant , /Treasure_Chest , /Floor_Chicken (COMMUNITY wiki)
- https://steamcommunity.com/app/1794680/discussions/0/3734079155589491092 (forum: most maps endless, a few finite)
- https://steamcommunity.com/app/2218750/discussions/5/7179373038239950353 , https://www.gamezebo.com/walkthroughs/halls-of-torment-blood-trail/ , https://fullcleared.com/features/halls-of-torment-first-impressions/ (Halls of Torment)
- https://selphie1999gaming.com/game-guides/megabonk/megabonk-shrines-what-they-are-and-how-they-work/ , https://deltiasgaming.com/?p=355916 (Megabonk shrines)
- https://20-minutes-till-dawn.fandom.com/wiki/Mysterious_Tree , https://20minutestilldawn.wiki.gg/wiki/Bosses
- https://brotato.wiki.spellsandguns.com/Crate , /Enemies
- https://samurai-gamers.com/holocure/stage-1-grassy-plains-enemy-list/
- https://gamespot.com/articles/all-shrine-buffs-in-diablo-4/1100-6514750/ , https://primagames.com/tips/diablo-4-helltide-timer-explained
- https://www.pcgamer.com/au/why-i-love-restoring-nature-in-okami
- https://docs.phaser.io/phaser/concepts/gameobjects/tile-sprite (OFFICIAL), https://phaser.discourse.group/t/tilesprite-not-displaying-on-mobile-browsers/6799 , https://www.html5gamedevs.com/topic/10059-large-tilemap-performance-insights/
- https://code.tutsplus.com/positioning-on-screen-indicators-to-point-to-off-screen-targets--gamedev-6644t , https://docs.hutonggames.com/guides/ui-widgets/target-managers/offscreen-indicator/
- https://godisageek.com/?p=302293 , https://rogueranker.com/bullet-heaven-vs-bullet-hell/ (weak/secondhand)
- Repo: docs/IDENTITY.md, BIBLE.md, ART-DECISIONS.md, LOCKED.md, QUEUE.md, DESIGN-SHEETS.md, research 06/10/16, mockups cartoon-polished and style-lab, screenshots hud1, src/data balance/chapters
Not found / UNVERIFIED: Vampire Survivors map size and wrap-around; any GDC/postmortem on survivors-like map design; Death Must Die, Soulstone Survivors (standard maps), Survivor.io, Dead Cells and Hades event mechanics; Halls of Torment elite details; HoloCure map chests. Research 17 (spike life-map findings) does not exist in docs/research (no file 17); life-map facts above come from IDENTITY.md, the mockup README and the existing src/gfx/lightmap.js.
