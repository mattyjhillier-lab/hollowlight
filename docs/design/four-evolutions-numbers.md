# Four evolutions: measured numbers (Light Trails, Talon Mark, Vanguard, Vesper Tide) (2026-10-16)

Status: NUMBERS PROTOTYPE, NOT LOCKED. Read-only: no gameplay code or data changed (`src/`, `src/data/` untouched; LOCKED not edited). Probe: `scripts/four-evo-probe.mjs` (NEW; wraps weapon behaviours in memory, same harness and method as `scripts/third-evo-probe.mjs`, `evo-home.mjs`, `probe-summons.mjs`). Standard: docs/design/evolutions-second-review.md 2.3 (home band 1.8-2.3x, mortal home scenario, 5 seeds, max ranks; 3x cap at pick = pair 5 + others rank 1, must hold in stream40/single/boss and mortal home (mortal swarm cells over 3x only fail if stream40 also fails); never below base, at least 0.98x in every scenario).

## 0. Bottom line
| Evolution | Fits as locked? | Home (max ranks, 5 seeds) | Worst cap@pick (p1) | Never below base | Verdict |
|---|---|---|---|---|---|
| **Light Trails** (wolves) | YES, no verb change | kite **2.15x**, swarm **1.92x** (vs Rend base) | stream40 2.55x (mortal swarm 3.08x, saturation rule passes) | yes (1.00x single/hug, 1.05x boss) | build as locked |
| **Talon Mark** (ravens) | YES on the locked yardstick (TEAM damage), with one flag | single **1.76x**, boss **1.64x** TEAM (vs W8b base) | boss 1.94x, single 1.61x (teammates rank 3) | yes (1.03x kite, 1.04x swarm) | build as locked; amp cap proposed (+75% product); flag: the ravens' own damage is ~4.2x base |
| **Vanguard** (ravens) | **NO** (move-direction wedge) | locked form: kite(flee) <= 1.34x, only 2.09x when you walk INTO the crowd | n/a | yes | needs a verb adjustment: **Spearhead** (wedge toward the thickest crowd): kite **2.26x** |
| **Vesper Tide** (orbit) | YES, with one verb addition (the crest) | kite **1.97x** (vs W4+Burn base) | stream40 1.51x, kite 2.21x | yes but swarm margin thin (1.01x) | build with crest hit x2.0 on the swell |

Plain-words summary: two of four land cleanly (Light Trails, Talon Mark), one needs a small verb tweak to be band-legal (Vesper Tide: the swell hits harder), one cannot work as written (Vanguard: a wedge ahead of where you walk barely meets enemies when you kite; fixed by pointing the wedge at the crowd).

## 1. Method and stand-in bases (stated plainly)
Every number compares the evolution with a STAND-IN for the base weapon as it will be after its W-chunk, because those chunks are not built (and another agent is mid-edit on wolves):
| Stand-in | What it models | Not included |
|---|---|---|
| `_rend` (wolves) | today's wolves + locked Rend (15% + 4%/rank of the bite per s, 4 s, strongest wins) + locked +4%/rank bite rate from Wolf speed | echo/alpha anything; guard reflex (W7) |
| `_w8b` (ravens) | W8a-like ravens (swoop nearest unclaimed within Watch 90-150 px, Wingbeat rest 1.6-0.85 s, peck 1x) + W8b raven mark +10%, 3 s, refresh only; `_w8a` = same without mark | fear, Rally calls |
| `_w4b` (orbit) | Holy Orbit + W4 guard contraction + locked Burn (20% of the triggering hit per s, 2 s, refresh) + locked +4%/rank hit rate from Orbit speed | Halo ground, Wheel blasts, Candle Wheel |
Results vs TODAY's wolves are also printed (they are higher: today's bleed is short). Re-measure each evolution in its own build chunk after its base chunk lands (acceptance gates below).
Scenarios (all god-mode hero): `single` (dummy 30 px), `hug` (dummy 15 px), `swarm` (stand in 60 refilled mortal foes), `kite` (bot flees foes within 90 px), `stream40` (40 immortal walkers), `boss` (Elder Treant, boss damage only, 40 s); added here: `plough` (walk INTO the crowd; upper bound for directional verbs) and `loop` (walk a circle). Noise: swarm/kite/plough +-5-15%, single/boss/stream40 +-1-3%. Cell = cap@pick | home@max.
Reproduce: `node scripts/four-evo-probe.mjs 5 1` (all four, 5 seeds, pick rank 1; about 2.5 min), filter by id `... 5 1 light`, extra arg = Talon teammate rank at pick (default 3). What-ifs: `PT='{"vesper_tide":{"swell":2.5}}'` (in-memory, known keys, finite numbers only).

