# Evolutions, weapon stats and status effects: review (2026-10-16)

Status: RESEARCH + DESIGN REVIEW, NOT LOCKED. Nothing in src/ changed. Covers Matt's three QUEUE requests of 2026-10-16 (in-depth evolutions review, weapon stat upgrades review, status effects + tree power nodes). Research: docs/research/35-evolutions-desire.md. Builds on the LOCKED working spec docs/design/weapons-and-summons-v1.1.md (W-chain, not yet built except W1a, W1b speed, W3): where v1.1 already fixes something, this review says "covered by Wx" and only adds what is missing (mostly desirability, card text, feedback, status rules).

## 0. Evidence (all reproducible, god mode, no waves unless stated)
| Script | What | Seeds / noise |
|---|---|---|
| `node scripts/evo-same-ranks.mjs 20 3` | evolution vs base at the SAME ranks, single / stream10 / stream40, ranks `max` and `pair` (pair maxed, others rank 1 = first-unlock moment) | 3 seeds x 20 s; ratios move ~+-5% |
| `node scripts/probe-summons.mjs` | all weapons + evolutions in single / swarm / kite / boss (+ hits taken, unit states) | 1 seed x 20-120 s; +-10% on swarm/kite |
| `node scripts/probe-edge.mjs` | stat 5 -> 0 sensitivity (kite), orbit distance profile, boss TTK | 1 seed |
| `node scripts/stat-ranks.mjs 2 2` (NEW) | every stat at rank 0..5 with the other 3 at rank 2; bleed share; wolf coverage (distinct targets, leap/maul time) | 2 seeds x 20-25 s; +-5-10% per cell |
| `node scripts/stat-ablate.mjs <hero> 48` (NEW) | full bot runs (starter gates, Blessings on) with one stat of the hero's own weapon removed from every offer; how often each stat is SHOWN | 48 seeds; win% 95% CI about +-10 points |

"Home" = the scenario the evolution is built for (v1.1 section 4). Ratios below are at max ranks unless "pair".

## 1. Summary table: 11 evolutions

| Evolution (id) | Weapon / pair | Gate | Home | Home ratio now (target) | Floors / cap breaks | Desire problems | Verdict |
|---|---|---|---|---|---|---|---|
| Pouncing Pack (`phantom_stampede`) | Wolves / speed+power | tree | kite | **1.56x** (1.9-2.2) | single 1.10x (>=1.2 fails); boss 1.44x | leap barely visible (0.28 s, 3% of time when standing); half its pair is a dead stat (speed) | **TUNE** (W7b + speed becomes leap stat) |
| Howling Legion (`howling_legion`) | Wolves / count+duration | run 1 | swarm/kite | **1.95x / 2.06x** (1.8-2.1) | single 1.94x ok | no new verb ("more wolves"); pair pulls players into the dead Bleed time stat | **REWORK as locked** (W6 echo wolves) |
| Dire Alpha (`dire_alpha`) | Wolves / power+duration | tree | swarm | **3.28x** (2.0-2.5; **over 3x cap**) | single 0.65x, boss 0.70x (**below base**); pair stream40 5.16x | you lose 6 of 7 wolves: coverage collapses to 1 target | **REWORK** (5.4x primary + trimmed cleave, or alpha + 2 shades) |
| Murder Storm (`murder_storm`) | Ravens / count+range | tree | swarm | 14.5x vs today's broken base ravens (2.0-2.5) | boss ~0 | ratio meaningless until base ravens work (W8a) | **TUNE after W8a/W9** |
| Dive Bombers (`dive_bombers`) | Ravens / speed+power | tree | boss | base ravens do ~1 boss DPS, so "INF"; swarm 5.8x | - | strong verb, no tell (shadow planned W9) | **KEEP verb, re-measure after W8a** |
| Spirit Tempest (`spirit_tempest`) | Bolts / count+speed | tree | kite | **2.24x** (2.0-2.3) | single 1.52x, boss 1.94x; pair stream40 3.59x | fine; pair includes dead Bolt speed | **KEEP** (+card/visual) |
| Soul Lance (`soul_lance`) | Bolts / power+pierce | tree | single/boss | single **2.0x**, boss **0.92x** | kite 0.68x, swarm 0.98x (**below base**); count+speed ranks dead after evolving | one big bolt reads as "I lost my bolts"; 80% overkill | **REWORK** (W10 step 1+2 together) |
| Thunder Judgment (`thunder_judgment`) | Chain / chains+power | tree | kite | **2.77x** (2.0-2.5) | single 1.27x, boss 1.06x; pair stream40 3.48x | strongest "wow" verb; slightly over | **TUNE** (W11 smite 0.9 -> 0.75) |
| Static Storm (`static_storm`) | Chain / cooldown+area | tree | swarm | **2.06x** (1.8-2.3) | single 2.6x; chains ranks dead after evolving; pair 3.7x | random strikes feel aimless | **TUNE** (W11 strikes from chains) |
| Sanctum Halo (`sanctum_halo`) | Orbit / count+radius | run 1 | swarm | **4.54x** (2.0-2.3; **over cap**) | boss 0 DPS; heals ~0-2.6 HP/min while text says "heals you slowly" (**untrue**) | promise not kept; ring so wide nothing near you is hit | **REWORK as locked** (W5, text fix now) |
| Judgement Wheel (`judgement_wheel`) | Orbit / power+speed | tree | kite | **3.63x** (2.0-2.3; **over cap**) | swarm 1.07x, boss ~2 DPS; Orbit size ranks make it WORSE (+97% DPS at radius 0) | trap stat after evolving | **TUNE** (W4 radius->blast + dmg 1.8 -> ~1.3) |

