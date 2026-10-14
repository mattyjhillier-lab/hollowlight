# 19 - Spirit Hunters: Infinite Horde (SH:IH) reference

Checked 2026-10-14. Read-only web research; all text paraphrased. Tags: OFFICIAL (store/dev), COMMUNITY (guides/forum/wiki), OPINION (reviews), UNVERIFIED.
Limits: Fandom wiki returned HTTP 402 and one Steam guide was partly removed, so exact node counts/costs/layout were NOT confirmed. Treat all numbers as indicative. Matt should screenshot the Divinity Web (zoom level, node shapes, colours) to close the gaps; section 2 gaps are listed in 2.8.

## 1. The game and its look

| Item | Finding | Tag / source |
|---|---|---|
| Dev / publisher | Creature Cauldron (dev + publisher on Steam); a review names SubSilico as publisher | OFFICIAL store.steampowered.com/app/1914580 ; OPINION seasonedgaming.com review (2023-07-21) |
| Release | Early Access 25 May 2022, full release 20 Jun 2023 | OFFICIAL Steam |
| Platforms | Steam lists Windows; Nintendo eShop and PlayStation store pages exist (ports) | OFFICIAL Steam / nintendo.co.uk |
| Price / rating | GBP 6.99; "Mostly Positive", 78% of ~1,540 reviews | OFFICIAL Steam |
| Genre | Bullet heaven / action roguelite, openly Vampire Survivors-inspired; tags include 2D, Dark Fantasy, Casual | OFFICIAL Steam |
| Run length | 15 minutes, then end boss; auto-attacks, up to 4 abilities | COMMUNITY gamepretty.com guide |
| Maps | 9 maps, only the Desert (start map) open; rest unlocked in the tree; Hard/Hardcore/Brutal variants per map | OPINION seasonedgaming ; COMMUNITY gamepretty |

### 1.1 Art style (answering "3D?")
- It is 2D (store tag), cartoon/hand-drawn sprites. NOT 3D-rendered. Reviewers call it colourful, attractive, with smooth animation (OPINION seasonedgaming, buried-treasure.org 2022). A dissenting review-summary says designs/animations feel bland, "mobile-like" (OPINION vaporlens.app, auto-generated, low authority).
- Camera: top-down/slight three-quarter 2D, fixed (typical for the genre). UNVERIFIED in text; confirm from screenshots.
- Sprites are large, yet hitboxes are tighter than the art suggests, so weaving through dense crowds feels fair (OPINION buried-treasure; COMMUNITY thegamer.com tip). Lesson: big readable silhouettes with forgiving, smaller hitboxes.
- Music: drum-and-bass loop per map (OPINION buried-treasure). Atmosphere is "not meant to be scary" (thegamer).
- Palette, fonts, UI skin, damage numbers, boss presentation details: UNVERIFIED (no text source). Known: map-end boss traps you in a cage of spears (arena-lock moment) (OPINION seasonedgaming). A swarm of tiny flies on one map can be visually overwhelming (thegamer).
- Why it may feel premium to Matt (OPINION/inference, mark as such): saturated readable sprites, strong silhouettes, the physical "web" progression screen, ability mods that visibly change an attack.

## 2. The Divinity Web (skill tree)

### 2.1 Structure
- A single huge web of unlock nodes reached from the main menu hub after pressing Start; it also leads to the Oracle (COMMUNITY gamepretty). Described as "massive" and as compelling as combat (OPINION seasonedgaming, buried-treasure).
- Built to be worked outward from the centre; outer ring uses the rarest currency; some nodes have kill or resource requirements (COMMUNITY search summary, gamepretty).
- Node count: one fan comment cites 680 nodes on a completed save (COMMUNITY, search snippet, UNVERIFIED single source). Reported achievements "So Many Nodes!" and "Pure Power!" suggest fully buying it is a long-term goal (trueachievements.com listing).
- Navigation (pan/zoom), shape, branch/class lanes, node sizes: UNVERIFIED. The fandom wiki describes it as a text map of connections (e.g. a Rune Drop Rate node linking to a pet node), which implies an adjacency graph where buying a node reveals/opens neighbours (COMMUNITY, wiki snippet).
- Bug note: the web sometimes froze until backing out and re-entering (OPINION seasonedgaming). Lesson: test pan/zoom state.

### 2.2 Node contents (what nodes do)
| Category | Examples found | Tag |
|---|---|---|
| Economy / QoL | loot magnet, soul drop rate, rune/blue-soul gain, faster chest/mine opening, pet-cage speed | COMMUNITY gamepretty, Steam forum |
| Pets | up to 5 pet slots; pets appear in cages in-run; one fan unlock gates more cage spawns | COMMUNITY gamepretty, thegamer |
| Weapons / heroes | unlock new abilities and characters (crystal-gated) | COMMUNITY gamepretty, search summary |
| Per-ability upgrades | per-weapon branches (tornado, orbital, etc. with sub-nodes like knockback); high-difficulty nodes can add projectiles (+2 spears/shuriken per level) | COMMUNITY Steam forum, Yippo guide |
| Hero stats | health, damage, crit; most characters gain health nodes | COMMUNITY forum, Yippo |
| Maps / difficulty | new maps; Hard unlock cost reported ~500 runes per map; Hardcore/Brutal need embers + another currency ("Shadow Souls") | COMMUNITY search summary (single source, UNVERIFIED costs) |
| Challenge / achievement locks | some unlocks tied to achievements/kill goals, causing grind | OPINION vaporlens (review summary) |
| Node size tiers (small/medium/large/keystone) | not documented | UNVERIFIED |