## 2. LIGHT TRAILS (wolf evolution, recipe Wolf speed + Bite power, replaces Pouncing Pack)

### 2.1 Prototype rules (these are the recommended design numbers)
| Item | Value | Notes |
|---|---|---|
| Wolf body | unchanged bite code, Wolf speed x1.1, base Rend/bite rate as `_rend` | no leap/pin/maul |
| Trail | a point is dropped every **7 px** a wolf moves; each point lives **ttl = 1.2 + 0.22 x Wolf speed rank s** (rank 1: 1.4 s, rank 5: 2.3 s) | length = wolf speed x ttl: about 190 px at rank 1, **430 px at rank 5** per moving wolf |
| Width | half-width **5 + 0.8 x Wolf speed rank px** (rank 1: 5.8, rank 5: 9, so an 18 px ribbon) | enemy touches the trail if centre distance < enemy radius + half-width |
| Tick | per-enemy hit gate **0.4 s** (max 2.5 trail hits/s on one foe) | gate key shared by all trail points of the weapon, so overlapping trails do NOT stack hits |
| Damage | direct **0.24 x bite** per trail hit (Bite power scales it) + Bleed | bite = Bite power x damage mods |
| Bleed | trail hit applies the locked Rend: potency = max(current, bite x (15% + 4%/rank of Bleed time)) per s, time = max(remaining, 4 s), one instance per foe | exactly the wolf bleed rule; no new status |
| Caps | live points cap **360** (peak seen 256 at 6 wolves, rank 5) | oldest dropped first |
| Boss | trail hits and bleed apply (damage only), no control | DoT share measured below |

### 2.2 Measured (5 seeds, pick rank 1, trail tk 0.24)
| Scenario | cap@pick | home@max | evo / base DPS @max |
|---|---|---|---|
| single (stationary lone foe) | 1.00 | 1.00 | 316 / 316 |
| hug | 1.00 | 1.00 | 316 / 316 |
| **swarm (home)** | 3.08 mortal (saturation) | **1.92** | 634 / 330 |
| **kite (home)** | 2.73 | **2.15** | 616 / 287 |
| stream40 | **2.55** | 1.67 | 776 / 464 |
| plough | 2.74 | 1.85 | 603 / 325 |
| loop | 2.83 | 2.03 | 602 / 296 |
| boss | 1.20 | 1.05 | 263 / 252 |
Pick rank 2 (3 seeds): swarm 2.45 | 1.87, kite 2.62 | 2.24, stream40 2.07 | 1.60, boss 1.25 | 1.03: same verdicts. Vs TODAY's wolves (short bleed): swarm 2.05x, kite 2.40x, stream40 1.77x, boss 1.33x (higher: the base gets stronger with Rend, so the Rend base is the honest comparison).
Sensitivity (trail hit tk, 3 seeds): 0.20 gives swarm 1.87 / kite 2.24 (at ttl 1.2); 0.30 gives swarm 2.02 / kite 2.64 (over band); 0.50 (first guess) kite 3.1x, stream40 cap 3.49x (breaks the cap). **Recommended tk 0.24 (band centre), allowed 0.20-0.26.**
DoT share (bleed damage / evo damage, locked gates 35% of weapon, 10% boss): swarm 23%, kite 26%, plough 23%, loop 29%, boss **6%**; the trail does not raise the share above the base wolves' (swarm base 25%). stream40 shows 37% (base 41%): that is the base Rend in a no-kill scenario (immortal walkers never die so bleed never saturates), already over 35% BEFORE this evolution; flagged for the Rend chunk (W7), not an effect of Light Trails.
Perf: hit test is a 24 px spatial hash over at most 360 points: about 0.03 ms per frame in the probe (3 s over 100k frames); no per-enemy allocation.

