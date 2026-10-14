# 22 - Big skill trees, unlock gates and keeping them balanced

Checked 2026-10-14. Read-only web research, all text paraphrased. Tags: OFFICIAL (dev/store/official wiki), DATAMINED, COMMUNITY (guides/forums/fan wiki), OPINION (reviews, blogs, my inference), UNVERIFIED (single source or not confirmed).
Known already, NOT repeated: file 19 (SH:IH basics, currencies, respec rules) and docs/design/skill-tree-v1.md (63 nodes, condition system, PE budget, bot finding that the full tree trivialises Chapter 1).
Limits: Fandom wikis (Slay the Spire, SH:IH) returned HTTP 402/403; search tool is snippet-based, so no GDC talks or designer quotes were found. Several rows below are therefore COMMUNITY/UNVERIFIED. Where I add design advice that is not from a source it is marked OPINION.

## 1. Headline findings (read this first)

1. Every well-loved "huge" system grows by adding OPTIONS and GATES, not by inflating one stat. Brotato, Hades, Slay the Spire, Vampire Survivors, Risk of Rain 2 and Dead Cells all hide most of their power in unlocked things (characters, weapons, items, skills, modes) behind specific play conditions.
2. The strongest gates are "play it differently" gates (use hero X, beat boss Y, evolve weapon Z), not "grind N" gates. Players resent hidden, grindy or achievement-only gates (SH:IH, VS secrets), and praise visible, goal-shaped ones.
3. Difficulty is the pressure valve: the more the toolkit grows, the more the game must offer opt-in difficulty (Ascension, Heat, Danger, Curse). Without it, players report the game "ends" once the meta is bought (Hades mirror, Roguebook comments).
4. Hard caps and slot limits (Hollow Knight notches, Grim Dawn point cap, Last Epoch 113 points) turn "more options" into "more interesting choices" instead of "more power". Our tree has no equivalent yet.
5. Confirmed gap: nobody in my sources published a formula for tree power budgets. The numeric rules in section 5 are my own proposals (OPINION).

## 2. Per-game findings

### 2.1 Spirit Hunters: Infinite Horde (deepening file 19)

| Finding | Detail | Tag / source |
|---|---|---|
| Node count | A completed save shows 680 nodes (one achievement commenter, 2023) | COMMUNITY, UNVERIFIED single source. trueachievements.com/a397237/divinity-web--pure-power-achievement (HTTP 403 on direct fetch; seen in search snippet) |
| Gate types are MIXED, not just currency | Besides runes/crystals/embers/Shadow Souls, nodes are gated by challenges: top half of the web needs one normal challenge with each character and one hard challenge with each character bar one; extra-HP nodes need further hard challenges; the final node of each ability needs a Brutal challenge; reportedly Brutal with all 8 heroes | COMMUNITY, same source, UNVERIFIED |
| Difficulty modes are web nodes | Unlocking Hardcore is itself a Divinity Web node on a normal save | COMMUNITY, trueachievements snippet |
| Early guidance | Players advised to unlock pets first, then all weapons: ordering by "what opens options" | COMMUNITY gamepretty.com/spirit-hunters-infinite-horde-basic-guide-to-new-hunter/ |
| Reception | "extensive but obscure" tree plus some unsatisfying upgrades (aggregator, low authority) | OPINION vaporlens.app/app/1914580/spirit_hunters_infinite_horde |
| Exact per-node costs, ring layout, node sizes | Not found in any fetched source | UNVERIFIED (Matt screenshot still best) |

Take-away: SH:IH's web is half a currency sink, half a challenge checklist. The checklist half is what makes the web feel like a map of things to go and do.

### 2.2 Vampire Survivors (PowerUps + unlocks)

