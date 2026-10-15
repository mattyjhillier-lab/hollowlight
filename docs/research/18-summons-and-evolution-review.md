# 18 Summons and evolution review

Question (Matt): "look at the summons and how they evolve - make sure they actually get the game and mechanically make sense."
Scope: the 5 v1 weapons, 11 evolutions, card pool, Wren/Elias abilities. Read-only review: no game code or data changed.
Code reviewed: `src/sim/weapons.js` (unchanged during review), `cards.js`, `Sim.js`, `src/data/*.json`. Note: another task added skill-tree hooks to `cards.js`/`Sim.js`/`balance.json` while this ran (bonus stats, `evoLuck`, summon `rush`, revive, regen). With no tree (`tree = null`) behaviour is unchanged, so all numbers below are tree-less.

## 0. Method and probes
New headless probes (Node built-ins only, they import the real `Sim` and data; test-only enemy types are added in memory):

| Script | What it does | Runtime |
|---|---|---|
| `node scripts/probe-summons.mjs [filter]` | Every weapon at rank 0, all-max, each evolution (all-max) and each evolution with only its pair maxed. 8 scenarios: `idle` (no enemies), `idleRun`, `single` (static 1e9 HP dummy at 30 px), `far` (dummy at 190 px), `swarm` (60 real wolves/crows at minute 8 = ~61/25 HP, refilled from a 160-220 px ring, player still), `swarmRun` (same, player runs a fast circle), `kite` (same, bot-style flee), `boss` (real Elder Treant, player still). Logs effective DPS (overkill removed), overkill %, hits/s, kills/s, hits taken/s, units alive, unit distance from player (avg/max), % offscreen, AI state mix, bolts fired/wasted, boss fear/pin uptime, dive stats. God mode, drops off. | 13 s |
| `node scripts/probe-edge.mjs` | Pack Howl multiplier, Legion howl vs Pack Howl, Sanctum Halo healing, orbit "donut hole" by distance, boss TTK while kiting, stat value after evolution, base stat value while kiting. | 40 s |
| `node scripts/probe-builds.mjs [cardRuns] [seeds]` | A: card-system Monte Carlo (no combat), random vs focused picker. B: full runs with fixed weapon sets (all 5 solos + 10 pairs, Wren body, bot movement, focused stat picks, no other weapons). | 10 min |

Caveats: bot movement is crude (flees within 90 px); 12 seeds per build is +-14 points of noise; headless only, so nothing here checks what the renderer shows.

## 1. What each weapon and evolution actually does (from code)

### 1.1 Base weapons
| Weapon | Real behaviour | Hit rule | Stats actually used |
|---|---|---|---|
| Ghost Wolves (summon) | Real AI. Each wolf picks the nearest enemy within 170 px of itself AND 150 px of the player, preferring targets no other wolf has (re-picks every 0.4 s). Runs at `speed`, bites on contact every 0.6 s, applies bleed (35% of bite/s). No target: circles the player at 24 px at max(speed,110)x1.2. | Bite + bleed. Bleed takes the max, never stacks, and is refreshed every bite. | count, power, speed, duration |
| Raven Flock (summon) | **No AI.** Ravens are fixed points on a ring at `range`, rotating at `speed` rad/s, teleported every frame. Contact hit, per-raven, per-enemy cooldown 0.55 s. | Contact | count, power, range, speed |
| Spirit Bolts (magic) | Every 1.1 s (fixed, no cooldown stat) fires `count` homing bolts at the nearest enemies within 210 px; extra bolts fan out. Turn rate 5 rad/s, life 2.4 s, `pierce`. | Projectile | count, power, speed, pierce |
| Chain Lightning (magic) | Every `cooldown` s, strike nearest enemy within 220 px, jump to nearest unhit enemy within `area`, `chains` hits, -5% per jump (floor 50%). | Instant | chains, power, cooldown, area |
| Holy Orbit (magic) | Same as Raven Flock: points on a ring at `radius`, spin `speed`, per-orb per-enemy cooldown 0.5 s. | Contact | count, power, radius, speed |