### 2.3 Currencies
| Currency | Look | Source of income | Spent on | Tag |
|---|---|---|---|---|
| Souls | blue | most enemies | in-run levelling only | COMMUNITY gamepretty |
| Gold | coins | chests/enemies in run | in-run shop and level-up rerolls; lost at run end | COMMUNITY |
| Hearts | red | drops | heal only | COMMUNITY |
| Runes | blue stones | chests, crates, bosses, shops | the common web currency | COMMUNITY |
| Crystals | purple gems | mines, bosses, shops | bigger unlocks: abilities, character gates | COMMUNITY |
| Ember Cores | orange | Hard Mode only, very rare | outer-web "game-changing" unlocks | COMMUNITY |

Key point: three persistent currencies, each opening a different "depth" of the web, so tier of currency = tier of progression gate (OPINION buried-treasure: "your focus shapes how you approach a run"). Drops vanish if you do not collect them in time (thegamer), which makes the run itself an active gathering loop.

### 2.4 Costs and scaling
- Exact per-node costs and curves: UNVERIFIED. A May 2022 patch increased crystal costs on the web and shop (COMMUNITY patch notes, updatecrazy.com), showing the devs tune cost, not drops, to pace it.
- Players describe many permanent bonuses as tiny, so progress feels padded (OPINION vaporlens).

### 2.5 Respec
- Purchases are final; no refund, unlike Vampire Survivors (COMMUNITY thegamer; no source found for any respec). Because the web is vast and pets/clutter nodes are permanent, players report planning purchases carefully. Pet nodes were singled out as unwanted noise.

### 2.6 Presentation
- Icons/colours/lines/animation/tooltips: UNVERIFIED. One review said locked nodes are hard to see and the tree is hard to read (OPINION vaporlens). Treat as a warning: locked and hidden nodes need clear silhouettes.

### 2.7 Pacing and interaction with difficulty
- First map open; other maps and Hard/Hardcore/Brutal behind web nodes. Higher difficulty feeds rarer currency (embers), which feeds the outer web, which feeds higher difficulty: a clean outward spiral (COMMUNITY gamepretty).
- Hard Mode adds curses and bigger resource multipliers (COMMUNITY). Brutal has sharp spikes and tougher bosses (OPINION vaporlens, Yippo).
- Once the web is maxed, some currency-conversion passives become dead (Yippo), a warning about end-state design.

### 2.8 Community: works vs annoys
| Works | Annoys |
|---|---|
| Web feels tangible versus Vampire Survivors' menu list (seasonedgaming) | Final purchases, no respec (thegamer) |
| Real choice about which branch to push (buried-treasure) | Tiny bonuses, grindy padding (vaporlens) |
| Currency tiers pace depth | Hard-to-see locked nodes; achievement-gated unlocks (vaporlens) |
| Run-to-run goal: "I want node X" | Web screen bugs (seasonedgaming) |

Gaps to fill with Matt's screenshots: overall shape, zoom, node sizes, line style, tooltip layout, how locked nodes appear.

## 3. Other aspects Matt may like
- Characters: no starting weapon; each has a "starting synergy" with certain abilities plus a hero ability and character challenges (OPINION seasonedgaming). Starters: Mangus (heal), Vivian (levelling), Conrad (tank, slow), Maxine (fast, fragile) (COMMUNITY gamepretty). Roster later includes Hugo, Sickle, Shakpana, McDiggins; the tier list puts Hugo top (COMMUNITY Yippo).
- Abilities: cap level 25; mod unlocks at set levels (~9 to 22) (COMMUNITY Yippo). Builds revolve around ability combos.
- Pets: caged pets rescued in run, 5 slots; filling slots improves shop upgrades (Yippo). This is the nearest thing to "summons"; the game is NOT heavily summon-based in the sources, so Hollowlight's spirit-summoner core is a real differentiator.
- Run pickups: mines/chests/cages require standing in a growing circle until filled (gamepretty); mini-bosses drop a purple chest.
- Bosses: end boss at 15:00 with a spike-cage closing in; survivable, unlike Vampire Survivors' reaper (OPINION seasonedgaming).
- Monetisation: premium (one price, no microtransactions found); complaints are about grind, balance, bugs, and dev communication, not payments. Pitfall: the long pure-grind tail.

## 4. Principles to borrow vs avoid (12 lessons)
Hollowlight identity: the Hollow (grey to colour via spirit light, creeping corruption). Stack: Phaser/Three.js game, DOM UI, pure-JS sim, data-driven tree JSON.