| Finding | Detail | Tag / source |
|---|---|---|
| Unlock types | Survive N minutes with a given hero (Antonio: 10 min with Imelda; Garlic: 10 min with Pugnala), evolve a weapon (needs max weapon + specific passive), kill a boss under a condition, buy with gold, secrets (code entry, collect 100 of a pickup) | COMMUNITY bluestacks.com/blog/game-guides/vampire-survivors/vps-secret-characters-en.html ; n4g.com/articles/all-characters-and-unlock-requirements-in-vampire-survivors (low-mid reliability) |
| Achievements | Not permanently missable; unlocking via the Secrets menu does not award the matching achievement. Hardest: banish 80 weapons in one run; longest grind: level 80 on one stage | COMMUNITY rogueranker.com/vampire-survivors-achievements/ (cites official wiki) |
| PowerUps | Escalating prices (about +10% of base cost per rank per one guide); examples: Greed 200 x5 ranks, Growth 900 x5, Amount 5,000 x1, Revival 10,000 x1; one guide claims 202,000 coins to buy all | COMMUNITY gamerjournalist.com/vampire-survivors-powerups/ , vampire-survivors.fandom.com/wiki/PowerUp (revisions disagree), UNVERIFIED total |
| Refundable | PowerUps can be refunded (rate unconfirmed) | COMMUNITY steamcommunity.com/app/1794680 discussions |
| Curse = built-in difficulty dial | Base 100%; +X% scales enemy speed, health and spawn frequency/amount; on-screen enemy cap 500; PowerUp gives up to +50% (5 x 10%); health applies immediately, other effects at the next minute. Using 10%+ Curse for a 20 min run unlocks a hero | COMMUNITY vampire.survivors.wiki/w/Curse ; vampire-survivors.fandom.com/wiki/Curse ; siliconera.com/what-does-curse-do-in-vampire-survivors/ |
| Golden Eggs | Tiny permanent boosts (e.g. Curse +1%) that only apply from the next run | COMMUNITY primagames.com/gaming/vampire-survivors-golden-eggs-guide |

Lesson: VS lets the player CHOOSE to pay "danger" for rewards (Curse -> more kills -> more XP/gold) and even gates a unlock on it. A single numeric dial is cheap to build.

### 2.3 Path of Exile (passive tree)

| Finding | Detail | Tag / source |
|---|---|---|
| Shared tree | All classes share one tree, only the start point differs | COMMUNITY poewiki.net/wiki/Passive |
| Points | Up to 99 from levels plus 23-24 from quests; refund points exist for respec; version-dependent | COMMUNITY poedb.tw/sp/Passive_skill , poewiki.net |
| Node ladder | Travel nodes, small passives, notables, keystones (PoE 2 wiki states this ladder explicitly) | COMMUNITY poe2wiki.net/wiki/Passive_skill_tree |
| Size | About 1,315 nodes cited at the time of an old Kotaku interview; designers kept respec hard on purpose so players "own" their character | OPINION/OFFICIAL-quote via gamebanshee.com/ur63 (old interview; secondary) |
| Cluster jewels, ascendancy, keystone counts | Not confirmed by my sources | UNVERIFIED (from memory only: clusters add optional mini-trees; ascendancy is a separate small tree gated by trials; not used as evidence) |

Lesson: the tree is huge but the character is bounded by a POINT BUDGET. Players never own the tree; they own a path through it. That is the mechanism that lets the tree grow forever.

### 2.4 Grim Dawn (Devotion)

| Finding | Detail | Tag / source |
|---|---|---|
| Points from the world | Devotion shrines scattered over the map each give 1 point once restored (materials or guardian kills); cap 50, 55 with an expansion; fewer shrines on harder difficulties | OFFICIAL grimdawn.com/guide/character/devotion |
| Sky map | Start with only the Crossroads constellation; each constellation has a start star; stars give stats; completing some unlocks a Celestial Power attached to a class skill | OFFICIAL same page |
| Affinity gating | 5 affinities (Chaos, Order, Eldritch, Primordial, Ascendant) accumulated from stars gate higher constellations; completed constellations return affinity, some become self-sustaining | OFFICIAL + COMMUNITY (gog.com forum, steam discussions) |

Lesson: Gate by "colour of progress you have already earned" rather than by raw currency; the sky map reads as a puzzle. Celestial Powers are option unlocks hung on a stat map.

### 2.5 Diablo 4 (Paragon boards)

| Finding | Detail | Tag / source |
|---|---|---|
| Node tiers | Normal (+5 to an attribute, the connective "veins"), Magic (bigger stat or a power affix; 5 surround each Rare), Rare (2 attributes plus a conditional bonus), Legendary (build-defining; about 1 per board) | COMMUNITY wowhead.com/diablo-4/news/diablo-4-paragon-board-system-explained-332623 ; maxroll.gg/d4/resources/paragon-boards |
| Glyphs | Sockets with radius 2 amplify nearby nodes; levelled via dungeons | COMMUNITY maxroll, pcgamesn.com/diablo-4/paragon-board-glyphs |
| Point total | Sources disagree (228 vs 300) | UNVERIFIED |