Cross-cutting finding A (cap at the moment of picking): at "pair" ranks (the moment the card first appears) 5 evolutions are 3.5-5.2x their base in some scenario (Dire Alpha, Soul Lance, Spirit Tempest, Static Storm, Thunder Judgment). The locked 3x cap is today only checked at max ranks. See decision 2.

Cross-cutting finding B (dead stats feed evolutions): 4 of 20 stats do almost nothing (wolf speed, bleed time, bolt speed, chain jump range) and 4 evolution pairs need one of them (Pouncing, Legion, Dire Alpha, Spirit Tempest, Static Storm). The hidden evoNudge (x4, then x12) pushes those dead cards hardest: in run 1 Wren is SHOWN Bleed time on 35% of her wolf stat cards (Bite power only 15%), because it is half of Howling Legion's pair. That is why Matt "could not tell what it was doing": he was offered it most and it does least.

## 2. Matt's example answered: Pouncing Pack coverage
- Trigger: automatic. Each wolf leaps when its own target is 12-110 px away and its leap cooldown (1.8 s) is ready; landing hits 1.8x + bleed, pins a non-boss 1 s, then the wolf mauls it (0.45x every 0.2 s for 1 s).
- Do all wolves pounce one enemy? **No** in a crowd: the claim set spreads targets; measured 6.7 distinct targets for 7 wolves while kiting (base pack 6.8). They only share when there are fewer enemies than wolves (boss: all 7 leap and maul the boss, which is the right outcome; boss is never pinned).
- Coverage cost: 18% of wolf-time is spent leaping (11%) or locked mauling (7%) while kiting; wolves leap up to 110 px from their spot. Hits taken while kiting did not rise (0.14/s vs base 0.18/s) because a pinned enemy is not walking at you.
- The real problems: the leap is short and rarely seen (standing in a crowd wolves are already touching their prey: 3% leap time), the power gain is small (kite 1.4-1.56x, single 1.10x), and Wolf speed (half the recipe) is a dead stat.

## 3. Per-evolution findings and options

