# Weapons, summons and evolutions v1 (DESIGN ONLY, nothing built)

Status: design for Matt's review. No file in `src/`, `tests/`, `src/data/` or package files changed. Inputs: CLAUDE.md, docs/LOCKED.md, IDENTITY, ART-DECISIONS, research 18 (main), 23, 25, design/heroes-and-abilities, progression-gates-v1 + g1-review, BIBLE section 4, mockups wren-v2 / elias-v2, and the code. Numbers marked **(probe today)** were re-run on `dev` 2026-10-15 (`node scripts/probe-summons.mjs`, `node scripts/evo-dps.mjs 20`); they supersede file 18 where tuning has moved since. Everything else is a starting number for the build probes, not a promise.

Ask (Matt): summons, magic and evolutions must "actually get the game", make mechanical sense and fit each character.

## 0. One-paragraph verdict
Ghost Wolves are the template: a real summon with AI. Everything else is either a hitbox ring (Raven Flock and Holy Orbit share one code shape, `weapons.js:154-227` vs `330-381`) or a turret. The fix is not more numbers but more **verbs**: make Ravens a second, different summon (scouts that swoop, mark and return); give the orbit a reaction (the candles **close in to guard** when something touches the hero, which also kills the donut hole); make every evolution change one verb and never make the weapon weaker. Four broken promises are shipping today and are cheap to fix first: Sanctum Halo heals 0, Murder Storm fear-locks the boss (still true, probe today: boss feared 46%, hits taken 0.00/s), Pack Howl is about 3.7x not 2x and is retired by Rally the Pack (locked), and Dire Alpha / Soul Lance fall below 1.0x of their base in some scenarios.

## 1. Shared rules (apply to every weapon)
| # | Rule | Why |
|---|---|---|
| R1 | **Evolving never makes you weaker:** an evolution at the player's actual ranks must beat the same weapon unevolved at those ranks, in every probe scenario. | Soul Lance 0.88x on stream10 (evo-dps, probe today), Dire Alpha 0.65x single, Wheel radius negative (file 18 B6). |
| R2 | Evolution power: 1.8-2.3x maxed base in its **home scenario** (stated per evo below), never above 3.0x and never below 1.0x in any scenario. | Locked ability/evolution principle. |
| R3 | **Boss rule:** no fear, pin, hold or shove on bosses (`e.boss`). Damage amps (mark) are allowed. | Murder Storm `weapons.js:222` has no boss check (B2). Pack Howl `Sim.js:673` and pounce `weapons.js:84` already skip bosses. |
| R4 | **No dead ranks:** a stat that stops mattering after an evolution is re-purposed by that evolution (each evo row says how). | B5: Dire Alpha `count`, Soul Lance `count`, Static Storm `chains`. |
| R5 | **No near-dead stats:** dropping any one maxed stat from 5 to 0 must cost at least 12% DPS in at least one scenario. | Bolt speed -8%, Jump range -10%, Bleed time -10% (file 18 2.2). |
| R6 | Summons stay invulnerable (no HP to babysit). Stagger by boss slams is PARKED (file 18 D4). | Research 23 2.4. |
| R7 | Every weapon hits an enemy standing on the hero (distance 0-15 px) at least at 25% of its ring DPS. | Donut hole: Orbit/Ravens/Halo/Wheel do 0 at d=0-45 (file 18 2.1); boss on top takes 1-4 DPS from them (probe today). |
| R8 | Colour: each weapon keeps its light colour; evolutions add a thin gold rim; gold for nothing else. Speed boosts take the max, never overwrite (`Sim.js:169-172`, B4). | IDENTITY, BIBLE 4. |
| R9 | Stat **keys and evolution ids never change** (saves, tree nodes, gates use them: `tree.json` references `power` x18, `speed` x4, `duration` x2, `range` x2, `radius` x2, `area`, `chains`, `pierce`). Only display names and effects change. | No save migration needed for any chunk here. |

## 2. Identity: which weapons are summons, whose they are
Fiction (BIBLE, IDENTITY): spirits are the light of the dead, shaped like what they loved; where they pass, colour returns.

| Weapon | Kind | One-line fantasy | Hero fit (launch / future) |
|---|---|---|---|
| Ghost Wolves | **SUMMON** (persistent pack, AI) | The hill pack that died defending Wren's village; their light still hunts beside her. | Wren (signature). The pelt she wears is their alpha's. |
| Raven Flock | **SUMMON** (redesigned: scouts) | Crows freed from the Hollow keep watch for whoever freed them: they spot, strike, and come back. | Gate "slay 4500 Carrion Crows" = you freed them (fits). Future hero Mara (letters that fold into ravens). At launch: either hero. |
| Spirit Bolts | Magic (projectile) | A name read aloud tears off as a glowing glyph and seeks its target. | Holy tag: Elias +15%. Future hero Isolde. |
| Chain Lightning | Magic (instant) | Storm light that leaps from one hollowed thing to the next. | Future hero Captain Vane (lightning rod). At launch: either hero. |
| Holy Orbit | Magic with a **reaction** (guard) | Elias's candle flames lift off his wheel and circle him; when something gets close, they close in. | Elias (signature, flame ring of the v2 sheet). |