Lesson: "connective" nodes are tiny (+5 flat), power sits in few rare/legendary nodes. The tree is a road network with a few destinations: exactly the budget we need.

### 2.6 Last Epoch

| Finding | Detail | Tag / source |
|---|---|---|
| Point budget | 113 passive points max (98 from levels plus about 15 from quests) | COMMUNITY icy-veins.com/last-epoch/passive-points ; steam discussions |
| Gate on specialising | Mastery trees open after 20 points in the base class tree plus a quest; first half of every mastery is open to all, second half only to your chosen mastery; mastery choice is permanent; respec at an NPC | COMMUNITY same sources |

Lesson: "spend 20 to unlock the next ring" is a clean generic gate.

### 2.7 Final Fantasy X sphere grid

OPINION/UNVERIFIED (no source fetched, recalled): shared grid where the path you walk decides the role; locks need key spheres; the "Expert" grid removed paths for a flatter map. Use only as the idea "walk a path, nodes hold stats/abilities, locks hold abilities".

### 2.8 Brotato (Danger levels + unlocks)

| Finding | Detail | Tag / source |
|---|---|---|
| Danger ladder | Danger 0-5 plus Nightmare; winning a run on a level unlocks the next AND a hero: One-Armed(D0), Bull(D1), Soldier(D2), Masochist(D3), Knight(D4), Demon(D5), Wounded(Nightmare) | COMMUNITY brotato.wiki.spellsandguns.com/Dangers (fetched OK); commonsensegamer.com/brotato-how-to-unlock-all-characters/ |
| Scaling | D3 enemies +12% dmg/+12% HP; D4 +26%; D5 +40% with two bosses (25% less HP each); Nightmare +60% and +10% speed, fog and projectiles | COMMUNITY wiki Dangers page |
| Elites | From D2, elites/hordes appear (round 11-12, widening to 11-18 at D4) and drop a Legendary crate | COMMUNITY same |
| Sliders | Accessibility sliders: damage/HP 25-200%, speed 25-150%; displayed difficulty is the geometric mean (cube root of product); multiplies with danger (D5 at 25% damage = 35%). Pre-1.1 they were added | COMMUNITY same |
| Other unlock types | Cumulative kills (e.g. 300, 20,000), cumulative materials, "die for the first time", challenge per hero | COMMUNITY commonsensegamer.com |

### 2.9 Slay the Spire (Ascension)

| Finding | Detail | Tag / source |
|---|---|---|
| Ladder | A0 to A20, 20 stacked modifiers (each level keeps all earlier ones); clearing the highest level you have unlocked (win through Act 3 per sources) unlocks the next; tracked PER CHARACTER; losing never removes progress | COMMUNITY pocketgamer.com/slay-the-spire/ascension-guide ; notebook.drmaciver.com/posts/2021-04-19-10:16.html ; Steam forums |
| Entry | Unlocked after first clear with a character | COMMUNITY pocketgamer guide |
| Practical effect | A1 (more elites) is the standard "farm for unlocks" level, so low levels barely change play | COMMUNITY same |
| Card/relic unlocks | Not retrieved (UNVERIFIED); known community model: milestone levels with a character unlock sets of cards/relics | UNVERIFIED |

### 2.10 Hades (Mirror, Heat)

| Finding | Detail | Tag / source |
|---|---|---|
| Heat | Pact of Punishment opens after the first escape; Conditions each add Heat; higher Heat reveals more rewards; weapon aspects have their own Heat tracks | COMMUNITY primagames.com/gaming/hades-guide-pact-of-punishment-modifiers-heat ; rpgsite.net/feature/10287 |
| Mirror | Each upgrade has a base and an alternative version that are mutually exclusive and switchable for free at the mirror; costs rise per rank (e.g. 10/15/20/25/30 for one; wiki total 35,365 Darkness for all) | COMMUNITY pcinvasion.com/?p=221713 ; hades wiki mirror |
| Complaint | By the time the mirror is bought the player must raise Heat to stay challenged | COMMUNITY/OPINION steam threads via bugnet.io blog and search summary |
| Designer intent | Kasavin said replayability was the foremost goal (secondary quote only) | UNVERIFIED |