### 2.3 Risks, tiers, distinctness
- Single/hug 1.00x: trails do nothing to a lone motionless foe (wolves stand still biting). Honest: the evolution is a crowd/kite tool; The Alpha owns single/boss, Echo Pack owns standing swarm. Never below base holds.
- Readability: up to 6 wolves x 430 px ribbons around the hero. Tier caps (render, sim identical): **High** all ribbons (cap 360 points, ribbons merged per wolf = max 6 draw calls), **Med** 4 ribbons (newest wolves) with half the segment resolution, **Low** no ribbons: 24 faint paw dots total (hit zone unchanged, shown as one ground tint). Reduced motion: no shimmer. Colour: wolf pale blue core + warm lantern edge (colour returns); never red; trail fades from the tail.
- Distinct from siblings: Echo Pack = kills become echo wolves (more bodies), The Alpha = one huge bleeder, Light Trails = ground ribbons that bleed foes who cross them. Different from Sanctum Halo's burning ground (placed by lights, 4 s discs) and from Living Field (random strikes).
- Wolves hunt within 150 px of the hero, so trails mostly sit near the hero; with Wolf speed low they are short, which is the intended Wolf speed payoff.
- Acceptance (build chunk W7b-Trails): home swarm AND kite 1.8-2.3x vs the built Rend base (5 seeds); cap@pick p1 <= 3.0x stream40/single/boss; never below base >= 0.98x every scenario incl. boss; bleed share <= 35% swarm/kite, <= 10% boss; trail points never exceed the tier cap; one bleed instance per foe (test); a foe is hit at most once per 0.4 s by trails (test); trail hit never applies control.

## 3. TALON MARK (raven evolution, recipe Flight speed/Wingbeat + Peck power)

### 3.1 Prototype rules
| Item | Value |
|---|---|
| Dive | each raven rests Wingbeat (1.6 -> 0.85 s), picks the **toughest** unclaimed foe within Watch (claim set; nearest fallback), flies 300 px/s, hits **4.0x** peck, returns |
| Mark | the dive marks the target: **+15% damage taken from ALL sources for 3 s, refresh only** (no stacking; strongest wins vs the base raven mark +10%) |
| Amp scope | applied once to every hit AND DoT tick on that enemy (bleed, Burn, bolts, orbit, wolves) |
| Measurement | TEAM damage on the target: ravens + Ghost Wolves + Holy Orbit + Spirit Bolts (all base, rank 3 at pick, 5 at max) |

### 3.2 Measured (5 seeds, pick rank 1, teammates rank 3 at pick / 5 at max)
Team DPS ratio vs team with the `_w8b` base ravens (the honest base: base ravens already mark +10% after W8b); vs `_w8a` (no mark) in brackets.
| Scenario | cap@pick | home@max | team DPS evo / base |
|---|---|---|---|
| **single (home)** | 1.61 | **1.76** (1.92) | 936 / 533 |
| hug | 1.62 | 1.70 | 1020 / 599 |
| swarm | 1.10 | 1.04 | 1375 / 1319 |
| kite | 1.13 | 1.03 | 1342 / 1297 |
| stream40 | 1.12 | 1.10 | 2523 / 2286 |
| **boss (home)** | **1.94** | **1.64** (1.80) | 1084 / 662 |
- Mark uptime on the boss: 86% (7 ravens, max ranks).
- How much is the mark vs the dive? Same run with mark amp 0: single 1.54 / boss 1.52 vs `_w8a` (instead of 1.92 / 1.80): the +15% mark is worth about +0.25-0.3x of team on a lone target, the 4x dive the rest. Versus the W8b base (already +10%) the extra mark is only +4.5% of teammates' damage, so the card must NOT promise "big team damage from the mark"; it must say "dives hard and marks".
- Teammate sensitivity for cap@pick (3 seeds): teammates rank 1 -> single 2.24, **boss 3.75 (breaks 3x)**, stream40 1.40; rank 3 -> 1.61 / 1.94 / 1.12; rank 5 -> 1.41 / 1.38 / 1.05. The breach needs rank-1 teammates against a rank-5/5 raven pair, which cannot be a real pick (ravens need ranks 5+5 while other weapons sit at 1); a real pick sits near rank 3. Acceptance uses teammates rank 3.
- **Flag (own damage):** the ravens' own DPS is 4.2x base at max (506 / 121 single) and 2.7-3.4x in stream40/swarm. The locked yardstick is TEAM damage (LOCKED 2026-10-16), under which the 3x cap holds with margin; if Matt reads the 3x cap on the weapon's own damage, 4x dive cannot comply.
- Never below base: yes everywhere (1.03x worst, kite).