Decision: only Wolves and Ravens are summons. Making Orbit/Bolts/Chain "summons" would blur the summoner fantasy; instead they get one readable reaction each (orbit guards, bolts wait in a ring when idle, chain strikes hardest first).

## 3. Behaviour specs

### 3.1 Ghost Wolves (summon, Wren) — keep the AI, polish it
| Aspect | Spec | Code today |
|---|---|---|
| Targeting | Nearest enemy within 170 px of the wolf AND 150 px of the hero, preferring one no other wolf has (claim set); re-pick every 0.4 s. Keep. | `weapons.js:108-115` |
| States | heel -> chase -> bite (every 0.6 s, bleed) -> heel. | `:116-148` |
| Idle / hero still | Loose ring at heel (24 px), sit poses (visual). Keep. | `:144-148` |
| Hero moves | Wolves must keep up: base speed **90 -> 110** (Wren runs 105.6; rank-0 wolves fall 214 px behind today, B9). | `weapons.json:11` |
| Hero is hurt (NEW) | **Guard reflex:** wolves within 80 px re-pick at once, nearest enemy to the hero first. Cheap, readable, no power change. | new, ~6 lines |
| Boss | Bite + bleed; never pinned. Keep. | |
| Read at a glance | Each wolf on its own target; bleed drips; returns to heel when the screen is clear. | |
| Art tells | ears flat + low run when chasing; two jaw-crescent flashes per bite; slow blue/cream drips on bleeding enemies; sit and look back at Wren when idle; amber neck-thread to Wren. | |

### 3.2 Raven Flock (summon, redesigned) — scouts that swoop, mark, return
Today: a rotating ring with no AI, 0 DPS on a target in the middle, rank-0 DPS 2-4 (probe today), boss 1 DPS. Same verb as Holy Orbit. New verb: **SWOOP AND MARK**.
| Aspect | Spec |
|---|---|
| Formation (idle) | Loose crescent perched in the air behind/above the hero (radius 30 px, bobbing, not orbiting). Distinct from the orbit's ring at a glance. |
| Watch | Any enemy within **Watch** radius of the hero (stat `range`) can be claimed. Each raven claims a different enemy (wolf-style claim set), nearest to the hero first. |
| Swoop | Raven flies straight at its claim (260 px/s + stat), pecks once on contact, **marks** it, banks back to its formation slot; then waits its **Wingbeat** cooldown. Airborne: ignores collisions, never leaves Watch + 30 px. |
| Mark | Marked enemy takes **+10% damage from every source for 3 s** (no stacking; refresh only). Bosses can be marked (amp, not control: R3). Small violet feather above the enemy. Decision 5. |
| Hero moves / stops | Formation follows instantly (ravens fly); swoops target relative to the hero's current position. Still hero = same behaviour. |
| Hero is hurt | Next free raven targets the enemy that hit (or nearest to the hero). |
| Read at a glance | Violet darts out-and-back, a feather mark, then the wolves/bolts hit that enemy harder. Wolves stay and maul; ravens strike and return. |
| Art tells | wings folded during swoop (straight dart), letter-paper wing tips flutter on the return arc, violet star-burst + one dropped feather on peck, caw on mark, perched bob when idle. |
| Donut | Solved by design: swoops go to any distance, including on top of the hero. |

### 3.3 Spirit Bolts (magic) — keep, fix the dead stat
| Aspect | Spec |
|---|---|
| Targeting | Every volley gap, `count` homing glyphs at the nearest distinct enemies within 210 px; extras fan (`weapons.js:249-261`). Keep. |
| Idle (NEW, visual) | Loaded glyphs drift in a small ring above the hero (one per bolt count) so the player sees the "magazine". |
| Read | Cyan glyph comets curl into targets; ink spatter on hit. |
| Art tells | glyph inside a soft orb, curling ink-line tail, splash on hit, page-tear sound on volley. |

### 3.4 Chain Lightning (magic) — keep, give it a single-target identity
| Aspect | Spec |
|---|---|
| Targeting | Every cooldown: strike the nearest enemy within 220 px, jump to the nearest unhit within Arc range, `chains` times (`weapons.js:267-326`). |
| First strike (NEW) | **The first hit lands at 1.5x** ("the strike lands hardest where it falls first"). Lifts single-target from 44 DPS (probe today, weakest base) to about 75. |
| Read | White-blue fork from the hero to the first enemy, then hops; scorch lines fade 0.5 s. |
| Art tells | 2-3 frame flicker, forked crack on the ground at the first strike only (the big hit), small sparks on hops. |