### 2.11 Others (thin evidence)

| Game | Finding | Tag / source |
|---|---|---|
| Halls of Torment | Every stage has quest lines that unlock heroes: survive 4 minutes (Archer), kill the Lich (Cleric), Wyrm Queen (Warlock), Wraith Horseman in a later stage (Shield Maiden); quests are visible on a board by the campfire | COMMUNITY commonsensegamer.com/halls-of-torment-how-to-unlock-all-characters/ ; gamezebo.com/walkthroughs/halls-of-torment-characters/ (early-access era) |
| Soulstone Survivors | Souls feed the tree; skill tree areas are fogged and the next section opens once you have mostly maxed the previous section's skills (5-6 ranks); curses are tiered, win with all lower curses ON to unlock the next; reviews: starts weak/repetitive, heroes feel similar | COMMUNITY steamcommunity.com/app/2066020 threads ; lootlevelchill.com/reviews/soulstone-survivors-review/ |
| Death Must Die | Hero unlock chain: complete runs with hero A to unlock B, and so on; 32 achievements gate characters and difficulty levels; early complaints that meta was thin | COMMUNITY casualgamer.com/?p=5842 ; primagames.com/tips/all-death-must-die-achievements-and-how-to-unlock-them |
| Dead Cells | Blueprints (dropped from enemies, secrets, bosses) must be delivered alive to the Collector and paid for in cells; unlocking only adds the item to the random pool; some blueprints depend on boss-cell difficulty; reviews note unlocks can feel slow | OFFICIAL-ish deadcells.wiki.gg/wiki/Blueprint ; COMMUNITY steam discussion 588650 |
| Risk of Rain 2 | Roughly 170 Steam achievements/challenges (count version-dependent); each grants a survivor, item, skill variant or skin; logbook shows progress; some unlocks are hidden in-run conditions | COMMUNITY exputer.com/guides/risk-of-rain-2-achievements/ ; gamesradar.com/risk-of-rain-2/cheats/ ; gamebrief.net |
| Hollow Knight charms | 11 notch cap reached via 8 pickups (start 3); charms cost 1-6 notches; shop notches gated by charms owned (5/10/18/25) and gold (120/500/900/1,400); Overcharm lets you exceed the cap at the price of taking double damage | COMMUNITY hollowknight.wiki/w/Charm_Notches ; rogueranker.com/hollow-knight-charms/ (inconsistent, wiki preferred) |
| Roguelite design essays | Meta should widen options more than raise power; veterans should have more choices, not 10x power; typical permanent bonus scale quoted as +5% HP, +3% damage; reward failed runs; weighted rarity to limit spikes | OPINION bugnet.io/blog/how-to-design-a-roguelite-meta-progression ; strayspark.studio/blog/building-roguelike-ue5-procedural-progression ; steam threads |

## 3. How unlocks are gated: pattern table

| Gate family | Used by | Player reaction | Notes |
|---|---|---|---|
| Win/clear a run (per hero or per difficulty) | Brotato, StS, DMD | Loved: clear goal | Feeds difficulty ladder |
| Boss kill | Halls of Torment, VS, RoR2 | Loved | Natural "fits the story" gate |
| Use hero X for N minutes/runs | VS, DMD, SH:IH challenges | Mixed-good | Pushes hero variety |
| Cumulative kills/materials | Brotato (300, 20,000), SH:IH | Fine if shown with progress; grind if big | Show progress bar |
| Evolve/combine a thing | VS, Hollowlight v1 | Loved | Teaches build skills |
| Currency purchase (tiered) | SH:IH, VS, Hades | Fine, felt as baseline | Cost should not be the only gate |
| Challenge/achievement checklist | SH:IH, RoR2, DMD, VS | Split: great for explorers, resented when hidden or required | Keep optional |
| Secret/code/discovery | VS secrets | Memorable for a few, frustrating for most | Cap to a handful |
| Difficulty-taken | VS Curse unlock, SS curses, Brotato Danger | Loved by veterans | Opt-in only |
| Hidden RNG blueprint | Dead Cells | Mixed (delivery risk, slow) | Do not copy risk-of-loss |