### 1.2 Evolutions
| Evolution (pair) | Real behaviour | New verb? |
|---|---|---|
| Pouncing Pack `phantom_stampede` (speed+power) | Wolf more than 12 px and less than 110 px from its target leaps (0.28 s): 1.8x hit + bleed, pins non-boss 1 s, then sits on it mauling 0.45x every 0.2 s for 1 s. Leap cooldown 1.8 s. x1.1 dmg and speed. | Yes (leap, pin, maul), but rarely seen while wolves are already in contact. |
| Howling Legion (count+duration) | Pack = round(count x1.4)+1 = 11 wolves, x1.25 dmg, x1.3 bleed. Every 6 s: player +20% move speed for 3 s. | No: more wolves plus a passive buff. |
| Dire Alpha (power+duration) | 1 wolf, radius 11, x3.2 dmg, bite every 0.45 s hits every enemy within 24 px (cleave), x1.5 bleed. | Yes (one big cleaver). |
| Murder Storm (count+range) | min(16, 2xcount) ravens on two counter-rotating rings (1.8x range and 0.55 of that), contact applies 0.3 s fear (enemy runs away at 1.3x speed). | Yes (fear wall). |
| Dive Bombers (speed+power) | Each raven, every 2.4 s, dives at the **toughest** enemy within 170 px of the player at 230 px/s: 6x hit + 2x splash (18 px), then returns. Keeps pecking while orbiting. | Yes (hunting dives). |
| Spirit Tempest (count+speed) | 8 bolts (fixed) every 0.8 s in a rotating radial burst, then homing; explode (22 px, 0.6x) on last pierce or at end of life. x1.4 speed. | Yes (burst + explosions). |
| Soul Lance (power+pierce) | 1 non-homing bolt (r 12, x8 dmg, infinite pierce, x1.3 speed) every 1.1 s at the nearest enemy. | Yes (line shot). |
| Thunder Judgment (chains+power) | Normal chain with 9 jumps, plus every 3 s a 0.9x smite on up to 30 enemies within 260 px. | Partly (periodic screen smite). |
| Static Storm (cooldown+area) | Replaces the chain: every ~0.16 s (at max cooldown rank), 4 random enemies within 110+0.8xarea px take 0.5x. | Yes (field). |
| Sanctum Halo (count+radius) | 2xcount orbs (max 14), radius x1.6 (109 px at max). Every 1.5 s a random orb drops a 22 px zone for 4 s: power DPS, heals 0.8 HP/s **only if the player stands in it**. | Yes (holy ground). |
| Judgement Wheel (power+speed) | Spin x1.8; an orb that touches an enemy explodes (34 px, 1.8x) and is gone for 1 s. | Yes (explode and re-form). |

### 1.3 Bugs, mismatches and dead states (with evidence)
| # | Finding | Evidence | Severity |
|---|---|---|---|
| B1 | **Sanctum Halo "heals you slowly" does almost nothing.** Zones spawn at an orb (109 px out, r 22), never under the player. | Standing still 60 s: **0 HP healed**, 0% of the time on a zone. Walking a small circle: 3.5 HP per 60 s (7% on a zone). | High (description is false) |
| B2 | **Murder Storm fears the boss.** Pack Howl and Pouncing Pack both skip bosses; ravens do not. | Boss feared 46% (standing) / 57% (kiting); boss scenario hits taken 0.00/s; Treant TTK 60-113 s. | High (boss can be locked away) |
| B3 | **Pack Howl is about 3.7x wolf DPS, not "twice as fast".** Code doubles speed, halves bite gap AND doubles damage. | Single dummy: base 269 to 1001 (x3.72); Legion 524 to 1955; Dire 179 to 654. | Medium (text or numbers) |
| B4 | Howling Legion's howl overwrites Pack Howl's speed bonus (`addSpeedBoost` sets the multiplier, it does not take the max). | During Pack Howl: 1.25 to 1.2 at +4 s. | Low |
| B5 | Stats that do nothing after evolving, but whose ranks were already paid for: Dire Alpha `count`, Soul Lance `count` (and `speed` barely matters), Static Storm `chains`. | Dropping the stat 5 to 0 after evolving: 0% DPS change. Card Monte Carlo: random pickers have 4.6 non-pair ranks spent at evolve (focused 2.5). | Medium (feels bad if noticed) |
| B6 | Judgement Wheel's `radius` is negative on a crowd. | Radius 5 to 0 = +97% DPS on clustered dummies. Pair-only Wheel (radius rank 0) does 603 DPS standing vs 179 for the fully maxed one. | Medium |
| B7 | `evoHints` is computed for every stat card (`cards.js` `statCard`) but the UI never shows it. | `ui.js` `showLevelUp` renders pips only. | Low (dead code / missed hint) |
| B8 | Dive Bombers: every raven picks the same "toughest" enemy, so 46% of dives go to a target another raven is already diving. Diving ravens stop pecking. | swarm: 66 dives, 31 on an already-claimed target, overkill 35%. | Low-medium |
| B9 | Base wolf speed 90 < Wren 105.6 px/s, so at rank 0 wolves fall behind when you run. | swarmRun r0: wolves idle 68%, longest chase 5.4 s, max 214 px from player, 6% offscreen. Rank 5 (160): max 170 px, 0% offscreen. | Low |
| B10 | CLAUDE.md says the nudge is x2.2 then x2 at partner rank 3; `balance.json` is `pair 4, partnerRank 2, partnerMult 3`. Every stat of every weapon is in some pair, so the `pair` weight multiplies every stat card. It only changes stat vs new-weapon odds (4:4), not which stat. | `buildPool` + `evolutions.json` | Low (doc drift) |
| B11 | Murder Storm description says "sends enemies fleeing"; fear is 0.3 s, which reads as a shove, not a flee. | tune `fear: 0.3` | Low |