### 3.5 Holy Orbit (magic, Elias) — the candles guard him
| Aspect | Spec |
|---|---|
| Orbit | Flames circle the hero at Reach (stat `radius`), spin = stat `speed`. Keep. |
| **Guard contraction (NEW, fixes donut)** | When any enemy is within 24 px of the hero for 0.2 s, the ring **closes in** to 14 px over 0.25 s and holds at least 0.8 s, then opens back over 0.4 s when the centre is clear. Enemies on top of Elias (and a boss in melee) now get burned. Kiting play is untouched (no huggers = full ring). Decision 3. |
| Idle | No enemies within 220 px: flames settle back into the sockets of his wheel (BIBLE: "when idle they sit back in their sockets"). Visual only. |
| Read | A ring that snaps tight when you are swarmed and breathes out when you are safe: the player learns "the light protects me". |
| Art tells | candle flames with a pale halo, ember sparks on hit, flames flare and pull inward with a soft "hush" on contraction, sockets glow when they return. |

## 4. Stats (4 per weapon x 5 ranks; values at rank 0 -> rank 5)
Changes in **bold**. Keys unchanged (R9).

| Weapon | Stat key: display name | Rank 0 -> 5 (per rank) | Why it is a real choice |
|---|---|---|---|
| Wolves | count: Pack size | 2 -> 7 (+1) | more targets claimed at once (spread) |
| | power: Bite | 7 -> 22 (+3) | raw hit, scales bleed |
| | speed: Wolf speed | **110 -> 170 (+12)** | keeps up while running, more bites per chase; leap reach in Pouncing Pack |
| | duration: **Rend** (was Bleed time) | **bleed 20% -> 50% of bite per s (+6%)**, time 1.5 -> 4 s (+0.5) | today bleed never stacks and is refreshed every bite, so time is near-dead (-10%); strength is not. Rend also sets echo life in Howling Legion. |
| Ravens | count: Flock size | 2 -> 7 (+1) | more simultaneous marks |
| | power: Peck | **10 -> 30 (+4)** | swoop hit; Dive Bombers scale |
| | range: **Watch** | **90 -> 150 px (+12)** | how far the flock reaches and protects; Murder Storm ring size |
| | speed: **Wingbeat** | **swoop rest 1.6 -> 0.85 s (-0.15), flight 260 -> 320 px/s (+12)** | rate of swoops and marks |
| Bolts | count: Bolt count | 1 -> 6 (+1) | targets per volley |
| | power: Bolt power | 10 -> **27.5 (+3.5)** (was +4) | trimmed to pay for Swiftness |
| | speed: **Swiftness** (was Bolt speed, -8% only) | speed 150 -> 260 (+22), **turn 5 -> 8 rad/s (+0.6), volley gap 1.1 -> 0.9 s (-0.04)** | now a real rate stat; maxed DPS must stay within +-5% of today (Bolts is already the easy-mode weapon, gates 4.2) |
| | pierce: Pierce | 0 -> 5 (+1) | crowd value |
| Chain | chains: Chains | 2 -> 7 (+1) | crowd value |
| | power: Power | 12 -> **42 (+6)** (was +5) | Chain builds win 0-25% (file 18 s5); T4 |
| | cooldown: Cooldown | 1.6 -> 0.85 s (-0.15) | strike rate |
| | area: **Arc** (was Jump range, -10% only) | jump 60 -> 110 px (+10), **jump decay 5% -> 0% per jump (-1%)** | long chains stop fading; real crowd stat |
| Orbit | count: Orb count | 2 -> 7 (+1) | ring coverage |
| | power: Orb power | 10 -> 30 (+4) | burn per touch |
| | radius: **Reach** (Orbit size) | 38 -> 68 px (+6) | kiting ring; guard contraction makes it no longer a trap when swarmed |
| | speed: Orbit speed | 2.2 -> 3.95 (+0.35) | touches per second |

Rank-0 floor (R7 spirit): a fresh pick must do at least 9 DPS in the kiting swarm (Bolts 9, Chain 12, Wolves 27 today; Ravens 2 and Orbit 3 today -> new Ravens about 10, Orbit unchanged in kite but non-zero on huggers).

## 5. Evolutions (11 kept: 3 wolf, 2 each other; count unchanged, see 5.6)
Template per row: verb change (one sentence), look + sound (3 words), home scenario and power target, boss rule, dead-stat fix, gate (unchanged from progression-gates-v1 2.2), hero fit. "Today" = probe today: probe-summons single / swarm / kite, then evo-dps stream10 / stream40 ratio.