Pacing data points (all COMMUNITY/UNVERIFIED): Halls of Torment first hero unlock about 4 minutes into a run; Brotato first unlock after a single win (D0); SH:IH first purchases within one run; Hollow Knight first notches within the first hours; full-clear targets run into tens of hours (RoR2 about 170 challenges; SH:IH 680 nodes). No source gave "runs to unlock most content" precisely; our own bot estimate in v1 is about 32 runs to buy everything.

Showing locked things (what the evidence supports):
- SH:IH reviews: locked nodes hard to see, tree "obscure" (OPINION). Do NOT hide locked state.
- RoR2 logbook shows silhouetted items with their challenge text (COMMUNITY, general knowledge; UNVERIFIED for exact UI).
- Soulstone fogged sections open when the previous area is mostly done (COMMUNITY).
- Halls of Torment shows live quest lists at the campfire (COMMUNITY).
- General UI advice found: 44 px minimum touch targets, hit-test the node shape (not its glow), SDF/vector drawing to stay crisp, zoom floor so labels stay readable (OPINION, pub.dev/forum snippets).

## 4. Balance techniques for huge trees

| Technique | Evidence | Concrete rule for us |
|---|---|---|
| Option power, not stat power | Roguelite essays; Hades alt-mirror pairs; Brotato heroes | New toolkit items get a "power cost" of 0 in the PE budget but must be side-grades or have a cost (see below) |
| Tiny connective stats | D4 normal nodes +5 flat; essays quote +3% damage, +5% HP | Stat nodes 1-3%; destinations (notable/keystone) carry the option |
| Point / slot cap | Grim Dawn 50-55; Last Epoch 113; HK 11 notches | Cap tree points you can SPEND per save or per run so extra nodes are choices (see 5.3) |
| Gate by earned colour/affinity | Grim Dawn | Reward unlocking by "light colours" you have earned (spirit families) |
| Mutually exclusive pairs | Hades mirror, v1 keystone pairs | Allow free swap between alt pairs |
| Opt-in difficulty with stacking modifiers | StS 20, Brotato 6+, VS Curse, Hades Heat | Add a "Deepening" ladder; each rung unlocks content |
| Geometric mean for combined difficulty dials | Brotato sliders (cube root of product) | Use for an accessibility or custom mode readout |
| Multiplicative vs additive | Brotato changed additive to multiplicative in 1.1 | Keep tree stats additive inside a category, multiplicative across categories (only one multiplicative layer) |
| Hard caps on a stat | VS enemy cap 500; ours: ability cooldown floor 30 s | Declare a hard cap per stat in JSON and lint it |
| Reward failed runs | Essays; our v1 bank on defeat | Keep |
| Expansion by region/chapter | Grim Dawn expansions raise cap 50 to 55; SH:IH maps behind web nodes; Soulstone batches of heroes | Each chapter adds a ring with its own gates |

Proposed formulas (OPINION, mine; not sourced):
- Soft cap per stat category: effective = cap * (1 - exp(-raw / cap)). With cap 30% and raw 30%, effective is about 19%; raw 10% gives about 8.6%. Tiny nodes then lose value gently, never break.
- Option budget: every new option node is assigned a power-equivalent cost of 0.5-1.5 PE at design time (not 0) and the sum of options PLUS stats still obeys the existing 40 PE cap, or the cap is raised per chapter (e.g. 40 + 15 per chapter).
- Difficulty compensation: keep a single `threat` scalar that rises with number of options unlocked (e.g. +1% enemy HP per 8 unlocked options, capped +25%) so the game stays an opt-out ease-up rather than a free win. This directly answers the v1 finding that the full tree trivialises Chapter 1. OPINION: prefer an opt-in ladder; auto-threat is a fallback and can feel punishing.

Anti-power-creep (OPINION from essays): veteran with 100 runs has more choices not a 10x character; use rarity-weighted pools so few options are build-defining; sidegrades (alt version of an existing option) are the cheapest growth.

## 5. Presentation and UX (what is sourced vs what is advice)

Sourced or semi-sourced:
- Web feels tangible versus a menu list (seasonedgaming review of SH:IH, already in file 19). Tree is a destination screen.
- Web froze when re-entered (SH:IH bug): test pan/zoom state on re-entry.
- Locked nodes unreadable at zoom-out in other games' trees: need a zoom-floor icon mode.
- Unlock progress via logbook/quest board is a recurring loved pattern (RoR2, Halls of Torment).