### 3.3 Total-amp cap (needed before build; proposal)
Existing amps: Rally +50% (wolves-only, attacker side), Mark +10% (base, W8b) and +15% (Talon). Today's worst case on one wolf bite under Rally and Talon mark: 1.5 x 1.15 = **1.725x** (multiplicative per LOCKED C18). Proposed rule: **the product of all temporary damage amps on one hit (Rally, Mark, any future) is capped at x1.75 (+75%)**; Blessings and tree stat percentages are separate (their own soft cap). Effects: nothing changes today (1.725 < 1.75); a third amp (a hero skill, a future evolution) cannot stack past +75%, so Talon Mark cannot be the start of runaway stacking. Mark stays: one source, 3 s, refresh only, strongest wins (+15% replaces +10%, never adds to 25%), no control, bosses allowed. Tree duration nodes (Raven's Eye) may extend the 3 s but never the amp percentage.

### 3.4 Two alternatives for Matt (only if the own-damage 4.2x worries him)
- **A (Recommended, as locked): dive 4.0x, mark +15%.** Team single 1.76x, boss 1.64x; own DPS 4.2x flagged.
- **B (lighter): dive 3.0x, mark +15%.** Own DPS about 3.1x (inside 3x cap), team single 1.52x, boss 1.40x (3 seeds): under the locked 1.6-1.9 team target by 0.1-0.2x; needs the target lowered to 1.4-1.6x. (Dive 3.5x lands in between: single 1.64, boss 1.53, own 3.7x. Mark +20% with dive 3.0 gives 1.58 / 1.46 but needs the amp cap raised to +80%.)