| # | Principle (borrow) | Hollowlight twist | Build |
|---|---|---|---|
| 1 | Make the tree a place, a spatial map you travel, not a list | The Lantern Map: nodes start as grey unlit points; buying one lights it and colours the surrounding area (reuse life-map shader idea on the tree backdrop) | `tree.json` nodes `{id,x,y,type,cost,requires[]}`; DOM/SVG layer inside a pan/zoom container (CSS transform), lines as SVG paths |
| 2 | Currency tier = depth tier (3 currencies open 3 rings) | Three light types, e.g. Embers (common), Glass (mid), Dawnlight (rare, earned at dawn/boss) with our own names | `currency` field per node; ring radius from hub gates rarity; pure-JS wallet |
| 3 | Higher difficulty feeds the rarest currency, which opens outer tree | "Deeper Night" tiers: darker world, more corruption, Dawnlight multiplier | difficulty table in JSON; drops multiplied by tier in sim |
| 4 | Fog the outer ring: show silhouettes of future nodes, not full info | Unlit nodes appear as faint hollow outlines; hover reveals teaser text only | state `locked/visible/owned`; render opacity by state; fix SH:IH's "can't see locked nodes" |
| 5 | Node types small/medium/large/keystone with distinct shape/size | Our shapes: spark (small), lantern (medium), flame (large), sun (keystone) - not SH:IH's look | `type` maps to icon size and effect magnitude in JSON; effects declared as `{stat,mult}` |
| 6 | Big readable sprites with forgiving hitboxes | Distinct per-creature silhouette (already a Bible rule); hitbox radius < sprite radius | `hitR` separate from sprite scale in data; test at 300 enemies |
| 7 | Per-weapon (per-spirit) branches that tangibly change an attack | Each spirit has its own branch off its summon node; sub-nodes change behaviour (e.g. wolf leaves a light trail longer) not just +5% | branch ids prefixed by spirit; effects as modifier flags the sim reads |
| 8 | Avoid tiny bonuses: make each purchase felt within one run | Prefer fewer, bolder nodes (~120-200 total, not 680) with visible effect text and a "what changed" line | review every node for >=8% effect or a new behaviour; cap count in a lint test |
| 9 | Allow refund/respec (SH:IH is final and players dislike it) | Free respec of the last-bought branch, full refund at the Hearth; reduces fear of choosing | store `spent[]`; refund = pop and re-credit; save-safe |
| 10 | Avoid dead end-state currencies and achievement-gated hidden grind | Every currency stays useful (a late sink: cosmetic colour restores, ring fillers); unlocks tied to play, not achievement checklists | design check: no node unlocks only by achievement; always show requirement text |
| 11 | Characters defined by a starting synergy + hero ability + challenge | Hero choices tied to a spirit family; challenge unlocks a colour restoration scene | `heroes.json` with `synergy`, `ability`, `challenge` fields |
| 12 | Arena-lock boss at the timer (cage) with fair telegraphs | Dawn Gate: boss walls in, light pillar; if beaten, dawn floods colour | boss state machine in sim; shader pulse on life map at win |

Things NOT to copy: art assets, node icons, the "Divinity Web" name, Oracle/Mangus/Vivian names, exact layout, SH:IH currency names/colours, the permanent no-refund rule, and the pet-cage minigame as is.

## 5. Comparison

| Aspect | Spirit Hunters: IH | Vampire Survivors | Hollowlight (plan) |
|---|---|---|---|
| Look | 2D cartoon, colourful | Retro pixel | Stylised 3D-look, grey-to-colour world |
| Progression | Huge web, 3 currency tiers, final purchases | Power-up list + unlock grid, refundable | Spatial lantern tree, 3 light currencies, respec |
| Run | 15 min + caged boss | 30 min, reaper | Until dawn, dawn-gate boss |
| Core fantasy | Spirit hunters with abilities and caged pets | Survive weapons | Spirit summoner; spirits ARE the weapons |
| Identity hook | Web screen and ability combos | Pure arcade chaos | Visible colour restoration |
| Monetisation | Premium, low price | Premium + DLC | Free, no ads/MTX (CLAUDE.md) |

## 6. Sources (checked 2026-10-14)
- store.steampowered.com/app/1914580 (OFFICIAL)
- gamepretty.com/spirit-hunters-infinite-horde-basic-guide-to-new-hunter/ (COMMUNITY)
- steamcommunity.com/app/1914580/discussions/0/3394037847185411905 (COMMUNITY)
- steamcommunity.com/sharedfiles/filedetails/?id=2998341536 (Yippo guide, partly removed)
- thegamer.com/spirit-hunters-infinite-horde-beginner-tips/ (OPINION)
- seasonedgaming.com/2023/07/21/review-spirit-hunters-infinite-horde-unending-spirit/ (OPINION)
- buried-treasure.org/2022/08/spirit-hunters-infinite-horde/ (OPINION)
- vaporlens.app/app/1914580/spirit_hunters_infinite_horde.md (auto-generated, low authority)
- spirit-hunters-infinite-horde.fandom.com/wiki/Skill_Tree (not fetched; HTTP 402, snippet only)