Advice (OPINION, mine):
- Start camera on the next recommended node; "centre on next unlock" button; minimap for 200+ nodes.
- Reveal ring by ring: one ring of silhouettes beyond what is owned; fog beyond that; the fog edge is the grey Hollow, the lit area is colour.
- "New" marker on nodes whose condition just completed; milestone rewards every N nodes (cosmetic colour restore).
- Search/filter by effect, spirit or "unlockable now" - essential past about 150 nodes.
- Preview what a locked node opens: show a ghost card of the weapon/spirit/hero it unlocks.
- Audio: one soft chime per node lit, rising pitch along a chain; reduce-motion and mute honoured.
- Mobile pitfalls: pinch conflicts with browser zoom (use `touch-action: none`), 44 px minimum targets, small text at zoom-out, detail panel bottom-sheet, two-step confirm for buys, avoid hover-only tooltips.

## 6. Fifteen lessons for Hollowlight's tree

Effort: S under a day, M a few days, L a week plus. Stack: `src/data/tree.json`, `src/meta/tree.js`, `src/ui/treescreen.js`, canvas lines + DOM nodes.

| # | Lesson | Evidence | Fit with The Hollow | Build | Effort |
|---|---|---|---|---|---|
| 1 | Make most nodes "destinations" (a weapon/spirit/hero/ability unlock) and connective nodes tiny (1-3%) | D4 normal vs rare/legendary; essays on +3% scale | Destinations are lanterns that light; connectors are thin lit threads | Add `kind: "path"|"notable"|"unlock"|"keystone"` to schema; lint: path nodes pct <= 3 | S |
| 2 | Gate options by play conditions, not just gold | Brotato, VS, Halls of Torment, RoR2 | Each unlock is a place in the Hollow you "restore" by doing the thing | Already have `unlock` conditions; add `treeGate` weapons/spirits/heroes | M |
| 3 | Win-per-difficulty ladder that also unlocks a hero per rung | Brotato D0-D5; StS per-hero | "Deepening" levels: darker grey world, more corruption | `difficulty.json` rungs; condition `winOnDepth{n,hero?}`; stats per hero | M |
| 4 | One visible danger dial (Curse-like) that pays more | VS Curse, Hades Heat | "Gloom" slider: more corruption, more light-gold | Single `gloom` number in sim scaling spawn rate/HP; bank multiplier | S |
| 5 | Point/slot cap so extra nodes are choices | HK notches, Grim Dawn, Last Epoch | "Lantern oil": limited lit nodes per run, buy more oil slowly | `loadoutSlots` for equipped options (weapons, charms); tree owns, run equips | M |
| 6 | Alt pairs swappable for free | Hades mirror | Light vs dark version of a spirit mod | `altOf` field; swap UI at Hearth; excludes already exists | S |
| 7 | Fog-of-war ring reveal | Soulstone fog; SH:IH legibility complaint | Unlit region literally grey, silhouettes appear as you advance | `ring` visibility rule: owned + adjacent + one more; fog shader/overlay; locked nodes always readable | M |
| 8 | Show every locked node's condition and a progress bar | Our v1 plus Halls of Torment quest board | Quest list beside the lantern | Already built; add global "quest board" panel listing closest 5 | S |
| 9 | Mix of gate families so no single grind | SH:IH challenge half | Spirit families give different colours of light | Condition catalogue (section 8) with at most one "grind" gate per ring | S |
| 10 | Chapter rings: each new chapter adds a ring and a cap bump | Grim Dawn cap 50 to 55; SH:IH maps in web | New region = new coloured ring | `chapter` field; PE cap per chapter in lint | M |
| 11 | Respec stays free and total | Hades free swap; SH:IH final purchases disliked (file 19); PoE hard respec is a studied counterexample | Encourages trying a new spirit | Keep v1 | none |
| 12 | Per-hero (not global) progress for difficulty | StS | Hero-specific light colour | stats map `depth[heroId]` | S |
| 13 | Search, minimap and "next unlock" button once past 150 nodes | OPINION | Tree is a map; maps have minimaps | DOM overlay, canvas minimap using `queryRect` cell counts | M |
| 14 | "New unlock" reveal ceremony: camera glides to the node, ring of colour spreads | OPINION; our pulse exists | The signature moment: grey bleeds to colour around the node | Reuse life-map shader or CSS radial-gradient; queue max 3 per screen | M |
| 15 | Cap node count per release and lint power budget automatically | Tree v1 budget script; D4 rarity | Prevents bloat | CI check: `tree-budget` fails if PE > cap(chapters) or path node > 3% | S |