### 3.5 Risks, distinctness, acceptance
- Readability: marked foe gets a violet outline (max 3 marks per enemy drawn, Low tier = tint only); dive tell = shadow on the target 0.2 s before the hit (as Sky Dive's design); card text must say "Hits the toughest foe hard and marks it: everything hits it harder for 3 s."
- Crowds: dives only pick the toughest, so crowd cells are ~1.0-1.1x (nothing lost, nothing gained): the evolution is a boss/elite tool; Wall of Wings covers the standing swarm and Vanguard/Spearhead the moving crowd.
- Off-screen: dive range = Watch (90-150 px), inside the view. Perf: no new entities.
- Acceptance (T-Talon chunk, after W8a/W8b + amp cap): TEAM boss and single 1.6-1.9x vs the built W8b base (teammates rank 5 at max, rank 3 at pick); cap@pick p1 <= 3.0x team in stream40/single/boss; never below base >= 0.98x every scenario; mark never exceeds one instance, +15% strongest-wins (test), amp cap test (Rally x Talon <= 1.75), mark applies to DoT ticks once (test), no control on bosses.

## 4. VANGUARD (raven third evolution, recipe Watch + Wingbeat): the locked form does not fit; two alternatives

### 4.1 What was measured
Base for all cells: `_w8a` (Vanguard never mutes the base flock: it ADDS ravens, so it is >= base by construction).
**As locked (wedge flies ahead in the MOVE direction, clears the path):** swapping the flock into the wedge makes it WORSE than base: the base ravens swoop at the foes near the hero, the wedge only touches what it flies through. Pure wedge 0.07x in the kite bot (it flees, so ahead is empty), 0.58x when walking INTO the crowd, 0.00-0.03x in a circle. Keeping the base flock and ADDING a wedge flock (ceil(count/2), max 4, extra ravens that only clear a lane): weak settings kite 1.08x, plough 1.23x; strong settings (7 extra ravens, contact radius 10 px, 1.5x damage) kite **1.34x**, circle 1.11x, plough 2.09x. So the locked form is band-legal only for a player who keeps walking into the crowd, and still needs a doubled flock. It cannot fit 1.8-2.3x in kite or standing.
Why: enemies chase you. When you move, the crowd is BEHIND and to the sides; the empty space is ahead. A wedge toward the thickest foes works in every movement style.

### 4.2 Alternatives
- **A (Recommended) SPEARHEAD: the wedge flies at the thickest crowd near you (not where you walk).** The normal flock keeps scouting unchanged (so never below base); in addition ceil(Flock size / 2) vanguard ravens (max 4) fly a wedge toward the centroid of the 10 nearest foes within Watch + 60 px (needs 3+ foes; otherwise they ride beside the hero ring), lead distance 40 + 0.6 x Watch (94-130 px), spread 12 + 0.06 x Watch px, side-to-side sweep +-22 px at Wingbeat rate, contact hits 0.3 x peck, contact radius 5 px + foe radius, per-foe gate 0.8 s. Card: "A wedge of ravens flies into the thickest crowd and clears a lane." Watch = how far they look and lead; Wingbeat = how fast the wedge sweeps; Flock size = more vanguard ravens; Peck power = lane damage. All four live. Uses the "ahead" fantasy (the wedge is ahead of you, toward the crowd) without depending on how you walk.
- **B Keep the locked wedge (move direction), accept it is a push-in tool:** extra ravens = Flock size (max 7), contact radius 10 px, 1.5x damage. Measured: kite 1.34x, circle 1.11x, **plough 2.09x**, standing = base. Home would have to be redefined as "walking into the crowd" (an aggressive style the bot kite does not use) and the flock visually doubles. Fit and balance both weaker; offered only so the choice is explicit.

### 4.3 Measured, option A (5 seeds, pick rank 1; extraK 0.5, max 4, cr 5, dmg 0.3, gate 0.8)
| Scenario | cap@pick | home@max | evo / base DPS @max |
|---|---|---|---|
| single / hug | 1.00 | 1.00 | 110 / 110 |
| swarm (standing) | 1.04 | 1.04 | 124 / 119 |
| **kite (home)** | 2.70 | **2.26** | 183 / 81 |
| stream40 | **1.36** | 1.31 | 160 / 123 |
| plough | 3.74 mortal (stream40 1.36: saturation rule passes) | 2.78 | 313 / 112 |
| loop | 2.65 | 1.97 | 144 / 73 |
| boss | 1.00 | 1.04 | 38 / 37 |
Pick rank 2 (3 seeds): kite 2.63 | 2.21, stream40 1.24 | 1.27. Never below base: yes (1.00x worst, by construction). Note the absolute gain is small (the stand-in raven base is weak, 81 DPS in kite): +100 DPS, comparable to one extra weapon rank.
Risks: the wedge hits many small foes lightly (0.3x peck taps), so it is a crowd tool only (single/boss 1.0x, honest); extra ravens add up to 4 sprites (flock max 7 + 4 = 11, vs Wall of Wings' 12 cap; Vanguard ravens must read differently: wedge formation with a short violet wake, no ring); off-screen: lead max 130 px (view half-width 320). Distinct: Wall of Wings = ring around you + fear; Talon Mark = single toughest dive + mark; Spearhead = lane into the crowd, lightly. Sensitivity: dmg 0.25 -> kite 2.15x; dmg 0.6 / cr 8 -> kite 3.5x (over band): tune dmg in 0.25-0.3.
Acceptance (T-Vanguard chunk, after W8a): kite 1.8-2.3x vs the built W8a base; stream40 cap@pick p1 <= 3.0x; never below base >= 0.98x incl. boss with adds and standing swarm; vanguard raven count <= 4; no control; claim: wedge never targets by "toughest" (it is a lane).

## 5. VESPER TIDE (Holy Orbit third evolution, recipe Orbit size + Orbit speed)

### 5.1 Prototype rules
| Item | Value |
|---|---|
| Ring radius | R(t) = 14 + (1.7 x Orbit size - 14) x (0.5 - 0.5 cos phi), phi rate = **1.0 x Orbit speed** rad/s; max 75 px (size rank 1) to **116 px** (rank 5); period 2.5 s (speed rank 1) to 1.6 s (rank 5) |
| Lights | spin at Orbit speed as the base; same contact hit and 0.5 s per-light gate (with the locked +4%/rank hit-rate) at every radius |
| Crest (the one verb addition) | hits made while the ring is **pushing out** deal **x2.0**; drawing in x1.0 |
| Guard contraction | W4: foe touching Elias for 0.2 s forces radius 14 for 0.8 s; wins over the tide |
| Burn | locked rule on every Orbit hit (20% of the triggering hit per s, 2 s, refresh): crest hits carry x2 Burn potency |
Without the crest (plain breathing) the evolution misses the band: kite 1.27-1.71x (phase 0.8-1.2), swarm 0.96-0.98x (below base, fails never-below), stream40 0.98x. The crest is the smallest addition that fits: the verb stays "the ring swells out and draws back", the swell now has force.

### 5.2 Measured (5 seeds, pick rank 1)
| Scenario | cap@pick | home@max | evo / base DPS @max |
|---|---|---|---|
| single (30 px; base ring never touches it) | INF | INF | 106 / 0 |
| hug (15 px) | 1.56 | 1.60 | 426 / 267 |
| swarm (standing) | 1.13 | **1.01** | 966 / 955 |
| **kite (home)** | 2.21 | **1.97** | 511 / 260 |
| stream40 | **1.51** | 1.53 | 1441 / 941 |
| plough | 1.24 | 1.11 | 833 / 750 |
| loop | 3.99 | 4.94 | 232 / 47 |
| boss | 1.48 | 1.39 | 541 / 390 |
Pick rank 2 (3 seeds): kite 2.61 | 1.94, stream40 1.52 | 1.53, swarm 1.09 | 1.01, boss 1.45 | 1.39. Burn/DoT share of Orbit damage: 3-15% (kite 8%, stream40 15%, boss 2%), inside the 35% / 10% gates. Sensitivity (3 seeds): swell x1.8 phase 1.2 kite 1.89; swell x2.2 phase 1.2 kite 1.99, swarm 1.00; phase 1.6 + swell 1.8 + draw 1.4 kite 2.32, swarm 1.06.
- Risks: (1) swarm home is only 1.01x (seeds 0.96-1.06): never-below-base is inside noise; acceptance must re-measure after W4/Burn and may trim phase or add draw x1.1. (2) Home kite is shared with Judgement Wheel (kite 2.0-2.3): mitigated by the verb: Wheel = lights burst and rekindle (gaps), Vesper = continuous ring changing radius; Halo = static wide ring + burning ground. (3) Loop 4.9x is an artefact of a base ring that never touches foes during the circle (47 DPS); it is not a gate. (4) Reads as wobble unless the swell is clear: lights stretch into a short streak and brighten on the swell, dim and tighten on the draw; the crest hit pop is small (no blast, so not Wheel); Low tier = fixed brightness cue only. (5) No new entities (same lights), perf unchanged; max ring 116 px (on screen). (6) Burn on crest hits makes lilac flames cluster at the ring's outer edge: cap Burn visuals (already capped by the status rules).
- Acceptance (T-Vesper chunk, after W4+Burn): kite 1.8-2.3x vs the built W4+Burn base; cap@pick p1 <= 3.0x stream40/kite/single/boss/hug; never below base >= 0.98x incl. standing swarm and boss (re-measure with 5+ seeds, trim if under); Burn share <= 35% of Orbit damage; guard contraction still fires during the swell (test); crest never applies to Candle Wheel.

## 6. Recommended final numbers (design values, retuned in each build chunk)
- Light Trails: space 7 px, ttl 1.2 + 0.22 x speed rank s, half-width 5 + 0.8 x speed rank px, trail hit 0.24 x bite, gate 0.4 s, Rend bleed, point cap 360 (tiers High 6 ribbons / Med 4 / Low dots).
- Talon Mark: dive 4.0x peck (alt 3.0x), mark +15% 3 s refresh only, fly 300 px/s, toughest unclaimed in Watch; total amp cap x1.75 (product of Rally, Mark, future amps); gate on TEAM damage.
- Vanguard (Spearhead): extra ravens ceil(count/2) max 4, lead 40 + 0.6 x Watch, spread 12 + 0.06 x Watch, sweep +-22 px at Wingbeat, contact 0.3 x peck, radius 5 px, gate 0.8 s, crowd = 10 nearest foes within Watch + 60 px (3+ foes).
- Vesper Tide: R(t) 14 -> 1.7 x Orbit size, phi rate 1.0 x Orbit speed, swell hits x2.0, draw x1.0, guard contraction wins, Burn as locked.

## 7. Decisions for Matt (2, one-tap each)
1. **Vanguard:** (Recommended) A Spearhead: the wedge points at the thickest crowd, base flock unchanged, kite 2.26x / B keep the locked move-direction wedge (only 2.09x when you walk into the crowd, 1.34x kiting, flock visibly doubles).
2. **Talon Mark:** (Recommended) A dive 4x as locked (team single 1.76x, boss 1.64x; the ravens' own damage is about 4.2x base, the 3x cap read on TEAM damage) / B dive 3x (own ~3.1x; team single 1.52x, boss 1.40x; lower the team target to 1.4-1.6x).
Defaults taken (reversible): total-amp cap x1.75 product; Vesper Tide crest x2.0 on the swell; Light Trails tk 0.24; teammate rank 3 for Talon cap@pick; stand-in bases as in section 1.

## 8. Conflicts checked against docs/LOCKED.md (no edit made)
- Light Trails: matches the 2026-10-16 row (fast wolves, luminous trail, Wolf speed lengthens/widens, Bite power raises trail damage, no leap/pin/maul, within band/cap/never below base, tier caps); Rend rule (15-35%, 4 s, strongest wins) used as locked; bleed share gates met in swarm/kite/boss.
- Talon Mark: matches (lighter ~4x dive, +15% 3 s refresh only, TEAM yardstick, amp cap shared with Rally); the amp cap value is a NEW proposal (x1.75 product) needing Matt's confirmation when W8b is locked.
- Vanguard: the 2026-10-16 row says "wedge ahead of the hero in the move direction": measured not band-legal; Option A changes it to "toward the thickest crowd" = a Reopened line if Matt picks A. "Clears the path" fantasy kept.
- Vesper Tide: matches (ring swells out and draws back in; Burn as locked; Burn <= 35%; distinct from Wheel and Halo; guard contraction applies); the crest hit x2.0 is a verb addition (record when locking).
- No status added (Bleed, Mark, Burn only), no control on bosses, no cross-status interactions, nothing saved.

Right now: Matt answers the 2 decisions (Vanguard verb, Talon dive); then B1/E3 continues as locked. Next: record in LOCKED, then the build order proceeds (wolves W7b with Light Trails; Vesper after W4+Burn; ravens after W8a/b). Parked: Mara/Isolde/Vane hero art.

**Security check:** docs + one read-only analysis script (imports Sim/weapons in memory, wraps behaviours in-process only, no file writes, no network, no new dependencies; `PT` env parsed with JSON.parse, unknown ids/keys, non-finite numbers and unknown mode strings rejected); `src/` and `src/data` untouched; no save fields.
**Fit check:** trails are wolf-light "colour returns" ribbons in the wolves' pale blue + lantern warmth; Talon Mark is Mara's omen/mark in violet (red never used); Spearhead is a wedge of ravens (omens flying into the thick of it); Vesper Tide is Elias's lilac candle ring breathing like a vesper bell (gold rim only as the evolution mark). Each verb is distinct from its siblings and from planned hero abilities (checked against third-evolutions.md section 2).