Checked and fine: Dive Bombers return bug is fixed (worst return 1.03 s, every raven rejoins). No summon ever got stuck. Nothing went offscreen except rank-0 wolves (B9). With no enemies, every summon idles cleanly next to the player (wolves circle at 24 px, Dire Alpha at 34 px). Nothing fires at nothing: bolts and chains wait 0.15 s between checks.

## 2. Measured behaviour (effective DPS, overkill removed)
Columns: single dummy / standing swarm / kiting swarm, then boss TTK while kiting (3000 HP, adds from slams). Ratio = vs the maxed base. Target from 08: 1.8-2.3x, cap 3x.

| Weapon / evo | single | swarm | kite | ratio (s/sw/k) | boss TTK kite | notes |
|---|---|---|---|---|---|---|
| Ghost Wolves max | 269 | 289 | 252 | - | 22 s | 7 wolves, 6.9 distinct targets |
| Pouncing Pack | 299 | 330 | 371 | 1.11/1.14/1.47 | 10 s | leap 4-13% of time; pin never on boss |
| Howling Legion | 524 | 520 | 453 | 1.95/1.80/1.80 | 11 s | 11 wolves |
| Dire Alpha | 176 | 697 | 244 | 0.65/2.41/0.97 | 22 s | 44% overkill |
| Raven Flock max | 0 | 83 | 201 | - | >120 s (77%) | donut hole, see 2.1 |
| Murder Storm | 0 | 1083 | 1083 | -/13/5.4 | 60 s | **0 hits taken** (others 2.2/s standing) |
| Dive Bombers | 226 | 246 | 212 | inf/3.0/1.05 | 16 s | only raven option that hits bosses |
| Spirit Bolts max | 108 | 715 | 671 | - | >120 s (82%) | adds soak bolts (nearest-first) |
| Spirit Tempest | 164 | 1375 | 1374 | 1.52/1.92/2.05 | 11 s | 65% of bolts miss a lone target |
| Soul Lance | 216 | 649 | 257 | 2.0/0.91/**0.38** | 14 s | **84% overkill** in swarms |
| Chain Lightning max | 44 | 214 | 201 | - | 74 s | weakest base on single targets |
| Thunder Judgment | 56 | 495 | 509 | 1.27/2.31/2.53 | 57 s | |
| Static Storm | 110 | 347 | 345 | 2.5/1.62/1.72 | 29 s | |
| Holy Orbit max | 0 | 234 | 244 | - | >120 s (90%) | donut hole |
| Sanctum Halo | 0 | 873 | 450 | -/3.7/1.84 | 26 s | heal ~0 (B1) |
| Judgement Wheel | 0 | 179 | 637 | -/0.76/2.6 | 29 s | radius hurts it standing (B6) |

Rank 0 (just picked up), kiting swarm: Wolves 26, Bolts 8, Chain 11, **Ravens 2, Holy Orbit 3**. A fresh Raven Flock or Holy Orbit is close to useless against a crowd that reaches you.

Evolving with only the pair maxed (the realistic focused case), standing swarm: Tempest 710, Dire 724, Wheel 603, Thunder 407, Legion 201, Murder 193, Dive 179, Static 129, Pouncing 91, **Sanctum Halo 30**. Evolutions whose pair has no power stat (Sanctum, Static, Murder, Legion) arrive weak unless power was also levelled. Nothing tells the player that.

### 2.1 The orbit "donut hole" (systemic)
Enemies collide with each other but not with the player, so a crowd that reaches you piles onto your centre. Orbit hitboxes only touch a thin band:

| Weapon | DPS vs dummy at distance d = 0/15/30/45/60/75/100/130 px |
|---|---|
| Holy Orbit max (r 68) | 0 / 0 / 0 / 0 / 135 / 135 / 0 / 0 |
| Judgement Wheel | 0 / 0 / 0 / 0 / 243 / 243 / 0 / 0 |
| Sanctum Halo (r 109) | 0 / 0 / 0 / 0 / 0 / 0 / 270 / 0 |
| Raven Flock max (r 75) | 0 / 0 / 0 / 0 / 0 / 85 / 0 / 0 |
| Murder Storm (74 / 135) | 0 / 0 / 0 / 0 / 0 / 90 / 0 / 90 |

So the radius stat is good while kiting (dropping it costs -83% Holy Orbit DPS, -85% Ravens) but useless once something sits on you, and a boss that reaches you takes about 0 damage from all four orbit weapons. Bigger radius makes the hole bigger. Two of five weapons (three of the 11 evolutions, plus Murder Storm) depend on the player kiting perfectly.

### 2.2 Stat cards that barely matter
Maxed weapon, one stat at 0 instead of 5, kiting swarm: Bolt speed -8%, Jump range -10%, Bleed time -10% (and 0% on a single target, because bites keep refreshing a bleed that never stacks). All other stats are -23% to -85%. These three are near-dead cards that are still needed for evolution pairs (Spirit Tempest, Static Storm, Legion/Dire Alpha).

## 3. Summoner fantasy audit
| Weapon | Truly a summon? | Identity / AI | Risk / HP | Positioning | Synergy |
|---|---|---|---|---|---|
| Ghost Wolves | **Yes** | Hunts, claims targets, chases, bites, returns to heel. Pouncing Pack and Dire Alpha add body language. | None (invulnerable) | 150 px leash. Spreads well (6.9 targets for 7 wolves). | Pack Howl (wolves only). Legion howl speeds the player. |
| Raven Flock | **No**: a rotating hitbox ring, the same code shape as Holy Orbit (count/power/radius/spin, hit cooldown 0.55 vs 0.5) | None until Dive Bombers | None | Locked to the player | None. Tree `rush` will count it as a summon (type label only). |
| Spirit Bolts / Chain / Holy Orbit | Magic (correct) | - | - | - | Elias +15% holy (Bolts, Orbit) |

Verdict: **only 1 of 5 base weapons (Wolves) plus 1 evolution (Dive Bombers) play as summons.** The player commands nothing: summons ignore the player except for leash and heel. There are no summon-to-summon synergies and no risk, and the only hero-to-summon link is Pack Howl. For a game whose identity is "spirits restore the Hollow", the allies have the least personality of anything on screen. Wolves are the good template.

How other games do it (labels as in 01):
- Spirit Hunters: pets are passive companions next to up to 4 abilities (COMMUNITY, seasonedgaming review, cited in 03).
- Vampire Survivors: most "summon-looking" weapons (e.g. the bird pair Peachone/Ebony Wings) are really area patterns tied to the player, not minions with AI (RECALLED).
- Brotato: Engineer-style builds use stationary, untargetable structures scaled by one dedicated stat (Engineering), so a summoner build is a stat commitment (RECALLED).
- Soulstone Survivors, Halls of Torment, Death Must Die: I could not verify their summon mechanics offline, so no claims.
- OPINION (genre practice, see 03): summons feel satisfying when they (1) visibly choose targets, (2) have a signature move with windup, (3) react to the hero's button, (4) scale with a summon-only stat or perk, and (5) rarely need babysitting. Wolves already do (1)-(2). Nobody does (3) except Pack Howl, nothing does (4) yet (tree `rush` is a start), and (5) holds.

## 4. Evolution design audit
Columns: is the pair thematic? / new verb? / readable when unlocked? / distinct from its siblings? / still fun later? / power (from section 2).

| Evolution | Pair fits? | Verb | Readable at unlock | Distinct | Stays fun | Power | Notes |
|---|---|---|---|---|---|---|---|
| Pouncing Pack | Yes (speed+power = predator) | Yes | Weak: wolves already in contact never leap (needs more than 12 px), so on unlock it often looks the same | Medium | Medium | 1.1-1.5x, under target | Pin does nothing to bosses |
| Howling Legion | Yes (count+duration) | **No** | Yes (visibly more wolves) | Low (it is base wolves x1.6) | Low | 1.8-1.95x | Speed howl is invisible as a summon effect |
| Dire Alpha | OK (power+duration) | Yes | **Strong** (7 wolves become 1 giant) | High | High | 0.65x single, 2.4x crowd | Count stat goes dead (B5) |
| Murder Storm | Yes (count+range) | Yes | Yes | High | Risky: an invulnerable wall gets boring | **5-13x, no hits taken** | Fears the boss (B2) |
| Dive Bombers | Yes (speed+power) | Yes | Yes | High | High | 1.05-3x, only raven boss option | Shares targets (B8). Best "summoner" moment |
| Spirit Tempest | Yes | Yes | Yes | High | High | 1.5-2.05x | Gold standard |
| Soul Lance | Yes (power+pierce) | Yes | Yes | High | **Low**: one shot per 1.1 s on a crowd of 60 HP enemies, 84% wasted | 0.38-0.91x in crowds, 2x single | Fine boss tool |
| Thunder Judgment | Yes | Partly | Yes (screen-wide smite every 3 s) | Medium | Medium | 1.3-2.5x | |
| Static Storm | Yes (cooldown+area) | Yes | Yes | High | Medium | 1.6-2.5x | Chains go dead (B5). Weak with only the pair |
| Sanctum Halo | Yes | Yes | Half: the promised heal does not happen (B1) | Medium | Medium | 1.8-3.7x, but 30 DPS with only the pair | |
| Judgement Wheel | OK | Yes | Yes | High | Medium | 0.76x standing, 2.6x kiting | Radius hurts (B6) |

**Weakest 3:** (1) **Soul Lance**: one shot is wasted on a horde, and it falls below the base weapon (0.38x kiting). (2) **Howling Legion**: no new verb, and its only new effect (the player speed howl) has nothing to do with the wolves. (3) **Pouncing Pack**: the verb exists but triggers rarely (13% of wolf time even while kiting) and it is the lowest-power evolution (1.1-1.5x). Honourable mention: Sanctum Halo, because of B1.
**Strongest 3 (design):** (1) **Dive Bombers**: turns a hitbox ring into hunters, readable, and it fixes the ravens' boss problem. (2) **Spirit Tempest**: clear burst and explosions, on target (2x). (3) **Dire Alpha**: the most dramatic unlock, with a clear role (horde cleaver). **Murder Storm** is the most distinct but currently broken strong (an invulnerable wall, it fears bosses).

### 4.1 Discoverability and build decisions
- The rule "max two specific stats" is never told to the player. Cards show 5 pips only; `evoHints` is not shown (B7); there is no codex yet. The hidden nudge (x3 for a stat whose partner is at rank 2+) shapes offers, but a player cannot see it working.
- Card Monte Carlo (4000 runs to level 48, Wren start): random clicker first evolution at median **level 42** (p10 28, p90 never). Focused picker: median **level 19** (p10 15, p90 26). That gap is the whole skill of the system. A new player who doesn't know the rule gets roughly one evolution late in the run, or none.
- Sibling choice almost never happens on screen: offers showing 2+ evolutions at once were 0.05-0.09 per run. Which wolf evolution you get is decided by the order stats came up, not by a choice. Shared stats (wolves: power in Pouncing+Dire, duration in Legion+Dire) mean the first pair to finish wins silently.
- Real build decisions exist only for players who already know the recipes (which pair to chase, whether to skip a gold card). That is OK for a codex-driven game, but v1 has no codex, so today it is luck for most players.

## 5. Systemic issues
| Area | Finding |
|---|---|
| Card pool | Weapon cards (weight 4) and stat cards (weight 4, because every stat sits in a pair) are equal per card. With 3 open slots, early offers are mostly new weapons, so the slot-filling order is luck-driven. No fallback-only offers before level 48 in the Monte Carlo (pool never runs dry in a 15-min run). |
| Reroll/banish | Tree unlocks (with tree bonuses now in `Sim`). They are the only levers that turn the hidden recipes into deliberate builds, so their early tree cost matters. |
| Dead/weak stats | Near-dead: Bolt speed, Jump range, Bleed time (section 2.2). Dead after some evolutions (B5). Negative: Wheel radius (B6). |
| Rank ceiling | 5 ranks x 4 stats = 20 picks per weapon, 10 for an evolution. Evolved weapons leave the pool, so the late run has fewer cards per level, which is fine. |
| Character kit | Pack Howl is a strong summon command (3.7x, B3) but only for wolves. With Ravens/Orbit/Bolts it is just speed + fear. Sanctuary (Elias) has no link to any weapon. |
| Builds (probe B, Wren body, only these weapons, focused picks, 12 seeds) | Win% / boss-kill%: Wolves 25/25, Wolves+Ravens 0/33, Wolves+Bolts 25/67, Wolves+Chain 25/42, Wolves+Orbit 17/42, Ravens 75/**0**, Ravens+Bolts 50/33, Ravens+Chain **8**/17, Ravens+Orbit 75/**0**, Bolts 8/33, Bolts+Chain 33/67, Bolts+Orbit 25/50, **Chain 0/0**, **Chain+Orbit 0**/17, Orbit 75/**0**. |
| What that shows | (a) Chain Lightning builds are the weakest (0-25% win). (b) Orbit-only builds (Ravens, Orbit, Ravens+Orbit) **win 75% while never killing the boss and never evolving**: the ring keeps a fleeing bot safe but kills too little to level. Victory is survive-to-15:00, so the boss is optional and a boring turtle build is the safest one. (c) Ravens+Chain is the trap pair (8%). |
| Late-run boredom | Murder Storm (nothing reaches you) and orbit turtling are the boredom points. Soul Lance is the "my evolution got worse" point. |

## 6. Recommendations (keep the locked design)
Effort: S = under 1 hour, M = half a day, L = multi-day. Impact: H/M/L.

### (a) Bugs / unclear behaviour: fix now
| # | Change | Impact | Effort |
|---|---|---|---|
| A1 | Sanctum Halo: drop the holy-ground zone at the player's feet (or under the nearest orb to the player), or heal per orb hit. Keep 0.8 HP/s. Fixes B1. | H | S |
| A2 | Murder Storm: skip bosses for fear, like Pack Howl/Pouncing (B2). | H | S |
| A3 | Pack Howl: make the text match ("wolves move, bite and hit twice as hard") or remove the damage x2 (gives ~1.9x). Recommend the text: it is Wren's signature moment. | M | S |
| A4 | `addSpeedBoost`: keep the larger multiplier while a boost is active (B4). | L | S |
| A5 | Dive Bombers: give ravens a claim set like wolves, so a second raven picks the next-toughest enemy (B8). | M | S |
| A6 | Update CLAUDE.md nudge numbers; note that `pair` weight applies to every stat (B10). | L | S |
| A7 | Add a test per evolution: "description promise holds" (heal > 0 for Halo, boss never feared, Dire Alpha single target > 0, etc.) so tuning cannot silently break them. | M | S |

### (b) Tuning (data only, `evolutions.json` / `weapons.json`)
| # | Change | Expected effect | Effort |
|---|---|---|---|
| T1 | Murder Storm: fear once per enemy per ~1.5 s (canHit-style key), or fear from the outer ring only. Target: 2-3x and some enemies leak through. | Removes the invulnerable wall | S |
| T2 | Soul Lance: cd 1.1 to 0.7 and dmg 8 to 5, or a 2-lance fan. Target kite at least 1.5x. | Less overkill | S |
| T3 | Pouncing Pack: allow re-pounce onto a *new* target straight after a maul (no gap requirement), maul 0.45 to 0.6. | Verb visible, ~1.8x | S |
| T4 | Chain Lightning base: power +5 to +6 per rank, or base cooldown 1.6 to 1.4. Re-run probe B. | Lifts the worst builds | S |
| T5 | Raven Flock / Holy Orbit rank 0: a smaller start radius (30-32) so the first pick hits huggers, and/or orb radius r 4 to 6. | Fresh pick is worth taking | S |
| T6 | Near-dead stats get a second effect: Bolt speed also adds +1 turn rate per rank; Jump range at rank 5 adds +1 chain; Bleed time lets bleed stack 2x. | Removes trap cards | S-M (small code) |
| T7 | Base wolf speed 90 to 110 (Wren is 105.6). | Rank-0 wolves keep up | S |

### (c) Design changes: need Matt's decision (my recommendation in bold)
| # | Proposal | Why | Cost / risk |
|---|---|---|---|
| D1 | **Make Raven Flock a real summon.** Ravens orbit until an enemy enters range, swoop-peck it, then return (a light, fast, non-splash version of Dive Bombers). Dive Bombers keeps the big dives on the toughest enemy. | Removes the Holy Orbit clone and the donut hole; gives 2 of 5 weapons real AI. | M. Changes base feel; re-tune Murder Storm. |
| D2 | **Evolution legibility without spoiling recipes.** When a stat's partner is at rank 3+, the stat card gets a faint gold edge plus "Something stirs..." (uses `evoHints`). At unlock, the gold card names the two stats that unlocked it. Show a one-time toast "Each weapon can evolve once. Max two stats to discover evolutions." Recipes stay hidden; the *rule* becomes visible. | A random picker evolves at level 42 vs 19 for a focused one. | S-M. Codex later builds on it. |
| D3 | **Order instead of HP: summons react to the hero's ability.** Keep summons invulnerable (03: babysitting is a chore). Add a generic "Rally" effect to every ability for `summon` weapons, e.g. Sanctuary makes summons return and guard the zone (+X% dmg inside), Pack Howl as now. Later characters get their own. | Makes Space feel like commanding spirits. | M. Adds per-ability code. |
| D4 | **Summon stagger instead of death.** Boss slams and elite charges knock summons down for 2-3 s (with a visible fade), then they rise. | Risk and readability with no management. | S-M |
| D5 | **New verbs for the weakest.** Howling Legion: every 6 s the howl marks the toughest nearby enemy and the whole pack converges and pins it (move the player-speed buff into the howl's flavour). Pouncing Pack: see T3. Soul Lance: the lance leaves a 1 s spirit trail that damages (line zone). | Every evolution changes the verb (08 goal). | M each |
| D6 | **Dead stats after evolution become meaningful.** Dire Alpha: count ranks scale size/cleave radius. Static Storm: chains ranks add strikes per tick. Soul Lance: count ranks add lances (max 3). | No wasted ranks | S-M |
| D7 | **Hollow link (gameplay; needs Matt's explicit OK per IDENTITY).** Summons standing on restored ground get +10% damage / +10% speed; corrupted ground slows them. | Ties the identity to the summoner fantasy. | L: the life-map is visual-only today; the sim would need to own a coarse grid (it is deterministic and testable in Node, but adds per-frame cost). Recommend: park until the life-map ships. |
| D8 | **Donut hole.** Either soft player-enemy separation (enemies stop at contact range, so the crowd forms a ring the orbits can hit) or orbits that "breathe" (radius pulses between 50% and 100%). | Fixes 2 weapons and 4 evolutions, and boss damage from orbits. | M. Separation changes enemy feel globally; the pulse is local. Recommend the pulse. |
| D9 | **Victory needs the boss or the 15:00 survive is worth less.** Orbit turtle builds win 75% with no boss kill and no evolution. | Removes the dull safest strategy | S code, design-sensitive |

### 6.1 Proposal: summon mastery (idea only, not approved)
- In-run: each summon weapon counts its own kills (`hurt` needs a source id, small change). Tiers at 100 / 300 / 800 kills give a visible change plus a small perk. Wolves: eyes glow, then +1 bleed stack, then howl on kill streaks. Ravens: a trail, then +1 swoop target, then feathers that briefly fear. Never a stat wall; it only upgrades the summon's personality.
- Meta: lifetime kills per summon unlock its codex page and one hint for one of its evolutions ("The pack grows restless when it is fast and strong..."). This works with hidden recipes and gives a reason to play each summon.
- Cost: M (counter + 3 tiers x 2 summons + UI badge). Risk: power creep; cap the perk at roughly 10% DPS.

## 7. Priority order (my recommendation)
1. A1, A2, A3, A5 (bugs/promises). 2. T1, T2, T3, T4 (outliers and weakest). 3. D2 (legibility, cheap and high impact). 4. D1 + D8 (real raven summon, donut hole). 5. D5/D6. 6. D3/D4, then mastery and D7 when Matt wants more summoner depth.
Re-check after any change: `node scripts/probe-summons.mjs`, `node scripts/probe-edge.mjs`, `node scripts/evo-dps.mjs`, `node scripts/sweep-all.mjs 48`, `npm test`.