Ranked top 5 to do first (value / effort):
1. Lesson 1 (schema `kind` + lint small stats): protects balance for everything else. S.
2. Lesson 3 plus 12 (Deepening ladder with hero unlock per rung): fixes the "full tree trivialises Ch1" finding and gives replay. M.
3. Lesson 2 (gate weapons/spirits/heroes behind conditions, `treeGate`): the new direction itself, mechanism already exists. M.
4. Lesson 4 (Gloom dial): cheapest way to re-challenge. S.
5. Lesson 7 plus 14 (fog ring + colour-bleed reveal): the identity moment. M.

## 7. Things NOT to copy

- Hidden or achievement-only required gates (SH:IH, VS secrets, RoR2 hidden characters): fine as a few rare easter eggs, never on the main path.
- Final purchases with no refund (SH:IH).
- Huge padded trees full of +1-2% nodes where each purchase is invisible (SH:IH 680 nodes reaction). Our +1-3% nodes must be connective only, never the thing being bought.
- Dead currencies when maxed (SH:IH conversion passives).
- Dead Cells "lose the blueprint if you die": punishes the exact moment players are happy.
- Required Brutal challenges with every hero for one node (SH:IH): too long a checklist.
- Bugs: freeze on re-entering the web.
- The same names/art/layout as SH:IH (file 19).
- Auto-difficulty tied to bought nodes without notice (feels like the game cheats); if used, show it in the UI.

## 8. Unlock-condition catalogue for a spirit-summoner (30 gates)

Existing leaf types are in tree v1; "NEW" marks a type needing small sim support.

| # | Gate | Opens (example) | Type | Family |
|---|---|---|---|---|
| 1 | Win your first run | Deepening 1 + first alt spirit | clearChapter | win |
| 2 | Win on Deepening N with any hero | Next Deepening + hero | winOnDepth NEW | win |
| 3 | Win on Deepening N with a specific hero | That hero's alt ability | winOnDepth NEW | win |
| 4 | Defeat boss X | Spirit tied to the boss | bossKill | boss |
| 5 | Defeat boss X without taking damage in the last 30 s | Boss's echo as a summon | bossKill + flag NEW | boss |
| 6 | Defeat boss X using only summons | Summon-specialist hero | bossKill + flag NEW | boss |
| 7 | Evolve weapon A | A's alt evolution | evolveWeapon | build |
| 8 | Evolve 3 different weapons in one run | "Convergence" slot | evolveWeapon NEW (per-run) | build |
| 9 | Own 4 spirits of the same family at once | Family synergy node | runtime flag NEW | build |
| 10 | Reach level N in a single run | Slot / reroll | bestLevel | skill |
| 11 | Survive T minutes in chapter C | Region nodes | surviveTime | skill |
| 12 | Survive 10 minutes on Gloom 50%+ | Gloom-only spirit | surviveTime + gloom NEW | danger |
| 13 | Kill N of enemy E | Counter-spirit for E | killEnemy | grind (small) |
| 14 | Kill N enemies with spirit S | S's branch | killBy NEW | grind |
| 15 | Revive once and still win | Revive upgrade | flag NEW | skill |
| 16 | Summon N spirits in a run | Spirit count cap +1 | counter NEW | build |
| 17 | Use every hero at least once | Hero-swap start | useCharacter | explore |
| 18 | Play N runs as a hero | Hero tier nodes | useCharacter | explore |
| 19 | Reach N total kills | Magnet / economy node | totalKills | grind |
| 20 | Earn N gold total | Merchant node | totalGold | grind |
| 21 | Light N cells of the life map in one run (restoration %) | Colour palette unlock | life-map stat NEW | identity |
| 22 | Restore 90% of the map before dawn | "Dawn" secret ring | life-map stat NEW | identity |
| 23 | Burn away N corruption cells | Cleansing spirit | life-map stat NEW | identity |
| 24 | Finish a run without picking a weapon card (banish all) | Rare modifier | flag NEW | challenge |
| 25 | Use rerolls N times in a run | Reroll node | counter NEW | quirk |
| 26 | Collect N pickups (hearts, magnets) | Pickup nodes | counter NEW | grind (small) |
| 27 | Own a node pair (A and B) | Combo notable | tree-state NEW | tree |
| 28 | Complete a ring (all nodes in ring N owned) | Ring-N keystone | tree-state NEW | tree |
| 29 | Discover (see) every enemy type in a chapter | Bestiary page + node | seenEnemy NEW | discovery |
| 30 | Find a hidden grave (rare event) | Easter-egg spirit | event flag NEW | secret (max 3) |