### 3.1 Pouncing Pack (`phantom_stampede`), Wren, tree gate, recipe Wolf speed + Bite power
Fantasy: wolves hunt like wolves: stalk, leap, pin, maul. Hero fit: excellent (Wren's pack, her pup pounces). Card: "LEAP - pin and maul". Payoff now: invisible; power 1.10-1.56x.
Options: (a) **v1.1 W7b chain-pounce** (leap cd resets on a kill, else 1.8 s) + leapHit 1.8 -> 2.4 + a visible pin (blue paw ring on the pinned enemy) + leap from any distance >= 12 px including straight after a kill (so it reads in a crowd); (b) (a) plus Wolf speed ranks after evolving = leap range +10 px and leap cd -0.1 s per rank, so the recipe stat stays alive (R4); (c) replace with "Moon Hunt" (wolves spread out in a wide ring and drag stragglers in): new verb, more code, weaker fit with the pin.
**Recommend (a)+(b)**. Acceptance: kite 1.9-2.2x, single >= 1.2x, distinct targets >= 85% of pack size, boss never pinned. Code chunk (weapons.js wolves) + data (`tune.leapHit`).

### 3.2 Howling Legion (`howling_legion`), run 1, recipe Pack size + Bleed time
Power on target (1.94-2.06x) but no new verb; the player-speed howl is easy to miss. Locked fix: **W6 echo wolves** (kills by the pack rise as translucent echo wolves, 0.7x bite, cap = Pack size, pack x1.2). Add: card verb "ECHO - fallen prey rise as pack" (today: LEGION/howl of speed), and when W7 Rend lands the recipe's second stat becomes Rend, which is no longer dead. **Recommend keep the locked W6** and fix its card text in the same chunk. Risk: W6 removes the speed howl (hidden nerf): sweep.

### 3.3 Dire Alpha (`dire_alpha`), tree gate, recipe Bite power + Bleed time
Swarm 3.28x (over cap) but single 0.65x / boss 0.70x (under base) and kite 1.35x: one wolf cannot cover a crowd you run from. Options: (a) **v1.1 numbers** (primary 5.4x bite, cleave others 2.2x, bite gap 0.45) which fixes single (~1.1x) and lowers swarm toward ~2.3x; (b) (a) + two small "shade" wolves at 0.5x that keep spreading (keeps coverage while kiting; Alpha leads, shades flank); (c) the Alpha howls every 6 s pulling enemies within 60 px toward it (crowd magnet, new verb, risk: control on a crowd near the player).
**Recommend (a)**, measure kite; add (b) only if kite < 1.6x. Acceptance: swarm 2.0-2.5x, single >= 1.1x, boss >= 1.0x, never over 3x at pair ranks (today pair stream40 5.16x: cleave 2.2x is what fixes it).

### 3.4 Murder Storm (`murder_storm`) and 3.5 Dive Bombers (`dive_bombers`), ravens (tree gate)
Base ravens are broken today (max ranks: single 0 DPS, boss 1 DPS, Flock radius hurts standing DPS), so every raven ratio is meaningless (Storm 14.5x swarm, Dive "infinite" on bosses). Both verbs are good and fit Mara later. **Recommend: no change now; re-measure after W8a ravens, then W9 as locked** (Storm inner ring + wall, fear never on bosses, Dive shadow tell). Add for desire: Dive Bombers card number "about 6x a peck on the toughest foe"; Murder Storm shows a fleeing-crow tell on frightened enemies (see status visuals).

### 3.6 Spirit Tempest (`spirit_tempest`), tree gate, recipe Bolt count + Bolt speed
On target (kite 2.24x, swarm 1.96x, boss 1.94x). Fine verb (radial bursts). Single 1.52x with 65% of bolts wasted (radial). **Keep.** Only the recipe has a dead stat (Bolt speed) until W10 Swiftness. Card: "BURST - eight bolts every 0.8 s, they burst on the last hit".

### 3.7 Soul Lance (`soul_lance`), tree gate, recipe Bolt power + Pierce
Breaks "never below base": boss 0.92x, kite 0.68x, swarm 0.98x; Bolt count and Bolt speed ranks do nothing after evolving (R4). The card promises one massive bolt, which feels like a downgrade from a fan of 6 bolts. Options: (a) **v1.1 W10 step 1 AND step 2 together** (cd 0.8, dmg 6, aim through the densest of the nearest 5; count ranks give 1 + floor(rank/2) lances in a 12 deg fan; burning script line on the ground); (b) lance only, faster (cd 0.6): simple but still one line; (c) replace with "Spirit Spear" that sticks and detonates (new code). **Recommend (a)** (step 2 needed anyway to fix R4). Acceptance: single/boss 1.8-2.2x, kite >= 1.0x, swarm >= 1.2x.

### 3.8 Thunder Judgment (`thunder_judgment`), recipe Chains + Power
Kite 2.77x (slightly over 2.5), single 1.27x, boss 1.06x. Strongest "wow" of the set (every enemy near you struck at once). **Tune as locked W11** (smite 0.9 -> 0.75), then check pair ranks (3.48x now).

### 3.9 Static Storm (`static_storm`), recipe Cooldown + Jump range
On target (swarm 2.06x). Chains ranks dead after evolving: W11 strikes = 3 + floor(chains/2). Random targets feel aimless: add a priority to unstruck enemies (no repeats within 0.5 s) so it reads as a "field". **Tune (W11)**.

### 3.10 Sanctum Halo (`sanctum_halo`), Elias run 1, recipe Orb count + Orbit size
Text says "heals you slowly": measured 0 HP in 60 s standing, 2.6 HP/min walking a circle (untrue in practice). Swarm 4.54x (over cap), boss 0 DPS (ring too wide to touch a boss in melee). **Rework as locked W5** (consecrated ground that burns, ring cap 12, honest text) and fix the desc NOW as a text-only change: "A wide ring of candles; the ground they cross burns." Heal returns only with W5b.

### 3.11 Judgement Wheel (`judgement_wheel`), recipe Orb power + Orbit speed
Kite 3.63x (over cap), swarm 1.07x, boss ~2 DPS. Orbit size after evolving is a trap (radius rank 0 is +97% better). **Tune**: W4 (radius -> blast +3 px/rank) and `tune.dmg` 1.8 -> ~1.3 (data), re-measure.

## 4. The card moment (applies to all 11)
Today: gold wax-seal EVOLVE card, name, one-line desc, "from <weapon>" whisper, leadlight border. Missing: a promise you can feel, a moment, an immediate demonstration, a new look.
Proposals (small, in this order):
1. **Card copy** (text only): verb line big (`verb` + `sub` already in data), plus ONE honest number measured in its home scenario ("about 2x damage in a crowd", "about 6x a peck on the toughest foe"). Never a recipe. Data: new optional `cardLine` in evolutions.json, tested to stay under the card's length budget.
2. **Evolve beat** (render + tiny sim hook): 0.6 s gold rim flash on the weapon's units/lights, short time-slow (render only, sim keeps stepping normally or pauses 0.3 s like the level-up), a sound sting later (audio not built), and the first use of the new verb triggers at once (first pounce/smite/burst right after the pick).
3. **New silhouette** (art chunk per evolution, R8 gold rim only): Pouncing pack crouch-leap pose, Alpha size + mane, echo wolves translucent, Halo candle ring, Lance glyph.
4. **Discovery**: first-ever evolve writes the recipe to the codex/results (already parked as "results recipe reveal after first evolve"); the "Something stirs" hint stays as locked.

## 5. Weapon stats: 5 weapons x 4 stats x 5 ranks

Felt score: 3 = clearly felt every rank; 2 = felt in some situations; 1 = hard to notice; 0 = no measurable effect. "Per rank" = DPS change per rank with the other three stats at rank 2 (stat-ranks.mjs), r0->r1 first.

### 5.1 Ghost Wolves (Wren, run 1)
| Stat (key) | Rank values r0..r5 | DPS per rank (single / swarm / kite) | Felt | Problem | New hint text (exact) |
|---|---|---|---|---|---|
| Pack size (`count`) | 2,3,4,5,6,7 wolves | +45..+16% / +49..+17% / +49..+13% | 3 | none | "One more wolf joins the hunt (3 -> 4)" |
| Bite power (`power`) | 7,10,13,16,19,22 | +43..+16% / +42..+7% / +36..+17% | 3 | none | "Bites hit 10 -> 13 (+30%), bleed grows with them" |
| Wolf speed (`speed`) | 110..170 | **0%** / +-3% / +-3% (kite 5->0 at max: -12%) | 1 | dead for damage; only matters to keep up when you run far | as locked: "Wolves run 122 -> 134: they keep up and catch runners". Option B (decision 3): add bite rate +4%/rank -> "Wolves run and bite faster (+4% bites)" |
| Bleed time (`duration`) -> **Rend** (v1.1 W7) | now 1.5..4.0 s at 35%/s; Rend: 4 s at 20..50%/s | now **0%** single, +1..+8% swarm, +1..+5% kite (bleed share 22% -> 38% swarm) | 0-1 | bleed never stacks and every bite refreshes it, so a longer bleed only adds a tail after the last bite; ~5% of damage on a single target / boss | Rend (W7): "Bleed deals 26% -> 32% of each bite per second, for 4 s (about +0.8 damage/s on every bleeding enemy)" - the number in brackets is computed from the current Bite power |
Ablation (full runs, 48 seeds, see 5.6).

### 5.2 Holy Orbit (Elias, run 1)
| Stat | r0..r5 | DPS per rank (single / swarm / kite) | Felt | Problem | New hint |
|---|---|---|---|---|---|
| Orb count | 2..7 | n/a (ring) / +41..+28% / +44..-27% (noisy) | 3 | none | "One more candle light circles you (3 -> 4)" |
| Orb power | 10..30 (x1.15 holy for Elias) | n/a / +40..+42% / +40..+41% | 3 | none | "Each light burns for 14 -> 18" |
| Orbit size | 38..68 | **standing: -42%, -35%, -21% per rank** / kite +14..+58% | 2 (two-faced) | a TRAP when enemies reach you (the "donut hole": enemies at 0-45 px are never touched at max size); W4 guard contraction fixes it | after W4: "Ring 44 -> 50 wide; it still closes in when foes touch you". Before W4: "Ring 44 -> 50 wide (hits further out, but not foes pressed against you)" |
| Orbit speed | 2.2..3.95 | n/a / +4..-2% (noise) / -4..+28% | 1 | weak, noisy (hit cooldown 0.5 s per light per enemy caps it) | "Lights circle 15% faster: sweep more foes per second". Option: also cut the per-enemy hit gap 0.5 -> 0.4 s at r5 so speed is real (data/code, small) |

### 5.3 Raven Flock (tree gate; base reworked in W8a)
| Stat | r0..r5 | DPS per rank (single / swarm / kite) | Felt | Problem | Hint after W8a |
|---|---|---|---|---|---|
| Flock size | 2..7 | 0 / +63..+17% / +28..+10% | 2 | ravens never reach a lone target | "One more raven scouts (3 -> 4)" |
| Peck power | 5..17.5 | 0 / +50..+17% / +46..+12% | 2 | as above | "Pecks hit 10 -> 14" |
| Flock radius -> Watch | 40..75 | single 19 -> 0, swarm -62..-3% (trap), kite +24..+75% | 2 (two-faced) | trap when standing | "Ravens spot prey 102 -> 114 away" |
| Flight speed -> Wingbeat | 2.2..4.2 spin | 0 / -3..+24% / -6..+23% | 1-2 | noisy | "Ravens rest 1.45 -> 1.30 s between swoops" |

### 5.4 Spirit Bolts (tree gate)
| Stat | r0..r5 | DPS per rank | Felt | Problem | New hint |
|---|---|---|---|---|---|
| Bolt count | 1..6 | +100..0% single / +97..+18% swarm | 3 | none | "Fire 2 -> 3 bolts each volley" |
| Bolt power | 10..30 | +40..+15% / +18..+26% | 3 | none | "Each bolt hits 14 -> 18" |
| Bolt speed -> Swiftness (W10) | 150..260 | **0%** everywhere | 0 | dead | W10 Swiftness: "Bolts fly and turn faster, volleys 1.00 -> 0.98 s" |
| Pierce | 0..5 | 0 single / +99..+19% swarm | 3 | none | "Each bolt passes through 1 -> 2 foes" |

### 5.5 Chain Lightning (tree gate)
| Stat | r0..r5 | DPS per rank | Felt | Problem | New hint |
|---|---|---|---|---|---|
| Chains | 2..7 | 0 single / +46..+13% swarm | 3 | none | "Lightning jumps to 3 -> 4 foes" |
| Power | 12..37 | +42..+16% | 3 | none | "Each strike hits 17 -> 22 (first foe 1.5x after W11)" |
| Cooldown | 1.6..0.85 s | +8..+20% / +7..+16% | 2 | ok | "Strikes every 1.45 -> 1.30 s" |
| Jump range -> Arc (W11) | 60..110 | **0%** single and swarm, 0..+4% kite | 0 | dead in any crowd (foes are always within 60 px) | W11 Arc: "Each jump loses 4% -> 3% power (and reaches further)" |

### 5.6 Run-level ablation (full bot runs)
`node scripts/stat-ablate.mjs <hero> 48`, random bot, starter gates, Blessings on, 48 seeds each row (95% CI about +-10 points; rows within ~10 points are NOT a real difference). Removing a stat also blocks the evolution that needs it.
| Hero / removed stat | Win % | Death median | First evo median | Note |
|---|---|---|---|---|
| Wren baseline | 17 (8/48) | 10:22 | 4:32 (41/48) | |
| Wren no Pack size | 0 (0/48) | 6:31 | 4:59 (22/48) | essential |
| Wren no Bite power | 4 (2/48) | 9:37 | 4:07 | essential |
| Wren no Wolf speed | 21 (10/48) | 11:13 | 3:52 | no loss: dead stat |
| Wren no Bleed time | 17 (8/48) | 11:55 | 4:42 (only Sanctum Halo possible) | no loss even though it also blocks Howling Legion |
| Elias baseline | 13 (6/48) | 6:18 | 5:10 (19/48) | |
| Elias no Orb count | 4 (2/48) | 6:23 | 4:22 | essential |
| Elias no Orb power | 6 (3/48) | 6:02 | 4:40 | essential |
| Elias no Orbit size | 17 (8/48) | 6:30 | 4:58 (only Howling Legion possible) | no loss: trap stat, and blocks Sanctum Halo |
| Elias no Orbit speed | 15 (7/48) | 5:53 | 4:07 | no loss |
Cards SHOWN in the baseline (share of that weapon's stat cards): Wren count 35%, power 15%, speed 15%, **duration 35%**; Elias count 35%, power 14%, **radius 37%**, speed 14%. The evoNudge shows the two run-1 pair stats (one of them dead or a trap) more than twice as often as the stats that win runs.
Striking side result: on run 1 the bot wins just as often WITHOUT ever reaching Howling Legion (Wren) or Sanctum Halo (Elias). Both starter evolutions are not yet worth chasing in real runs (Legion needs W6, Halo needs W5) - this matches Matt's "players may not WANT them".

### 5.7 Stat summary
- Dead (0): wolf Bleed time, Bolt speed, Chain jump range. Near-dead (1): Wolf speed, Orbit speed, raven Flight speed. Two-faced traps: Orbit size and Flock radius when standing (donut hole). Always-pick: none dominates by itself; Count and Power are the safe picks on every weapon (each +15-50% per rank) - acceptable because they are the plain choices.
- All three dead stats are already re-purposed in the locked v1.1 (Rend W7, Swiftness W10, Arc W11). Missing from v1.1: wolf speed (only a utility stat) and orbit speed (weak) - see decision 3.
- evoNudge interplay: the nudge (x4 for any stat in an open evolution pair, x3 more once the partner is rank 2+) is what makes dead pair stats show up most. Until Rend lands, run 1 Wren sees Bleed time on 35% of her wolf stat cards and Elias sees the trap Orbit size on 37%. No nudge change is needed once the dead stats are fixed; until then the cheapest fix is the hint text.
- Card hint format (all stats): `<what changes> <old> -> <new>` plus a bracket only when the effect is not obvious. Data: `hint` becomes a template with `{old}` `{new}` placeholders filled by cards.js (both numbers already exist in the stat card desc today; this removes the duplicate "x -> y (+n)" shape). Text work is data-only plus a small cards.js formatter.

### 5.8 In-run feedback gaps
| Gap | Today | Proposal |
|---|---|---|
| Bleed has no numbers | bleed ticks are `silent` (no damage numbers), enemy tinted 0xff9a9a (pinkish red) | DoT ticks summed per enemy every 0.5 s into ONE small number in the status colour (not cream, never red); tint changes to the status colour |
| Red tint conflicts with locks | HUD lock: red only for danger; rose = heart pickup | bleed uses the wolf-light colour (see 6.4), never red |
| "Burn" claimed but not real | Holy Orbit desc "burn anything they touch" is plain contact damage | text now: "...and scorch anything they touch"; a real Burn only if decision 1 adds it |
| Pin / fear invisible | pin = 0.15 s ring at landing; fear = enemy just walks away | small status marks (6.4) |
| Damage share | results screen shows weapon shares (U6) | add "of which bleed X%" line for wolves (counter exists: bleed carries `bleedSrc`) - later |

## 6. Status effects

### 6.1 Inventory (code today)
| Status | Where | Rule today | Boss | Visual |
|---|---|---|---|---|
| Bleed | wolves (all), Dire Alpha cleave | one per enemy: `bleedDps = max`, `bleedT = max`; 35% of bite per s; refreshed by every bite; damage silent; kill credited via `bleedSrc` | full | pinkish-red tint |
| Hold / pin | Pouncing Pack (1 s), maul (0.15 s keep-alive) | `heldT`, enemy stops | never (`!t.boss`) | 0.15 s ring |
| Fear | Pack Howl (2 s, 130 px), Murder Storm (tune 0.3 s, once per 1.5 s per enemy) | `fearT`, runs away at 1.3x | never | none |
| Slow | none on enemies (root patches slow the PLAYER) | - | - | - |
| Mark | planned W8b (+10% damage taken 3 s, refresh only, violet tint) | not built | allowed | planned violet tint |
| Chain / shock | Chain Lightning is instant damage only, no status | - | - | bolt line |
| Burn | named in Holy Orbit text, not real; Sanctum Halo ground zones are area damage, not a status | - | - | - |

### 6.2 Proposed small set (one owner each, no generic statuses)
| Status | Owner (fantasy) | Kind | Rule | Boss | Notes |
|---|---|---|---|---|---|
| **Bleed** (Rend) | Wren's wolves | DoT | ONE per enemy; strongest DPS wins, duration refreshes to the longer (Brotato/PoE rule); fixed 4 s; potency = Rend stat (20-50% of the bite per s) | full damage | already exists; just rules + visuals + Rend |
| **Pin** | Wren's wolves (Pouncing, Rally) | control | max 1.0 s; then the enemy is pin-immune 1.5 s | immune | formalises today's `heldT` |
| **Fear** | ravens (Murder Storm), Pack Howl/Rally if kept | control | max 1.2 s, once per 1.5 s per enemy (built W1a) | immune | already built |
| **Mark** | ravens (W8b) | amp | +10% damage taken, 3 s, refresh only, never stacks; total amp cap decided in W8b | allowed | as locked C7 |
| **Burn (Kindle)** - optional, decision 1 | Elias's holy flame (Holy Orbit lights, Halo ground, Candle Wheel ring) | DoT | ONE per enemy, strongest wins, 2 s, 20% of the hit per s | full damage | makes "burn" text true; gives Elias a status for tree nodes |
| Chill, Shock, Poison | reserved for later heroes (Sister Agnes / Frost Bell; Captain Vane / Chain Lightning; none for poison) | - | - | - | not now |

Shared rules: (1) a status never stacks with itself unless named as a stacking status (none at launch); (2) different statuses coexist; (3) NO cross-status interactions at launch (no chill+shock style combos) - one designed interaction may come with a later hero; (4) control (pin, fear, later chill) has a per-enemy immunity window and never touches bosses (locked R3); (5) DoT damage counts for kills via the source tag (already: `bleedSrc`); DoT cannot trigger on-hit effects (no loops); (6) all status state is sim-only, seeded, never saved (R11); (7) at most 3 statuses shown on one enemy.

DoT share target: DoT <= 35% of its owning weapon's damage in its best scenario and <= 15% of team damage over a run (measure with the R2 counters: add `dotBy`). Today wolves: 22-38% bleed share in crowds, 3-5% on a single target/boss.

### 6.3 Boss rule
Bosses: immune to pin/fear/(later chill and slow); take full DoT and Mark (damage amps allowed, R3). Optional: DoT on bosses at 100% (no reduction) because our DoTs never stack - nothing to runaway.

### 6.4 Visual language (cold enemies, warm/role-coloured friends)
Status marks are FRIENDLY effects, so they use the owning spirit's role light, never red (danger), never gold (evolution/dawn), never rose (heart):
| Status | On the enemy | Number colour |
|---|---|---|
| Bleed | small drips of wolf light (pale ice-blue #9fd8ff) falling from the body, tint very light blue | pale blue, small, summed every 0.5 s |
| Burn (if added) | 1-2 tiny lilac flame licks (Elias orb flame colour) | lilac, small |
| Mark | violet outline tint (locked W8b) | none (amp shows in the hit numbers) |
| Pin | wolf-blue paw ring under the enemy for the pin time | none |
| Fear | the enemy's cold eye-points flicker and it turns away; a faint raven-violet feather wisp | none |
Low tier: tint only, no particles. Reduced motion: no flicker.

### 6.5 Skill tree status nodes (input for skill tree redesign sheet #5)
Rules: per STATUS, not per weapon; face value 1-3%; one shared capped category "Status" (proposed cap C = 10% potency, PE weight ~0.1 -> ~1.0 PE at cap, taken from the 15.5 combat ceiling, so the ceiling does not grow); gated like other options (by playing the owner); a node only appears once you have unlocked a source of that status (Soulstone rule, no dead nodes); prefer duration/visual/verb nodes over raw %.
Example list (12 nodes; names fit the Hollow):
| Node | Status | Effect | Unlock condition |
|---|---|---|---|
| Deep Wounds I/II/III | Bleed | +2% / +2% / +3% bleed potency (of bite) | kill 200 / 600 / 1500 bleeding enemies |
| Long Shadows | Bleed | bleed lasts +0.5 s (only matters after Rend's fixed 4 s, i.e. on kills during the tail) | clear Night 1 with Wren |
| Pack Memory | Bleed (option) | enemies that die while bleeding drop a tiny light mote (visual + 1% chance for an extra XP gem) | 1000 bleed kills |
| Kindling I/II | Burn | +2% / +3% burn potency | kill 300 / 900 burning enemies (only if Burn is added) |
| Steady Flame | Burn | burn lasts +0.5 s | clear Night 1 with Elias |
| Raven's Eye I/II | Mark | mark lasts +0.5 s / +0.5 s (never more damage amp) | mark 500 / 1500 enemies (after W8b) |
| Firm Grip | Pin | pin +0.2 s (still never bosses, immunity window unchanged) | 300 pins |
| Old Fears | Fear | fear +0.2 s | 300 frightened enemies (after ravens) |
Replace today's tree nodes that buy the dead Bleed time (`wf_bleed` "Deep Bite" +0.5 s, `wf_third` +0.5 s): they are trap purchases now; retext them when Rend lands (C18 already says re-run tree-ablate).
Must wait for sheet #5: the category cap numbers, the node positions in the per-weapon clusters, the kill counters per status (save fields), and whether Burn exists.

## 7. Risks
- Balance: every fix here moves win rates; most are gated content (only Howling Legion, Sanctum Halo, wolves and orbit stats touch run 1). The R1 retune checkpoint already exists for this.
- Several evolutions are only measured on dummies; ravens cannot be judged until W8a.
- Making dead stats live (Rend, Swiftness, Arc, optional wolf bite rate) adds power: each needs a same-ranks + sweep check.
- The 3x cap at pair ranks (decision 2) could force nerfs that make the first evolve feel smaller; measure the feel with Matt.
- Status visuals add particles: per-tier caps needed (Low tint only).
- Burn adds a second DoT and a new save counter later; keep it out until decision 1.

## 8. Prioritised fix list (small build chunks)
| # | Chunk | Type | Contents | Touches run 1? |
|---|---|---|---|---|
| E1 | Honest text | data only | Sanctum Halo desc (no heal claim), Holy Orbit "scorch", Howling Legion verb/sub after W6, all 20 stat hints rewritten (5.1-5.5) with `{old}/{new}` template + cards.js formatter + test (length budget, no recipe words) | yes (text only, sweeps byte-identical) |
| E2 | Bleed readable | render + sim counters | DoT tick numbers (summed 0.5 s, pale blue), bleed tint to wolf-light drips, `dotBy` counter (counters only) | yes (visual; sweeps byte-identical) |
| E3 | Rend (= locked W7) | code + data | duration -> Rend potency 20-50%, fixed 4 s, status rules 6.2 for bleed; retext `wf_bleed`/`wf_third` | yes (moves Wren rows) |
| E4 | Pouncing Pack | code + data | W7b chain-pounce + leapHit 2.4 + speed ranks -> leap range/cd + paw ring | no (gated) |
| E5 | Dire Alpha | data + code | W7b 5.4x primary, cleave 2.2x; measure kite; shades only if needed | no |
| E6 | Halo + Wheel caps | code + data | W5 (Halo ground) and W4 (radius -> blast) + Wheel dmg 1.3 | Halo yes |
| E7 | Soul Lance | code | W10 step 1+2 together | no |
| E8 | Chain evos | data + code | W11 Judgment 0.75, Static strikes from chains, no-repeat targets | no |
| E9 | Evolve beat | render | gold rim flash, first verb triggers at once, card number line (`cardLine`) | yes (visual) |
| E10 | Status rules + marks | code + render | pin immunity window, max 3 marks, mark/pin/fear visuals (6.4) | partly |
| (later) | Burn, status tree nodes | after decision 1 and sheet #5 | - | - |
E1 and E2 are the cheapest and answer Matt's "I could not tell what it was doing" directly. E3-E8 are the existing W-chain items re-ordered with the desirability additions; they keep the locked R1 checkpoint.

## 9. Decisions for Matt (max 3)
1. **Should Elias get a real Burn status?** (Recommended) Yes, a small one owned by his holy flame (makes "burn" true and gives him tree status nodes) / No, just change the word to "scorch" and keep Bleed the only damage-over-time.
2. **Where does the 3x evolution cap apply?** (Recommended) Also at the moment you pick it (recipe maxed, other stats about rank 2), so no evolution is a 4-5x jump / Only at max ranks (today's check; allows big early spikes that feel great but can trivialise the run).
3. **Wolf speed and Orbit speed** (the two weak stats v1.1 does not fix): (Recommended) add a small attack-rate bonus per rank (wolves bite 4% faster; lights hit the same enemy a little more often) so every rank is felt / Keep them as pure utility and only rewrite the card text honestly.

## 10. Needs an independent second review before locking
- The status rule set (6.2-6.3) and the tree category cap (6.5): balance-safety and save impact (counters).
- Dire Alpha and Soul Lance reworks (biggest numeric changes, both currently break "never below base").
- Decision 2 (cap at pair ranks): it changes how all 11 are measured; reviewer should re-run evo-same-ranks with an "others rank 2" mode.
- The Burn proposal if Matt says yes.
Text-only E1 and visual-only E2 need no independent review (reversible).

Security check: docs + two read-only analysis scripts (scripts/stat-ranks.mjs, scripts/stat-ablate.mjs: import the Sim and bot only, no network, no file writes, no new dependencies); no src/data/tests change; proposed status state is sim-only and never saved (R11); new tree counters would be save fields and need the save validator when built.
Fit check: statuses each belong to one hero/spirit (wolves bleed/pin, ravens fear/mark, Elias's flame burn), shown in the owning spirit's light colour on cold enemies; red stays danger, gold stays evolution/dawn, rose stays the heart.
Right now: Matt reads section 1-2 and answers the 3 decisions. Next: E1 honest text (data only). Parked: Burn and status tree nodes until decision 1 and sheet #5.