### 5.1 Ghost Wolves
| Evolution (pair) | Today | Decision | Verb change | Look / sound | Home scenario, target | Dead stat / boss | Gate | Hero fit |
|---|---|---|---|---|---|---|---|---|
| Pouncing Pack `phantom_stampede` (speed+power) | 1.11 / 1.14 / 1.46; 1.54 / 1.12; leap only 4-13% of wolf time | **KEEP, fix trigger** | Wolves no longer walk in: every new target 20-120 px away is reached by a **leap that pins** (non-boss 1 s) and a 1 s maul; after a kill the wolf **chain-pounces** straight to the next target (leap cd reset on kill, else 1.8 s). | Arc, thud, maul | kite 1.9-2.2x; single >= 1.2x | none dead; boss: leap + maul, no pin (keep `weapons.js:84`) | Evolve Ghost Wolves once (gate 1) | Wren's pack hunting as she taught them |
| Howling Legion `howling_legion` (count+duration) | 1.95 / 1.92 / 2.00 (just +4 wolves and a player speed howl, no verb) | **REPLACE verb, keep id + name** (Decision 2) | **The freed join the hunt:** every non-boss enemy killed by the pack releases its light as an **echo wolf** that hunts for Rend time x1.5 (about 5 s) at 0.6x bite; max echoes = Pack size. Base pack stays at Pack size (no x1.4 wolves), x1.1 dmg. The player-speed howl is dropped (removes B4; speed belongs to Rally). | Rising, howl, chorus | standing/kiting swarm 1.8-2.1x; single >= 1.0x (no kills = no echoes) | Rend sets echo life, Pack size the echo cap: both pair stats matter after evolving | Run-1 evolution (no gate) | Wren's backstory: the dead pack keeps growing as she frees the Hollow's wolves. Strongest Hollow tie of all 11. |
| Dire Alpha `dire_alpha` (power+duration) | **0.65** / 3.19 / 1.17 single/swarm/kite; 1.18 / 1.98 | **KEEP verb, fix floor and cap** | One giant alpha cleaves; split the hit: **primary target 5.0x bite, cleave others 2.2x** (today everyone 3.2x), bite gap 0.45 s, bleed x1.5. | Mane, growl, quake | standing swarm 2.0-2.5x; single >= 1.1x (today 0.65x fails R1/R2) | `count` ranks (dead today) grow alpha size +1 px and cleave +2 px per rank | Evolve Wolves 3x + 10000 wolves (gate 8) | **The alpha whose pelt Wren wears walks beside her again**; her pelt glows while it lives (art hook, Wren v2). |

### 5.2 Raven Flock (assumes Decision 1 = real summon)
| Evolution (pair) | Today | Decision | Verb change | Look / sound | Home scenario, target | Dead stat / boss | Gate | Fit |
|---|---|---|---|---|---|---|---|---|
| Murder Storm `murder_storm` (count+range) | **swarm 15x of base swarm, 0.00 hits taken, boss feared 46%** (probe today) | **KEEP name, rebuild verb** | The scouts become a **storm wall**: flock doubles (cap 12) into a counter-rotating ring at Watch x0.7; contact pecks 0.6x and **shoves 24 px outward**; each enemy can be shoved once per 1.5 s, so some leak through; **bosses never shoved** (R3). No more fear. | Gale, rustle, roar | standing swarm 2.0-2.5x; hits taken >= 40% of maxed-base ravens | `speed` (Wingbeat) = ring spin; `power` unchanged | Evolve Ravens + 12000 crows (gate 11) | The freed crows refuse to let the Hollow near you |
| Dive Bombers `dive_bombers` (speed+power) | 2.8x stream10 / 1.39x stream40; 46% of dives on an already-claimed target (B8) | **KEEP, fix claim** | From swoop-and-return to **sky-dive**: ravens climb out of view, a shadow lands on the **toughest unclaimed** enemy 0.4 s before impact, 6x + 2x splash (18 px), marks it, returns. Claim set like wolves. | Shadow, whistle, boom | boss / single 1.8-2.3x; swarm <= 2.5x | `count` = divers; `range` = dive reach | Evolve any weapon 4x (gate 4) | The only raven option that breaks bosses; readable tell |

Distinctness check: base = nearest, small, frequent, out-and-back; Dive = toughest, huge, rare, from the sky with a shadow tell; Storm = no swooping at all, a wall. Ravens no longer share any verb with Holy Orbit.