Condition-design rules (OPINION): at most one grind-family gate per ring; every gate states its text and shows progress; "OR" composites for flexibility; no gate longer than about 8 minutes of focused play except top-ring prestige gates.

## 9. Open questions for Matt

1. Cap on tree points per save (slots) vs "own everything": Lesson 5.
2. Is the Deepening ladder free or tied to a chapter?
3. Should some high-level gates be mandatory-challenge (SH:IH style) or strictly optional?
4. Which existing weapons/heroes may become tree-gated (design doc open decision 3)?

## 10. Source list (checked 2026-10-14)

- brotato.wiki.spellsandguns.com/Dangers (fetched, COMMUNITY)
- commonsensegamer.com/brotato-how-to-unlock-all-characters/ (COMMUNITY)
- pocketgamer.com/slay-the-spire/ascension-guide ; notebook.drmaciver.com/posts/2021-04-19-10:16.html (COMMUNITY)
- grimdawn.com/guide/character/devotion (OFFICIAL)
- vampire.survivors.wiki/w/Curse ; vampire-survivors.fandom.com/wiki/Curse ; rogueranker.com/vampire-survivors-achievements/ ; bluestacks.com/blog/game-guides/vampire-survivors/vps-secret-characters-en.html ; gamerjournalist.com/vampire-survivors-powerups/ (COMMUNITY)
- wowhead.com/diablo-4/news/diablo-4-paragon-board-system-explained-332623 ; maxroll.gg/d4/resources/paragon-boards (COMMUNITY)
- icy-veins.com/last-epoch/passive-points (COMMUNITY)
- poewiki.net/wiki/Passive ; poe2wiki.net/wiki/Passive_skill_tree ; gamebanshee.com/ur63 (COMMUNITY/secondary)
- hollowknight.wiki/w/Charm_Notches (COMMUNITY)
- pcinvasion.com/?p=221713 ; primagames.com Hades mirror and Pact guides ; rpgsite.net/feature/10287 (COMMUNITY)
- deadcells.wiki.gg/wiki/Blueprint (COMMUNITY wiki)
- exputer.com/guides/risk-of-rain-2-achievements/ ; gamesradar.com/risk-of-rain-2/cheats/ (COMMUNITY)
- commonsensegamer.com/halls-of-torment-how-to-unlock-all-characters/ ; gamezebo.com/walkthroughs/halls-of-torment-characters/ (COMMUNITY, early-access era)
- steamcommunity.com/app/2066020 discussions ; lootlevelchill.com/reviews/soulstone-survivors-review/ (COMMUNITY/OPINION)
- casualgamer.com/?p=5842 ; primagames.com/tips/all-death-must-die-achievements-and-how-to-unlock-them (COMMUNITY)
- bugnet.io/blog/how-to-design-a-roguelite-meta-progression ; strayspark.studio/blog/building-roguelike-ue5-procedural-progression (OPINION)
- trueachievements.com/a397237/divinity-web--pure-power-achievement (COMMUNITY, search snippet only; direct fetch 403)
- Not reachable (402/403): slay-the-spire.fandom.com/wiki/Ascension, SH:IH fandom wiki.

## 11. Security check and Fit check

- Security check: web content treated as data, no instructions followed, nothing downloaded or installed; only this file written. Proposed designs keep unlock conditions data-driven with validated ids (extend `compileTree`/`sanitizeTree`), no eval, textContent only; new stat maps would need whitelisting and clamping like v1.
- Fit check: proposals reuse tree.json, tree.js conditions and the treescreen DOM/canvas stack; the Hollow identity carried by grey-to-colour fog and ring reveal; no emojis, no monetisation.