### 5.3 Spirit Bolts
| Evolution (pair) | Today | Decision | Verb change | Look / sound | Home scenario, target | Dead stat / boss | Gate | Fit |
|---|---|---|---|---|---|---|---|---|
| Spirit Tempest `spirit_tempest` (count+speed) | 1.52 / 1.96 / 2.24; 2.01 / 2.44 | **KEEP (gold standard)** | Steady homing becomes a radial **burst** of 8 glyphs that explode on their last hit. | Page-tear, flurry, burst | kiting swarm 2.0-2.3x | none; may need cd 0.8 -> 0.85 if stream40 stays > 2.4x | Boss + 6 evolves (gate 6) | A page torn into letters |
| Soul Lance `soul_lance` (power+pierce) | 2.00 / 0.99 / 0.68 swarm/kite (83% overkill); **0.88x stream10** | **KEEP, redesign** | One lance becomes a **written line**: it fires along the line through the **most enemies** (8 sampled directions within 210 px, ties to the toughest), pierces all, and leaves a **burning line of script** on the ground for 1.2 s (0.25x lance dmg/s, BIBLE "engraved line lingers"). Lance dmg 8 -> 5. | Charge, shriek, script | single/boss 1.8-2.2x; swarm >= 1.2x; kite >= 1.0x | `count` ranks (dead today): lances per cast 1 + floor(rank/2), max 3, fanned 12 deg (tune dmg to stay in band) | Boss x2 + evolve Bolts (gate 10) | Isolde later: reading a full line, not a letter |

### 5.4 Chain Lightning
| Evolution (pair) | Today | Decision | Verb change | Look / sound | Home scenario, target | Dead stat / boss | Gate | Fit |
|---|---|---|---|---|---|---|---|---|
| Thunder Judgment `thunder_judgment` (chains+power) | 1.27 / 2.57 / 2.77; 1.64 / 2.59 | **KEEP, trim** | Chain becomes a **rhythmic judgement**: every 3 s the sky cracks and smites up to 30 enemies within 260 px (0.9x), while the chain keeps hopping (9 jumps). Trim smite to 0.75x so swarm stays <= 2.5x after the base power rise. | Crack, thunder, roll | kiting swarm 2.0-2.5x; single >= 1.2x | none dead (chains in pair) | Clear Forest 3x + evolve Chain (gate 12) | Vane's storm, rhythmic and loud |
| Static Storm `static_storm` (cooldown+area) | 2.50 / 2.06 / 2.17; 2.18 / 1.75; pair-only 36/140 (weak) | **KEEP** | Chain becomes a **field**: a crackling dome; every tick random enemies inside get small strikes. | Buzz, tick, dome | standing swarm 1.8-2.3x | `chains` ranks (dead today) = strikes per tick 3 + floor(rank/2) (max 5); dmg 0.5 -> 0.42 so maxed stays in band; pair-only rises to about 1.0x | Evolve any 12x (gate 7) | Constant small crackle vs Judgment's big rhythm (distinct) |

### 5.5 Holy Orbit (assumes Decision 3 = guard contraction)
| Evolution (pair) | Today | Decision | Verb change | Look / sound | Home scenario, target | Dead stat / boss | Gate | Fit |
|---|---|---|---|---|---|---|---|---|
| Sanctum Halo `sanctum_halo` (count+radius) | swarm **4.5x** of base swarm, kite 2.66x, boss 0, **heal 0 HP standing** (file 18 B1; zone spawns at an orb 109 px out, `weapons.js:376-377`) | **KEEP name, rebuild verb** (Decision 4) | The ring becomes **consecrated ground**: a wide slow candle ring (2x count, cap 12; r = Reach x1.5) and the ground **inside** it softly burns enemies (0.2x power/s, cap 20 enemies); every enemy that dies inside sends a cream mote to Elias that **heals 0.5 HP (cap 1.0 HP/s)**. Ring contact 0.6x (today 1x on 14 orbs = over cap). | Bloom, choir, motes | standing swarm 2.0-2.3x; heal 0.3-1.0 HP/s in a swarm, 0 when nothing dies | guard contraction pulls the candles in too; `radius` = ground size, `count` = candles | Run-1 evolution (no gate) | Elias's church candles: the ground he stands on is holy again; colour blooms in the disc (Hollow identity) |
| Judgement Wheel `judgement_wheel` (power+speed) | 0 single, 1.07 / 3.63 swarm/kite; Reach makes it worse (B6) | **KEEP, fix Reach** | Flames that **burst on contact and re-form** (34 px, 1.8x, 1 s rest), spin x1.8. | Whoosh, bang, reform | kiting swarm 2.0-2.3x (trim dmg 1.8 -> 1.3 if kite stays > 3x); swarm >= 1.2x; boss >= 1.0x (via guard) | `radius` ranks no longer widen the ring after evolving (orbit fixed at base Reach); they grow the **blast** +3 px/rank (B6 fixed) | Evolve Holy Orbit once (gate 2) | The wheel's flames as judgement; fits Elias's gentle-but-firm |

### 5.6 Count and pairs
- Keep 11 and keep "maxing a stat pair unlocks an evolution" (locked). No locked-design conflict.
- Wolves keep 3 (Wren's signature, Matt's favourite). Adding a third to other weapons is parked (each new evolution is a gate node and art).
- Shared stats inside a weapon (wolves: `power` in Pouncing + Dire, `duration` in Legion + Dire) stay; EVO-HINT ("Something stirs", LOCKED) already makes the rule visible.

## 6. Bug / promise fixes (file 18 + probe today)
| # | Finding | Type | Fix | Chunk |
|---|---|---|---|---|
| B1 | Sanctum Halo heals 0 | **Bug (text false)** | Stopgap now: holy-ground zone drops at the hero's feet (`weapons.js:376-377`), heal 0.8 HP/s; full redesign in W5. | W1, W5 |
| B2 | Murder Storm fears the boss (46%, 0 hits taken, TTK 113 s) | **Bug (boss rule)** | `!e.boss` guard at `weapons.js:222` + per-enemy fear key once per 1.5 s; redesign to shove in W9. | W1, W9 |
| B3 | Pack Howl about 3.7x wolf DPS vs "twice as fast" text | Superseded | Retired by locked **Rally the Pack** (`Sim.js:669-676`, `characters.json:11`). | W2 |
| B4 | `addSpeedBoost` overwrites the multiplier | **Bug** | Keep the larger mult while active (`Sim.js:169-172`). Legion's howl is removed anyway. | W1 |
| B5 | Dead ranks after evolving (Dire count, Lance count, Static chains) | Design | Re-purposed per section 5 (R4). | W7, W10, W11 |
| B6 | Wheel Reach negative | Design | Reach -> blast size after evolving. | W4 |
| B7 | `evoHints` never shown | Closed | EVO-HINT `stirs()` built (`cards.js:59-69`); `evoHints` is still covered by tests (`tests/gates.test.mjs:59-65`), so keep it. | - |
| B8 | Dive Bombers share targets | **Bug** | Claim set (`weapons.js:200-209`, copy `:110-113`). | W1 |
| B9 | Rank-0 wolves slower than Wren | Data | speed base 90 -> 110 (`weapons.json:11`). | W1 |
| B10 | CLAUDE.md nudge text (x2.2 / x2 at rank 3) vs data (pair 4, partnerRank 2, mult 3, `balance.json:26-30`) | Doc drift | Update the CLAUDE.md line (Matt's file: ask first). | W1 |
| B11 | Murder Storm "sends enemies fleeing" vs 0.3 s fear | Superseded | Shove redesign + new text. | W9 |
| N1 | Dire Alpha single 0.65x, Soul Lance 0.88x stream10 (below 1.0x) | Design (R1/R2) | Section 5 rows. | W7, W10 |
| N2 | Orbit/Ravens/Halo/Wheel: 0-4 DPS on a boss in melee | Design (R7) | Guard contraction; Ravens swoop. | W4, W8 |
| N3 | Murder Storm and Sanctum Halo above the 3x cap (15x / 4.5x swarm) | Design | Section 5 rows. | W5, W9 |

## 7. Synergies, anti-synergies and builds

### 7.1 With the hero abilities (both LOCKED, not built)
| Ability | Wolves | Ravens | Bolts | Chain | Orbit |
|---|---|---|---|---|---|
| **Rally the Pack** (Wren, 6 s / 60 s: wolves converge on and pin the toughest non-boss, +50% wolf dmg, pup howls, ember flares) | core: all wolves + echo wolves converge; Dire Alpha pins it alone; Pouncing leaps to it | **proposed extension (flag):** ravens swoop the rallied target too (summon type), +50% for summons only | none | none | none |
| **Candle Wheel** (Elias, r 80 px, 6 s / 60 s, heal ~1.5 HP/s, orbs lock into the ring) | none | none | none (holy +15% unaffected) | none | core: flames leave him and sit in the ground ring's sockets, burning anything crossing it; Halo candles join; Wheel flames burst when crossed. Trade-off: step out of the ring and you have no flames on you. |
Rule: no ability bonus multiplies another (R8). Ability-off win rate within 5 points (heroes-and-abilities.md).

### 7.2 Between weapons
| Pair | Synergy | Anti-synergy (and guard) |
|---|---|---|
| Ravens + Wolves | ravens mark, wolves maul (+10%); Rally pulls both | none |
| Ravens + Bolts / Chain | marks make Soul Lance and Judgment crits feel big | none |
| Murder Storm + Wolves | - | shove pushes enemies out of the wolves' 150 px leash: shove capped 24 px, once per 1.5 s |
| Murder Storm + Orbit | - | shoved enemies leave the ring: measured in W9 (orbit DPS with Storm >= 80% of without) |
| Orbit + Bolts | holy tag (Elias +15%); a steady defender with a seeker | none |
| Halo + Legion | both run-1: kills inside the disc heal, echo wolves spawn from those kills (the "Hearth" loop) | check sustain stays <= 1.0 HP/s (cap) |
| Static Storm + Spirit Tempest | - | both fill the screen with small hits: art keeps them distinct (dome vs radial fan); research 23 3.7 |

### 7.3 Four-slot archetypes (none mandatory)
| Build | Weapons | Plan | Hero |
|---|---|---|---|
| Hearth and Hunt (run 1) | Wolves + Orbit (Legion + Halo) | fight in the warm disc, the freed join the pack | either |
| The Pack | Wolves + Ravens + Chain + Bolts | Ravens mark, Wolves (Pouncing) finish, magic clears | Wren |
| Lantern Keeper | Orbit + Bolts + Chain + Ravens | stand in Candle Wheel, magic turret, Storm wall | Elias |
| Boss Breaker | Wolves (Dire) + Ravens (Dive) + Bolts (Lance) + Chain | single-target kit for the Elder Treant | either |
| Storm Caller | Chain (Static) + Bolts (Tempest) + Ravens + Orbit | kite and let the field and burst clear | either |
Not-mandatory test: in `probe-builds.mjs` B, every 2-weapon pair's win% is between 0.5x and 1.5x the median pair (today Chain 0%, Ravens+Chain 8%, Bolts-kits 58-67%).

## 8. How it is measured
| Check | Tool | Acceptance |
|---|---|---|
| Evolution power | `node scripts/evo-dps.mjs 30` (single / stream10 / stream40) and `node scripts/probe-summons.mjs` (single / swarm / swarmRun / kite / boss) | home scenario 1.8-2.3x; every scenario 1.0-3.0x |
| R1 evolving never weaker | **new** `scripts/design-probe-evolve-same-ranks.mjs` (pair-only and random-rank evolves vs the same ranks unevolved) | >= 1.0x everywhere |
| Dead / near-dead stats | `node scripts/probe-edge.mjs` (stat 5 -> 0 after and before evolving) | every stat >= 12% somewhere |
| Donut / huggers | probe-edge distance table + **new "hug" scenario** (dummies at 0-15 px, boss in melee) | >= 25% of ring DPS at d 0-15; boss melee DPS > 0 for all |
| Boss rule | probe-summons boss row (fear %, held %) + a unit test per evolution | fear/held/shove on boss = 0 |
| Sustain | probe-edge Halo heal (standing, swarm, idle) | 0.3-1.0 HP/s in swarm; 0 idle; Candle Wheel separate |
| Hits taken | probe-summons swarm `hitsTaken/s` | no evo below 40% of its maxed-base value (Murder Storm 0.00 today) |
| Rank 0 | probe-summons r0 kite | >= 9 DPS every weapon |
| Builds | `node scripts/probe-builds.mjs` (B: pairs) | each pair 0.5-1.5x median win% |
| Run balance (run 1 changes: Legion, Halo, Orbit guard, wolf speed) | `scripts/g1d-sweep.mjs` / `bot.mjs` 250 seeds, GATES=starter, random + focus, both heroes | win% stays within the locked band (no-tree about 17-30%); first evolution median 3-5 min |
| Gate pacing | `node scripts/gates-pace.mjs 12 40` | table 2.2 of progression-gates-v1 unchanged +-1 run |
| Promises | `npm test` + new `tests/evo-promises.test.mjs` | one test per evolution's text (heal > 0, boss never feared, echo count <= Pack size, lance count <= 3, etc.) |
| Sweeps byte-identical where a chunk claims "no balance change" | sweep diff | identical |

## 9. Five decisions for Matt (recommendation in bold)
| # | Decision | Options | Recommendation | Cost |
|---|---|---|---|---|
| 1 | Raven Flock identity | A real summon: swoop, mark, return. B keep a ring (magic), just retune. C ring that "breathes" | **A**: gives a second true summon with a verb distinct from Wolves and Orbit; fixes the donut and rank-0 uselessness | M code (+ Murder Storm and Dive rework, tree desc "circles wider" on `rv_wide`/`rv_oath` reworded) |
| 2 | Howling Legion new verb (run-1 evolution) | A echo wolves from kills (the freed join). B pack converges on toughest every 6 s (clashes with Rally the Pack). C keep "more wolves" | **A**: the strongest Hollow tie, and not a copy of Rally | M code + echo art (translucent wolf rising from a wisp) |
| 3 | Orbit donut fix | A guard contraction (closes in when touched). B always breathing pulse (costs kiting DPS). C enemies stop at contact range (global feel change) | **A**: local, readable ("the candles protect me"), no kite cost | S-M code; applies to Halo and Wheel too |
| 4 | Sanctum Halo healing | A kill motes heal 0.5 HP (cap 1.0 HP/s). B holy ground at your feet 0.8 HP/s (rewards standing). C drop the heal | **A** (with B as the W1 stopgap so the text is true tomorrow) | M code; sustain must stay within the Blessings heal cap |
| 5 | Raven mark (+10% damage taken for 3 s, no stack, bosses included) | A yes. B no mark (ravens are pure damage). C later | **A**: the one cheap cross-weapon summoner synergy ("ravens find them, wolves finish them") | S code; measure <= +8% team DPS |
Flags (no lock broken, but Matt should know): Rally the Pack extended to ravens (7.1); run-1 evolutions Legion and Halo change feel (both locked as run-1 content by gates, not by design text); CLAUDE.md nudge line is stale (B10); stat display names change (Rend, Watch, Wingbeat, Swiftness, Arc, Reach).

## 10. Build plan (one sitting each, data first, then code, tests, probes, screenshots)
Order = highest value first: broken promises, then what every player sees in run 1, then gated content.

| Chunk | What | Files | Tests / probes | Art |
|---|---|---|---|---|
| **W1 promises** | Halo zone at the hero's feet (stopgap); Murder Storm boss guard + fear once per 1.5 s; `addSpeedBoost` max; Dive claim set; wolf speed 110; CLAUDE.md nudge line (Matt's ok) | `weapons.js:200-209,222,376`, `Sim.js:169-172`, `weapons.json:11` | `evo-promises.test.mjs` (heal > 0, boss fear 0, dives distinct); probe-summons + probe-edge; 250-seed sweep (wolf speed is a run-1 change) | none |
| **W2 Rally the Pack** (LOCKED ability) | replace Pack Howl: converge + pin toughest non-boss 6 s, +50% summon dmg, no fear | `Sim.js:669-676`, `weapons.js:45` (howl), `characters.json:11` | ability-off within 5 points; boss pin 0; window DPS | pup howl, ember flare, converge lines |
| **W3 Candle Wheel** (LOCKED ability) | ring r 80, heal ~1.5 HP/s, orbs lock into sockets | `Sim.js:677-680`, `weapons.js:330-381` | ability-off within 5; heal only inside | wheel plant (elias-v2 10 keyframes) |
| **W4 Orbit guard** | contraction + Wheel Reach -> blast | `weapons.js:330-370` | hug scenario; kite DPS >= 95% of today; 250-seed sweep (run 1) | contraction flare, socket idle |
| **W5 Sanctum Halo** | consecrated disc + kill motes, ring trim | `weapons.js:338,372-379`, `evolutions.json:11` | heal 0.3-1.0 HP/s; swarm 2.0-2.3x; sweep | disc bloom, cream motes |
| **W6 Howling Legion** | echo wolves | `weapons.js:39,55-62`, `evolutions.json:3` | echoes <= Pack size; 1.8-2.1x; sweep | echo rise + translucent wolf |
| **W7 Wolves polish** | Rend stat, guard reflex, Pouncing chain-pounce, Dire Alpha split + size | `weapons.js:33-151`, `weapons.json:9-12`, `evolutions.json:2,4` | R1/R2/R5 probes | alpha pelt glow, leap arc |
| **W8 Ravens summon** | swoop/mark/return + mark in `Sim.hurt` | `weapons.js:154-227`, `Sim.js:183-190`, `weapons.json:15-27`, `tree.json` raven desc | rank-0 >= 9; mark share <= 8%; probe-builds | formation crescent, swoop, feather mark |
| **W9 Raven evolutions** | Murder Storm shove wall; Dive sky-dive shadow tell | `weapons.js` ravens, `evolutions.json:5-6` | hits taken >= 40%; boss shove 0 | storm ring, dive shadow |
| **W10 Bolts** | Swiftness; Soul Lance line + script ground + count lances | `weapons.js:230-264`, `weapons.json:36-41`, `evolutions.json:8` | maxed DPS +-5%; Lance >= 1.0x kite | glyph idle ring, script line |
| **W11 Chain** | first strike 1.5x, Arc decay, power +6; Static strikes; Judgment trim | `weapons.js:267-327`, `weapons.json:50-55`, `evolutions.json:9-10` | single >= 70 DPS; probe-builds Chain pairs >= 0.5x median | first-strike crack |
| **W12 balance pass** | all-gates sweep, pairs, pacing | data only | sections 8 acceptance | - |
Each chunk: npm test green, probes, true-size screenshots where visible, security + fit + lock-conflict check, then Matt playtests. Stop after each.

Right now: Matt reviews and decides 1-5. Next: W1 promise fixes (smallest, highest value, no art). Parked: summon stagger (D4), summon mastery (file 18 6.1), third evolutions for non-wolf weapons, life-map gameplay link (D7).

**Security check:** design only; read local docs/code/data, ran the existing read-only probes (no installs, no network, no repo changes besides this file). Future chunks touch no save fields (keys and ids unchanged, R9); tree text edits stay `textContent`; mark/echo state lives in the sim only.
**Fit check:** every weapon keeps its BIBLE colour and gets one readable verb tied to the Hollow (freed crows, freed wolves, consecrated ground, a guarding candle ring); evolutions change verbs within 1.8-2.3x, boss-safe, gold rim only; Wren's pack and pelt-alpha and Elias's candle wheel carry the hero fit.
