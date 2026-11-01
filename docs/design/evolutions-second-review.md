# Evolutions: independent second review + three options per evolution (2026-10-16)

Status: REVIEW ONLY, NOT LOCKED. No gameplay code or data changed. Reviews docs/design/evolutions-and-stats-review.md ("first review") and docs/research/35-evolutions-desire.md against CLAUDE.md (ability/evolution principle), docs/LOCKED.md (incl. the 2026-10-16 decisions: real small Burn for Elias, 3x cap also at pick time, small attack-rate bonus for Wolf speed and Orbit speed) and docs/design/weapons-and-summons-v1.1.md (the locked W-chain). Matt decides weapon by weapon: every evolution has three options **A (recommended) / B / C**, each first as a one-tap card (label + 1-2 sentences), then in full.

## 0. Bottom line
1. The first review's numbers reproduce exactly (same seeds). Its per-evolution verdicts mostly hold. But it measured only half the question.
2. **New, biggest finding: evolving freezes the weapon.** Evolved weapons are final (`cards.js` buildPool skips `w.evo`), and the bot takes an evolution with the two non-recipe stats at **rank 0-2** (median 1; Elias takes Sanctum Halo with Orb power **rank 0**). So the honest desirability test is "evolve now" vs "skip the gold card and keep ranking the base weapon". On that test Sanctum Halo gives **0.21x** (swarm), Judgement Wheel **0.25x** (kite), Pouncing Pack **0.39-0.59x**, Spirit Tempest 0.68x (single), Howling Legion 0.82-1.03x. An informed player should skip most evolutions today. This, not only the numbers inside each evolution, is why the bot wins as often without the run-1 evolutions (first review 5.6). See decision 1.
3. Scenario choice changes verdicts: Sanctum Halo is 4.3x in a mortal standing swarm but 2.1x against immortal walkers; Judgement Wheel 2.8x kiting but 1.55x vs walkers. Mortal swarms SATURATE (strong weapons run out of enemies), which inflates "cap at pick" ratios and makes damage trims look useless (Wheel `dmg` 1.8 -> 1.3 moved kite 2.82x -> 2.80x). A fixed measurement standard is needed before tuning (section 2.3).
4. Six code bugs or promise gaps not in the first review (section 3), the two worst: Pouncing Pack's leap uses centre distance, so wolves leap and maul a boss non-stop (boss 1.7x, up to 3.3x with the first review's buffs) but never leap at an enemy right next to them; Thunder Judgment's "every enemy near you" picks the first 30 by spawn order, not the nearest, and reaches 260 px (off screen above and below).
5. Status rules: agree with the set and owners; two numeric corrections (Rend potency must be capped near today's total bleed or bleed passes 50% of wolf damage; Burn must replace, not add to, Sanctum Halo's ground damage). Tree status category fits under the 15.5 PE ceiling only at cap 8% x weight 0.15 = 1.2 PE (the first review's weight 0.1 undercounts).

## 1. Evidence (all read-only; reproduce with the commands)
| Script | What | Seeds / noise |
|---|---|---|
| `node scripts/evo-same-ranks.mjs 20 3` | first review's same-ranks table, immortal targets | 3 seeds x 20 s: **reproduced every cell** (e.g. Dire stream40 pair 5.16x, Soul Lance stream10 0.88x, Static pair 3.70x) |
| `node scripts/probe-summons.mjs` | first review's mortal swarm/kite/boss table, seed 3 | 1 seed: **reproduced** (Halo swarm 872 vs base 192 = 4.54x, Wheel kite 599/165 = 3.63x, Dire swarm 889/271 = 3.28x, Pouncing kite 331/212 = 1.56x, Lance kite 426/625 = 0.68x, Murder Storm 1073 vs 74) |
| `node scripts/evo-home.mjs [seeds] [pickRank] [filter]` (NEW) | every evolution vs base, MORTAL single/swarm/kite/boss + IMMORTAL stream40, ranks "pick" (pair 5, others = pickRank) and "max"; prints cap@pick (evo@pick / base@pick), home@max (evo@max / base@max) and **worth** (evo@pick / base@max). Optional `TUNE='{"id":{...}}'` in-memory what-ifs | 3-5 seeds; swarm/kite seed spread +-5-15%, single/boss/stream40 +-1-3% |
| `GATES=all node scripts/evo-pick-ranks.mjs 24` (NEW) | ranks of the two non-recipe stats at the moment the bot takes each evolution | 24 seeds x Wren + Elias; small n for gated ones (bot spreads over 4 weapons) |

Pick-moment ranks (bot): starter Howling Legion n=23 power 1 / speed 2 (median; range 0-5), **Sanctum Halo n=27 power 0 / speed 0**; GATES=all Dire Alpha count 3 / speed 1 (n=4), Soul Lance count 0 / speed 0 (n=3), others n=1. **Pick rank 1 is the realistic default**, not 2 as the first review assumed.

### 1.1 Master table (evo-home, mortal unless stream40; 5 seeds at pick 2, 3 seeds at pick 1)
cap@pick = locked 3x cap at pick time (bold = breaks); home@max = locked 1.8-2.3x band; worth@p1 = evolve-now vs skip-and-max-base, others rank 1.
| Evolution | Home | home@max | stream40 max | single / boss @max | cap@pick p2 (worst) | cap@pick p1 (worst) | worth@p1 home | worth@p1 worst |
|---|---|---|---|---|---|---|---|---|
| Pouncing Pack | kite | 1.41x | 1.17x | 1.10 / 1.72 | 2.33 boss | 1.93 | 0.59 | 0.39 boss |
| Howling Legion | swarm | 1.80x | 1.85x | 1.94 / 2.72 | **3.86 boss** | **3.83 boss** | 1.03 | 0.82 boss |
| Dire Alpha | swarm | **3.06x** | 1.91x | **0.66 / 0.90** | **4.82 swarm** | **6.38 swarm** | 2.94 | 0.66 single |
| Murder Storm | swarm | 10.4x* | 2.10x | 0 / ~0 | **5.31 swarm*** | **3.85*** | 0.85 | ~0 boss |
| Dive Bombers | boss | 66x* | 1.38x | INF / 66* | **5.17 swarm*** | **6.16*** | 33* | 0.68 kite |
| Spirit Tempest | kite | 2.14x | 2.42x | 1.44 / 2.38 | **3.42 swarm** (stream40 2.81) | **6.92 swarm** (stream40 n/a) | 0.80 | 0.68 single |
| Soul Lance | single/boss | 2.00 / 1.33 | 1.31x | 2.00 / 1.33 | 2.92 stream40 | **4.00 single** | 2.00 | **0.50 kite** |
| Thunder Judgment | kite | 2.62x | 2.53x | 1.25 / 1.25 | **3.45 kite** | **4.22 kite** | 2.12 | 0.81 single |
| Static Storm | swarm | 1.93x | 1.67x | 2.47 / 2.54 | **3.00 kite** | **3.46 kite** | 0.93 | 0.93 swarm |
| Sanctum Halo | swarm | **4.34x** | 2.06x | 0 / **0** | **3.71 swarm** | 2.70 kite | **0.34** (p0: **0.21**) | 0 boss |
| Judgement Wheel | kite | 2.79x | 1.55x | 0 / ~0 | **4.33 swarm** | **6.00 swarm** | **0.25** | 0.25 |
*ravens: base ravens are broken (single 0, boss 3 DPS) until W8a, so every raven ratio is meaningless today (agree with first review).

## 2. Where I disagree with (or add to) the first review
1. **"Evolved weapons are final" is the root desirability problem**, not only per-evolution numbers (finding 0.2). The first review's R4 point ("count ranks dead after evolving") is the symptom; it never compared evolve-now with keep-ranking. Decision 1.
2. **Pick-time ranks are rank ~1, not 2.** Measured, see 1. At rank 1 more evolutions break the cap at pick (Dire 6.4x, Tempest 6.9x mortal swarm, Thunder 4.2x kite, Lance 4.0x single).
3. **Judgement Wheel: `dmg` 1.8 -> 1.3 does NOT fix kite** (measured 2.82x -> 2.80x, 3 seeds): kills are capped by enemy supply and by contacts per second, so the lever is contact rate (rest time, spin) and blast size, not damage. Also: rest 1.6 -> kite 2.25x but swarm drops to 0.84x (below base). Needs the W4 contraction + blast rework, then tune rest.
4. **Spirit Tempest is not "fine"**: at pick it breaks the cap (stream40 2.81x at rank 2 is close, mortal swarm 3.4-6.9x), and 65% of its bolts are wasted on a single target (radial burst + turn radius 73 px orbiting a close target). `cd`/`dmg` trims barely move the swarm number (saturation) but cut single to 1.1x. Fix the waste (claimed re-home) and cap via stream40.
5. **Thunder Judgment smite 0.9 -> 0.75 alone is not enough at pick** (kite 2.95x at rank 2, borderline; ~3.5x at rank 1) and the smite is aimed wrongly (bug B4). Needs nearest-first + on-screen radius + the trim.
6. **Static Storm is at the cap edge at pick** (kite 3.00x at rank 2, 3.46x at rank 1); W11's 0.42 brings rank 2 to 2.47x.
7. **Howling Legion breaks the cap at pick on a boss** (3.8x: 11 wolves can all reach a big boss). W6 echo wolves (no kills on a boss -> pack x1.2 only) fixes this as a side effect; worth stating as an acceptance gate.
8. **Pouncing Pack's leap trigger is a bug, not just weak tuning** (B1): it is centre-distance. The first review's "3% leap time standing in a crowd" and "boss 1.44x" are both symptoms. Fix the trigger before tuning (with the first review's leapHit 2.4 / cd 1.2 on top of the bug, boss became 2.43x at max, 2.76x at pick; with dmg 1.3 also: boss 3.34x, over cap).
9. **Halo/Wheel/base Orbit all do 0 to a boss in melee and 0 to a hugging single target** (Orbit max: single 0, boss 7 DPS). Both Elias evolutions inherit this. W4 contraction is locked for the base; it must explicitly apply to both evolutions too (acceptance), or R1 "never below base" is met only because the base is also 0.
10. **Rend numbers (locked W7 20 -> 50%/s for 4 s)** would make one bite's bleed worth up to 200% of the bite; today's max (35%/s x 4 s = 140%) already gives a 38% bleed share in swarms. That breaks the first review's own DoT target (<= 35% of the weapon). Recommend 15 -> 35%/s (+4/rank) at fixed 4 s; tune inside W7 against the share gate (no reopen needed if the gate is the acceptance).
11. Agree with: Dire Alpha / Soul Lance reworks as v1.1 (with additions below), Halo honest text now, Legion = W6, ravens wait for W8a, status set and owners, boss immunity to control, no cross-status combos, Burn owned by Holy Orbit.

### 2.3 Measurement standard (proposed default; reversible, not a Matt decision)
- **Home band 1.8-2.3x**: mean of 5 seeds in the evolution's MORTAL home scenario (evo-home), ranks max.
- **3x cap at pick**: pick ranks = pair 5 + others **1**; must hold in IMMORTAL stream40, single and boss, and in the mortal home scenario. Mortal swarm cells above 3x are reported but only fail if stream40 also exceeds 3x (saturation rule).
- **Never below base**: same ranks, every scenario incl. mortal kite and boss, >= 0.98x (noise floor, like evo-promises).
- **Worth** (if decision 1 = A, the weapon keeps ranking after evolving, so worth = cap@pick by construction): no extra gate. If decision 1 = C (stays final): worth@p1 >= 1.0x in home.

## 3. Bugs and promise gaps found in the code (all evolutions read line by line)
| # | Where | What | Effect | Fix (chunk) |
|---|---|---|---|---|
| B1 | `weapons.js:121` Pouncing | leap if `d > 12 && d < 110` with d = centre distance | boss (big r) is always "> 12" away: all wolves leap + maul it non-stop (boss 1.7x now); a small enemy touching the wolf is never leapt at (3% leap time standing) | use edge distance `d - t.r - u.r` in 16..120 (W7b) |
| B2 | `weapons.js:74-90` Pouncing | leap flies to the target's position at take-off, then damages the target wherever it now is; maul snaps the wolf onto it | a charging Fell Wolf can be "hit" 40+ px from where the wolf lands (teleport snap) | re-aim the leap end each frame (W7b) |
| B3 | `Sim.js:202-207` Bleed | `bleedDps` is never reset when `bleedT` runs out | the strongest bleed an enemy ever had (e.g. a Pack Howl 2x bite) stays its potency forever; later weak bites inherit it | reset `bleedDps = 0` on expiry (E3/W7, Wren rows move slightly) |
| B4 | `weapons.js:315-322` Thunder Judgment | cap 30 taken in `sim.enemies` order (oldest first), radius 260 | in a dense swarm, far old enemies are struck and near new ones skipped; strikes land off screen (view half-height 180) | nearest-first, radius 180 (W11) |
| B5 | `weapons.js:298` Static Storm | floor `max(0.1, ...)` applied before `mods.cooldown` | tree cooldown nodes can push ticks under 0.1 s | apply floor after mods (W11) |
| B6 | `Sim.js:593` + `weapons.js:395` Sanctum Halo | heal zones are dropped on the ring (~109 px out); player heals only when standing in one | text "heals you slowly" false (measured 0 HP standing) | text now (E1), W5 |
| B7 | `weapons.js:377-384` Judgement Wheel | blast has no per-enemy gate: two lights touching one enemy in the same frame both blast it | double hits on clumps (part of the overkill 36%) | per-enemy blast gate 0.1 s (W4) |
| B8 | `weapons.js:8` tune fallbacks | code fallbacks differ from data (Dire dmg 3.4 vs 3.2, cleave 28 vs 24; Pouncing leapCd 3.2 vs 1.8, maul 0.3 vs 0.45; Storm fear 1.2 vs 0.3) | harmless today, wrong if a tune key is deleted | make fallbacks equal data (any chunk; byte-identical) |
| B9 | `weapons.js:164` Murder Storm | fear 0.3 s at 1.3x speed = ~15 px backstep | "sends foes fleeing" barely visible | W9 fear 0.6-0.8 s |
| B10 | `cards.js:143` + design | evolved weapons are final | finding 0.2 | decision 1 |

## 4. Per weapon: coherence check + three options per evolution

Format per evolution: **Now** (numbers) -> **One-tap** (A/B/C label + 1-2 sentences) -> **Full** (per option: verb/fantasy, trigger rules, look/sound, card name + whisper, estimated multipliers home / crowd / single / boss / kite at max, cap at pick, risks, fit with the four stats and the recipe pair) -> **Verdict + pick moment + acceptance**. Estimates are design numbers from the probes and what-ifs; every one is re-measured in its build chunk.

Pick moment (shared, chunk E9; per evolution only the cue changes): 0.4 s render-only beat (sim keeps the level-up pause it already has), gold rim flash on the weapon's units, the new verb fires at once on the nearest valid target, one short sound cue (audio not built yet: cue names reserved), one codex line written on first evolve (recipe revealed only then, as locked "recipes hidden").

### 4.1 Ghost Wolves (Wren; stats Pack size / Bite power / Wolf speed / Bleed time -> Rend)
**Coherence:** Pack size and Bite power are the strong, plain picks (+15-50% per rank). Wolf speed is near-dead until the locked attack-rate bonus (+4% bite rate per rank) lands; Bleed time is dead until Rend (W7). Three evolutions share 4 stats: Legion = size + Rend, Pouncing = speed + power, Dire = power + Rend. With all three unlocked every wolf stat sits in a pair, so the evoNudge stops steering (it weights all four the same): fine. The pairs make sense once the dead stats are alive: Legion (many wolves whose bleeding kills raise echoes), Pouncing (fast, hard hunters), Dire (one heavy bleeder). No pair change needed **if** W7 Rend and the speed bonus ship first; until then the nudge shows the dead Bleed time on 35% of wolf cards (first review), so E1 hint text must say plainly what it does today. Risk: Bite power is in two pairs, so with Dire + Pouncing both unlocked, whichever partner maxes first decides; acceptable (the "Something stirs" hint shows when a pick completes a pair).

#### Pouncing Pack (`phantom_stampede`, tree gate; recipe Wolf speed + Bite power)
**Now:** kite 1.41x (target 1.9-2.2), single 1.10x, boss 1.72x via bug B1, worth@p1 0.39-0.59x. Leap barely seen.
**One-tap:**
- **A (Recommended) Chain Hunt:** wolves leap at prey 16-120 px away, pin it (not bosses) and maul; a kill lets the wolf leap again at once to the next prey. Wolf speed ranks make leaps longer and more often.
- **B Hold the Line:** fewer, longer pins: each leap pins 1.5 s and the pinned enemy takes +25% from all wolves; built for survival more than damage.
- **C Guardian Pounce:** wolves stay at Wren's heel and leap out at anything that comes within 90 px of her, then return; a bodyguard pack.
**Full:**
- A. Verb LEAP. Trigger: per wolf, target edge distance 16-120 px and leap cd ready (cd 1.2 s - 0.08 s per Wolf speed rank, so 0.8 s at r5); kill during maul or leap resets cd. Land: 2.4x bite + bleed, pin 1.0 s (non-boss, then 1.5 s pin immunity), maul 0.6x every 0.2 s for 1 s. Fix B1/B2. Look: crouch 0.1 s, arcing leap with a stretched blue streak, pale-blue paw ring under the pinned enemy for the pin time; sound `evo_pounce_land` (soft thump + snarl). Card: **Pouncing Pack** / "Leap, pin, maul: a kill sends them leaping again". Est @max: kite 1.9-2.1x, crowd 1.5-1.7x, single 1.15-1.3x (adjacent prey: first strike on each new target is a short pounce), boss 1.2-1.5x (edge-distance fix removes perma-leap), cap at pick ~2.0-2.4x (boss checked). Risks: leaps pull wolves off Wren (first review: 18% wolf-time away); kill-reset can chain across a crowd (bounded: cd floor 0.3 s, leap range 120). Stats fit: speed becomes the leap stat (R4), power scales everything; pair coherent.
- B. Verb PIN. Pin 1.5 s, +25% wolf damage on pinned (wolves-only amp, never boss), leap cd 2.0 s. Est: kite 1.6-1.8x, hits taken -20-30%, boss 1.1x. Risks: second damage amp next to Rally +50% and Mark (needs the amp cap from W8b); control-heavy, less "wow". Fit: good (pack holds prey for Wren) but overlaps Rally the Pack's fantasy (Rally pins the toughest).
- C. Verb GUARD. Wolves heel within 30 px; any non-boss entering 90 px of Wren is pounced (2.0x + pin 0.8 s). Est: kite 1.5-1.8x, hits taken -35%, single 1.0x, boss 1.0x (no leap on bosses, bites only). Risks: wolves stop hunting far prey (fewer gems collected, lower swarm DPS); may read as passive. Fit: strong with Wren the protector, weaker with "hunters".
**Verdict:** worth picking only after A (or B) plus decision 1 = A; today it is a trap. Pick moment: every wolf crouches and leaps at once at the nearest prey; cue `evo_pouncing_pack`. Codex: "Wolves do not chase. They wait, they leap, they hold." **Acceptance:** kite 1.9-2.2x (5 seeds), single >= 1.2x, boss 1.0-2.3x, cap@pick p1 <= 3.0x in stream40/single/boss, leap+maul time 10-25% of wolf-time kiting, distinct targets >= 85% of pack, boss never pinned (test).

#### Howling Legion (`howling_legion`, run 1; recipe Pack size + Bleed time/Rend)
**Now:** swarm 1.80x, kite 1.81x, single 1.94x, **boss 2.72x (3.8x at pick: over cap)**, worth@p1 0.82-1.03x; no new verb (more wolves + a player-speed howl you hardly see).
**One-tap:**
- **A (Recommended) Echo Pack (locked W6):** prey your wolves kill rises as a pale echo wolf that fights for a few seconds; the pack bites a little harder.
- **B Great Howl:** every 8 s the pack howls: non-boss enemies near Wren flinch back and the pack bites 50% harder for 3 s.
- **C Bigger Pack (today, trimmed):** keep the extra wolves but trim their bite so it stays under the cap; no new verb.
**Full:**
- A. Verb ECHO. Per W6: echo per pack-tagged non-boss kill (bleed kills included), echo bite 0.7x, life ~5 s (Rend time x1.25), cap = Pack size, pack bite x1.2, no extra live wolves, howl removed. Look: translucent echo (alpha 0.5) rises from the body with a blue wisp; sound `evo_echo_rise` (soft rising howl, rate-limited 4/s). Card: **Howling Legion** / "Prey your pack fells rises to run with it". Est @max: swarm 1.8-2.0x, kite 1.8-2.0x, single 1.2x, **boss 1.2x (fixes the cap)**, cap at pick ~1.9-2.1x. Risks: echo count with Rend bleed kills can snowball in big swarms (cap = Pack size bounds it); removes the speed howl (small hidden nerf; sweep). Fit: size + Rend both feed it (more wolves, more bleed kills) - best recipe fit of the three.
- B. Verb HOWL. Every 8 s: 0.6 s fear (non-boss within 90 px, 1.5 s immunity), pack x1.5 for 3 s. Est: swarm 1.7-1.9x, single 1.4x, boss 1.4x, hits taken -15%. Risks: duplicates Rally the Pack/Pack Howl (Wren's ability) - two howls blur the ability's identity; conflicts with the locked W2 "no fear" spirit of Rally. Fit: weak (stats unrelated to howl).
- C. Verb PACK. count x1.4+1 kept, bite 1.25 -> 1.0, howl removed. Est: swarm 1.5-1.6x, boss ~2.2x (still many wolves on a boss). Risks: no new verb - the exact complaint in Matt's feedback 4. Fit: neutral.
**Verdict:** A. Today it is not worth chasing (bot wins as often without it). Pick moment: the current pack howls once and two echo wolves rise from the nearest fallen foes (seeded from the next kills); cue `evo_howling_legion`. Codex: "Nothing the pack takes stays fallen." **Acceptance:** swarm/kite 1.8-2.1x, single >= 1.0x, boss <= 2.3x, cap@pick p1 <= 3.0x boss included, echoes never from boss, starter sweep reported per hero (run-1 evolution: Wren rows move).

#### Dire Alpha (`dire_alpha`, tree gate; recipe Bite power + Bleed time/Rend)
**Now:** swarm 3.06x (over cap), single 0.66x and boss 0.90x (below base), kite 1.42x, cap at pick 4.8-6.4x (it ignores Pack size, so vs a small pick-time pack it is huge).
**One-tap:**
- **A (Recommended) The Alpha:** one giant wolf: a crushing bite on its prey and a lighter sweep that bleeds everything beside it; Pack size makes the alpha bigger and its sweep wider.
- **B Alpha and Shades:** a smaller alpha plus two ghost shades that keep hunting other prey, so the pack still covers a crowd while you run.
- **C Alpha's Charge:** one giant wolf that charges in a straight line through the crowd every 3 s, bleeding everything it tramples, and bites hard between charges.
**Full:**
- A. Verb ALPHA. Primary bite 5.4x every 0.45 s, cleave others 2.2x within 22 px + 2 px per Pack size rank, bleed x1.5 (capped by the Rend share rule), alpha size +1 px per Pack size rank (R4, v1.1). Look: wolf 2.5x size, frost mane, gold rim, cleave arc (not a ring) on each bite; sound `evo_alpha_bite` (deep crunch). Card: **Dire Alpha** / "One great wolf: a crushing bite that bleeds all beside it". Est @max: swarm 2.2-2.5x, single 1.1-1.2x, boss 1.1-1.2x, kite 1.3-1.6x, cap at pick ~2.5-3.0x (cleave 2.2x is what fixes pair stream40 5.2x - must be checked at p1). Risks: kite coverage is one target (first review: 1 distinct target); if kite < 1.6x, add B's shades. Fit: power + Rend = heavy bleeding bites: coherent.
- B. Verb ALPHA. Alpha 4.0x primary / 1.6x cleave + 2 shades at 0.5x that use the claim set; shades count = 2 fixed, Pack size ranks +5% alpha bite each. Est: swarm 2.0-2.3x, kite 1.7-2.0x, single 1.1x, boss 1.1x. Risks: "one giant wolf" fantasy diluted; three bodies to render (cheap). Fit: good.
- C. Verb CHARGE. Every 3 s (fixed; Wolf speed is not in the recipe): 140 px line charge, 3x to all within 12 px of the line + bleed, then 4x bites. Est: swarm 2.0-2.4x, kite 1.8-2.1x, single 1.0-1.2x, boss 1.2x (charge hits once). Risks: the alpha runs away from Wren (gems, safety); overlaps Pouncing's leap verb; more code. Fit: big-beast fantasy strong, stat fit weaker (Rend fine, power fine).
**Verdict:** A, add B's shades only if kite < 1.6x. Pick moment: the pack gathers into one wolf with a single deep howl; cue `evo_dire_alpha`. Codex: "Seven hungers became one." **Acceptance:** swarm 2.0-2.5x, single >= 1.1x, boss >= 1.0x, kite >= 1.4x, cap@pick p1 <= 3.0x in stream40/single/boss (EXPECTED_FAIL `dire_alpha|max|single` removed).

### 4.2 Raven Flock (tree; stats Flock size / Peck power / Flock radius -> Watch / Flight speed -> Wingbeat)
**Coherence:** today the base is broken (single 0 DPS, boss 3 DPS; Flock radius is a trap when you stand still), so no raven number can be judged; W8a makes ravens real scouts (swoop, peck, return) and turns radius into Watch (spot range) and speed into Wingbeat (rest between swoops). After W8a all four stats are live. Pairs: Murder Storm = size + Watch (a vast flock watching a wide circle) and Dive Bombers = Wingbeat + power (fast, hard dives): both coherent, no change. Nudge honest after W8a.

#### Murder Storm (`murder_storm`, tree gate; recipe Flock size + Flock radius/Watch)
**Now:** meaningless ratios (10.4x swarm vs broken base; stream40 2.10x), boss ~0, fear 0.3 s barely visible (B9).
**One-tap:**
- **A (Recommended) Wall of Wings (locked W9 + visible fear):** the flock doubles into an inner ring that keeps pecking what reaches you and an outer wall that sends enemies fleeing for a moment.
- **B Crow Cyclone:** the flock becomes a moving whirlwind that drifts onto the thickest crowd near you and shreds it.
- **C Storm Shield:** a tight ring of ravens that knocks ordinary enemies back when they touch it: much safer, less damage.
**Full:**
- A. Verb STORM. Flock x2 (cap 12), inner ring Watch x0.55 + outer counter-rotating wall Watch x0.7, pecks 0.6x, fear 0.6-0.8 s (non-boss, 1.5 s immunity, W1a rules). Look: two counter-rotating violet rings, frightened enemies get a feather wisp and their eye-points flicker; sound `evo_murder_storm` (wing roar). Card: **Murder Storm** / "A storm of wings: what reaches you is pecked, the rest flee". Est vs W8a base: swarm 2.0-2.5x, kite 1.8-2.2x, boss 1.0-1.3x (inner ring), hits taken >= 40% lower. Cap at pick: re-measure after W8a. Risks: fear pushes enemies away from wolves/orbit (team DPS loss), fear cap keeps it bounded. Fit: size + Watch coherent.
- B. Verb CYCLONE. 60 px whirlwind moves at 80 px/s to the densest cluster within 150 px, contact pecks every 0.3 s. Est: swarm 2.2-2.5x, kite 1.8x, boss 1.5x if the cyclone parks on it. Risks: more code, moves damage away from Wren (less protective). Fit: Watch decides how far it roams: coherent.
- C. Verb WARD. Ring at 60 px, contact 1.0x + shove 20 px (non-boss only, R3). Est: swarm 1.4-1.6x (under band), hits taken -50%. Risks: under the 1.8x band (would need the band waived as a "defence" evolution); shove reads like physics noise in big swarms. Fit: OK.
**Verdict:** A, re-measured after W8a. Pick moment: the flock bursts outward into two rings with a caw; cue `evo_murder_storm`. Codex: "A murder does not hunt. It refuses." **Acceptance:** swarm 2.0-2.5x vs W8a base, boss > 0 and >= base, hits taken >= 40% lower than maxed base, fear never on boss (test exists), cap@pick p1 <= 3.0x.

#### Dive Bombers (`dive_bombers`, tree gate; recipe Flight speed/Wingbeat + Peck power)
**Now:** boss 202 DPS vs base 3 (meaningless until W8a), stream40 1.38x, no tell before a dive.
**One-tap:**
- **A (Recommended) Sky Dive (locked W9):** ravens climb and dive at the toughest enemy near you for a huge hit; a shadow marks the spot just before they land.
- **B Talon Mark:** dives hit less hard but mark the target so everything hits it harder for a few seconds.
- **C Raven King:** one great raven dives at the toughest enemy again and again; the rest of the flock is gone.
**Full:**
- A. Verb DIVE. Toughest unclaimed target within 170 px (claim set built), 0.4 s shadow tell, 6x + 2x splash 18 px, dive cd 2.4 s - Wingbeat; tune the 6x after W8a so boss = 1.8-2.3x. Look: raven climbs off-screen-top 0.2 s, violet shadow grows, impact ring; sound `evo_dive_bombers` (whistle + thud). Card: **Dive Bombers** / "Ravens drop from the sky on the strongest foe". Est vs W8a base: boss 1.8-2.3x, single 1.8-2.3x, swarm <= 2.5x. Risks: all ravens diving leaves the near ring empty (fewer hits taken saved). Fit: Wingbeat = how often, power = how hard: coherent.
- B. Verb MARK. Dive 4x, target marked +15% damage taken 3 s (W8b mark rules, refresh only). Est: boss 1.6-1.9x team, single 1.5x. Risks: needs W8b's total-amp cap; damage shows up on other weapons, so the evolution looks weak on its own. Fit: good for a support raven hero (Mara) later.
- C. Verb KING. One raven 2x size, dives every 1.0 s at 4x. Est: boss 2.0x, swarm 0.8-1.0x (below base). Risks: copies Dire Alpha's "many become one" (second time on one hero kit), fails never-below-base in swarm. Fit: weak.
**Verdict:** A after W8a. Pick moment: the whole flock climbs and the first dive lands on the toughest foe on screen; cue `evo_dive_bombers`. Codex: "They choose the largest shadow and fall on it." **Acceptance:** boss 1.8-2.3x vs W8a base, swarm <= 2.5x, kite >= 1.0x, distinct targets (test exists), cap@pick p1 <= 3.0x.

### 4.3 Spirit Bolts (tree; stats Bolt count / Bolt power / Bolt speed -> Swiftness / Pierce)
**Coherence:** count, power, pierce are strong; Bolt speed is dead (0% everywhere) until W10 Swiftness (speed + turn + volley gap). Pairs: Spirit Tempest = count + Swiftness (many quick bolts) and Soul Lance = power + pierce (one piercing lance): coherent once Swiftness lands. Soul Lance makes Pierce meaningless after evolving (infinite pierce) and ignores count: option A re-uses both (R4). Nudge: until W10 the nudge pushes the dead Bolt speed for Tempest (gated weapon, so only tree players see it); E1 hint text must say it does little today. No pair change.

#### Spirit Tempest (`spirit_tempest`, tree gate; recipe Bolt count + Bolt speed/Swiftness)
**Now:** kite 2.14x, stream40 2.42x, boss 2.38x, single 1.44x (65% of bolts wasted on one target), cap at pick stream40 2.81x (p2), mortal swarm 3.4-6.9x.
**One-tap:**
- **A (Recommended) Burst and Seek:** every volley bursts eight glyphs in a ring; each then seeks its own enemy instead of all chasing the same one, and pops in a small blast.
- **B Spirit Nova:** the eight glyphs spiral outward in a widening ring that sweeps the whole screen and passes through what it hits.
- **C Glyph Halo:** the glyphs circle you for a moment as a shield, then launch at the nearest foes.
**Full:**
- A. Verb BURST. 8 glyphs radial, then each re-homes to a distinct target from the nearest 8 (claim set; shares only when fewer targets), explode 0.6x r22 only on a hit (not in empty air), cd 0.85 s (v1.1 allows 0.8 -> 0.85), Swiftness shortens cd 0.02 s/rank. Look: ring of cyan glyphs blooming from Wren, each with a short thread to its prey; sound `evo_spirit_tempest` (chime burst). Card: **Spirit Tempest** / "Eight glyphs burst out, each finds its own foe". Est @max: kite 2.0-2.2x, swarm 2.0x, single 1.6-1.9x (less waste), boss 2.0-2.3x, cap at pick stream40 ~2.6-2.9x (must verify at p1). Risks: better single target raises boss; keep boss <= 2.5x via explode only on hit. Fit: count (8 is the max count +2) and Swiftness (gap) coherent.
- B. Verb NOVA. No homing, pierce 2, ring expands 300 px/s. Est: swarm 2.0-2.3x, kite 1.8x, single 1.0-1.1x, boss 1.0-1.2x. Risks: weak single/boss (fails "never below base" at single if not careful). Fit: Swiftness = ring speed: fine.
- C. Verb WARD. Glyphs orbit 40 px for 0.6 s (contact 0.5x), then launch. Est: kite 2.0x, hits taken -10%. Risks: copies Holy Orbit's look/verb (two orbiting rings on one screen for Elias), identity clash. Fit: weak.
**Verdict:** A. Pick moment: the first burst fires immediately in a full ring; cue `evo_spirit_tempest`. Codex: "Eight lights, eight names, none wasted." **Acceptance:** kite 2.0-2.3x, single >= 1.5x, boss <= 2.5x, stream40 <= 2.4x at max (v1.1), cap@pick p1 <= 3.0x stream40, wasted bolts <= 25% on a single target.

#### Soul Lance (`soul_lance`, tree gate; recipe Bolt power + Pierce)
**Now:** single 2.00x, boss 1.33x, **kite 0.61x and stream10 0.88x (below base)**, cap at pick single 2.7x (p2) / **4.0x (p1)**; 80% overkill in crowds; count and pierce ranks do nothing after evolving.
**One-tap:**
- **A (Recommended) Lances of Light (v1.1 step 1 + 2):** a quicker piercing lance aimed through the thickest line of foes; Bolt count adds a second and third lance in a narrow fan, and the line it cuts burns briefly.
- **B Impaling Spear:** the lance sticks in the first big enemy and bursts a second later, hurting everything around it.
- **C Sweeping Beam:** a beam of light that sweeps a short arc in front of you every 1.5 s.
**Full:**
- A. Verb LANCE. cd 0.8 s, dmg 6x, aim through the densest line among the nearest 5; lances = 1 + floor(count/2) (max 3 at count 5, 12 deg fan); pierce ranks widen the lance (+2 px/rank, R4); a script line stays 1.2 s and deals 0.25x/s to what stands on it (it is area damage, not a status). Cap at pick: power-heavy pair, so at p1 there is 1 lance; dmg 6 must give single <= 3x vs a 2-bolt base: measured today 8x/1.1 s = 4.0x at p1 -> 6x/0.8 s ~ 4.1x: **still over** -> make lance damage scale 3.5x + 0.6x per count rank (p1: 4.1x, one lance, ~2.8x vs base by dmg/cd scaling; max: 6.5x, 3 lances). Look: pale lance with a gold rim and a glowing script line; sound `evo_soul_lance` (sharp whoosh + choir note). Card: **Soul Lance** / "A lance of light through the thickest line of foes". Est @max: single 2.0-2.2x, boss 1.8-2.1x, kite 1.0-1.3x, swarm 1.3-1.6x. Risks: three lances + line can overshoot crowd; tune line 0.25x. Fit: power + pierce coherent, count kept alive.
- B. Verb IMPALE. Single lance 4x sticks in the first enemy with hp > 2 hits, bursts after 1 s for 3x in 40 px. Est: single 2.0x, boss 2.0x, swarm 1.4x, kite 1.1x. Risks: on fast small enemies it rarely sticks (falls back to pierce). Fit: power yes, pierce weak.
- C. Verb BEAM. 60 deg sweep over 0.5 s every 1.5 s, 160 px reach, 3x per enemy touched. Est: swarm 1.8x, kite 1.4x, single 1.4x, boss 1.4x (under home band). Risks: new render primitive, Chain-Lightning-like look. Fit: medium.
**Verdict:** A with the count-scaled damage. Pick moment: the first lance fires at once through the thickest line; cue `evo_soul_lance`. Codex: "One light, spoken through all of them." **Acceptance:** single and boss 1.8-2.2x, kite >= 1.0x, stream10 >= 1.0x, swarm >= 1.2x, cap@pick p1 <= 3.0x single/boss (EXPECTED_FAIL `soul_lance|max|stream10` removed).

### 4.4 Chain Lightning (tree; stats Chains / Power / Cooldown / Jump range -> Arc)
**Coherence:** chains, power, cooldown live; Jump range is dead in any crowd until W11 Arc (jump loses less power). Pairs: Thunder Judgment = chains + power, Static Storm = cooldown + Jump range: coherent; Jump range is live inside Static Storm (field radius 110 + 0.8 x range). After Static Storm, Chains is idle (W11: strikes per tick from chains, R4). After Thunder Judgment, Cooldown still drives the normal chain; Arc is idle (fine: fixed 9 jumps). Nudge: pushes the dead Jump range for Static Storm until W11 Arc; honest hint text meanwhile. No pair change.

#### Thunder Judgment (`thunder_judgment`, tree gate; recipe Chains + Power)
**Now:** kite 2.62x (target 2.0-2.5), swarm 2.42x, single/boss 1.25x, cap at pick kite 3.45x (p2) / 4.22x (p1); smite aim bug B4.
**One-tap:**
- **A (Recommended) Judgment from Above:** every 3 s lightning strikes the 30 nearest enemies on screen at once (a dark flicker warns half a second before); plus your normal chain.
- **B Storm Crown:** your chain marks every enemy it touches; every 3 s all marked enemies are struck again.
- **C Pillar of Judgment:** every 4 s one huge bolt falls on the thickest crowd near you and blasts everything in it.
**Full:**
- A. Verb SMITE. Nearest-first up to 30, radius 180 (on screen), smite 0.65x (0.75 measured kite 2.45x max but 2.95x at p2; 0.65 targets <= 2.8x at p1, verify), cd 3 s, 9 chain jumps. Look: 0.3 s sky darkening + pale-cyan pillars on every target (Low: pillars only, no darkening; reduced motion: no flash); sound `evo_thunder_judgment` (one big crack, never per target). Card: **Thunder Judgment** / "Every few seconds the sky strikes all foes near you". Est @max: kite 2.2-2.4x, swarm 2.0-2.2x, single 1.2x, boss 1.2x. Risks: biggest "wow" of the set: keep the cap honest at pick. Fit: chains (how many) + power: coherent.
- B. Verb CROWN. Chain marks (sim-only flag 3 s), smite hits only marked ones at 1.0x. Est: kite 1.9-2.2x, single 1.3x. Risks: "mark" word clashes with the raven Mark status (rename "charged"); fewer visible strikes. Fit: chains decide how many get charged: very coherent.
- C. Verb PILLAR. 50 px blast 3x on the densest cluster within 180 px. Est: swarm 2.0x, kite 1.8x, single 1.5x, boss 1.5x. Risks: loses the "everything near me" moment that makes it the favourite. Fit: medium.
**Verdict:** A. Pick moment: first smite fires at once on everything near you; cue `evo_thunder_judgment`. Codex: "The sky keeps its own count." **Acceptance:** kite 2.0-2.5x, single >= 1.2x, cap@pick p1 <= 3.0x kite/stream40, zero strikes outside the view rectangle (test), nearest enemies always among those struck (test).

#### Static Storm (`static_storm`, tree gate; recipe Cooldown + Jump range)
**Now:** swarm 1.93x, kite 2.05x, single 2.47x, boss 2.54x, cap at pick kite 3.00x (p2) / 3.46x (p1); random strikes repeat on the same foe; B5.
**One-tap:**
- **A (Recommended) Living Field (W11):** a crackling field around you strikes several different enemies every fraction of a second; more Chains means more strikes, and it never hits the same foe twice in a row.
- **B Static Cloak:** lightning lashes out only at enemies that come close to you; strong when you are surrounded.
- **C Thunderhead:** a small storm cloud drifts ahead of where you walk and rains strikes under it.
**Full:**
- A. Verb FIELD. Strikes per tick 3 + floor(chains/2) (max 5), dmg 0.42x (what-if: swarm 1.75x, kite 1.83x, single 2.08x, cap@pick p2 2.47x), prefer enemies not struck in the last 0.5 s, floor after mods (B5), radius 110 + 0.8 x Jump range. Look: faint cyan field ring at the radius, short sky-strikes; sound `evo_static_storm` (continuous low crackle, ducks under music). Card: **Static Storm** / "A crackling field strikes foe after foe around you". Est @max: swarm 1.8-2.0x, kite 1.9-2.1x, single 2.0x, boss 2.0x. Risks: single/boss strong for a crowd evolution (fine, under cap). Fit: cooldown = tick, range = field size, chains = strikes: all four stats alive.
- B. Verb CLOAK. Strikes only within 70 px + Jump range x0.3, 0.6x. Est: swarm (standing) 2.0x, kite 1.3x, boss 2.2x. Risks: weak while kiting; Jump range barely matters. Fit: medium.
- C. Verb CLOUD. Cloud 70 px wide, 60 px ahead of the move direction, 4 strikes/tick under it. Est: kite 2.2x, swarm (standing) 1.5x, boss 1.6x. Risks: standing still makes it hover on you (fine) - more code, new sprite. Fit: medium-good (storm imagery).
**Verdict:** A. Pick moment: the field ring blooms and the first strikes fall at once; cue `evo_static_storm`. Codex: "The air itself takes your side." **Acceptance:** swarm 1.8-2.3x, cap@pick p1 <= 3.0x kite/stream40, no repeat strike on the same enemy within 0.5 s while others are in range (test), tick never < 0.1 s with tree mods (test).

### 4.5 Holy Orbit (Elias; stats Orb count / Orb power / Orbit size / Orbit speed)
**Coherence:** count and power are strong; Orbit size is two-faced (helps kiting, a trap when enemies touch you: the donut hole) until W4 guard contraction; Orbit speed is weak until the locked attack-rate bonus (per-enemy hit gap shrinks with speed). Pairs: Sanctum Halo = count + size (a wide ring of many lights) and Judgement Wheel = power + speed (fast, hard bursts): coherent once size and speed work. Biggest gap: base Orbit at max does 0 to a hugging single target and 7 DPS to a boss in melee, and both evolutions inherit it (Halo boss 0, Wheel boss ~0). The locked Burn lives here (section 5). The starter bot evolves Halo with Orb power **rank 0** - the heaviest freeze cost in the game (decision 1). Nudge: in run 1 it shows the trap Orbit size on 37% of Elias's orbit cards (first review) and that pull is exactly what leaves Orb power at rank 0; honest after W4, and with decision 1 = A the frozen-power cost disappears. No pair change.
Name note: "Judgement Wheel" (evolution) and "Candle Wheel" (Elias's ability) are both wheels on the same hero; readable only if they look clearly different (option A keeps it a burst ring, never a planted wheel).

#### Sanctum Halo (`sanctum_halo`, run 1; recipe Orb count + Orbit size)
**Now:** swarm 4.34x mortal / 2.06x stream40, kite 2.90x, **boss 0 (below base 7)**, heal promise false (B6), worth@p0 0.21x.
**One-tap:**
- **A (Recommended) Consecrated Ring (locked W5 + Burn):** a wide, slow ring of candles; the ground inside it smoulders and sets enemies standing on it alight; the ring closes in when foes touch you.
- **B Halo of Embers:** the wide ring itself sets alight every enemy it passes; no ground zones, simpler and easier to read.
- **C Sanctuary Ring:** a defensive ring: ordinary enemies that touch it are pushed back and singed; less damage, much safer.
**Full:**
- A. Verb HALO. W5: lights x2 (cap 12), ring r = Orbit size x1.5, ring contact 0.6x, ground disc inside the ring applies **Burn** (section 5) to up to 20 enemies instead of separate zone damage (no double DoT), guard contraction pulls the ring in when foes touch you; W5b kill-heal later as its own chunk. Look: warm candle ring, faint ember-gold ground glow inside (lilac flame licks on burning foes), never gold rim on enemies; sound `evo_sanctum_halo` (low choir swell). Card: **Sanctum Halo** / "A wide ring of candles; the ground inside it burns". Est @max: swarm 2.0-2.3x, kite 1.8-2.1x, boss >= 1.0x (contraction), cap at pick p0/p1 <= 2.5x. Risks: the ring is still empty in its centre (contraction is the fix: must be tested on the evolution, not only the base); Burn tuning is shared with base Orbit. Fit: count + size = wide ring of many lights: coherent.
- B. Verb EMBER. Ring as A but no ground disc; each light touch applies Burn (2 s); ring contact 0.5x. Est: swarm 1.8-2.1x, kite 2.0x, boss >= 1.0x (contraction). Risks: Burn carries most of the evolution's damage, so the DoT share may exceed 35% of Orbit damage (gate). Fit: good, less code (no ground zones).
- C. Verb WARD. Ring contact 1.0x + 25 px shove (non-boss, R3) + 0.4 s stagger per enemy per 1.5 s. Est: swarm 1.5-1.7x (under band), hits taken -40%. Risks: under the 1.8x band; shove in big swarms looks like jitter. Fit: strong with Sanctuary/Candle Wheel's protect theme, but duplicates the ability's job.
**Verdict:** A, and only worth picking with decision 1 = A (today Elias freezes Orb power at 10). Pick moment: the lights spread into a wide ring and the ground inside glows for the first time; cue `evo_sanctum_halo`. Codex: "Where the candles walk, the Hollow cannot stand." **Acceptance:** swarm 2.0-2.3x, boss >= 1.0x vs base after W4, hug scenario >= 25% of ring DPS (R7), cap@pick p0 and p1 <= 3.0x, Burn share <= 35% of Orbit damage, no heal text until W5b.

#### Judgement Wheel (`judgement_wheel`, tree gate; recipe Orb power + Orbit speed)
**Now:** kite 2.79x, swarm 1.16-1.37x, stream40 1.55x, boss ~0, cap at pick mortal swarm 4.3-6.0x (tiny base), worth@p1 kite **0.25x** (count is not in its pair, so a 3-light wheel is frozen). Damage trims do not move kite (section 2.3).
**One-tap:**
- **A (Recommended) Bursting Lights (W4 + tune rest):** fast lights burst in a small holy blast when they touch an enemy, then rekindle after a short rest; the ring closes in when foes touch you, and Orbit size makes the blast bigger.
- **B Rolling Wheel:** the lights lock into a burning wheel that rolls a short way ahead of Elias in the direction he walks, crushing a lane.
- **C Lantern Flares:** the lights fly out to the nearest enemies, burst, and return to Elias like boomerangs.
**Full:**
- A. Verb BURST. Spin x1.8, blast 34 px + 3 px per Orbit size rank (W4), dmg 1.5x, rest 1.0 -> tune 1.2-1.4 s (what-if rest 1.6: kite 2.25x but swarm 0.84x, so the contraction must lift swarm before rest rises), per-enemy blast gate 0.1 s (B7), guard contraction. Look: lilac light flares into a small round blast with a gold rim, the light re-forms as a tiny ember; sound `evo_judgement_wheel` (bright pop, pitch varies). Card: **Judgement Wheel** / "Lights burst on contact, then rekindle". Est @max: kite 2.0-2.3x, swarm 1.2-1.5x, boss >= 1.0x (contraction), cap at pick <= 3x in stream40. Risks: still kill-saturated; tune with stream40 + kite. Fit: power + speed (how hard, how often) coherent; size alive as blast (R4).
- B. Verb ROLL. Wheel of all lights, 30 px radius, rolls 60 px ahead in the move direction, contact 1.5x; standing still = wheel parks in front. Est: kite 2.2x, swarm (standing) 1.3x, boss 1.5x (roll into it). Risks: name/visual clash with Candle Wheel; directional (no protection from behind). Fit: medium.
- C. Verb FLARE. Each light every 1.2 s flies to the nearest unclaimed enemy within 140 px, 34 px blast 1.5x, returns. Est: kite 1.9-2.2x, swarm 1.4-1.6x, single 1.8x, boss 1.6x. Risks: Elias loses his close ring (identity: "flame ring around the priest"); overlaps Spirit Bolts. Fit: medium-weak for Elias.
**Verdict:** A. Pick moment: every light bursts at once in a ring of blasts and rekindles; cue `evo_judgement_wheel`. Codex: "Each light is a verdict, spoken once." **Acceptance:** kite 2.0-2.3x, swarm >= 1.2x, boss >= 1.0x, hug >= 25% ring DPS, cap@pick p1 <= 3.0x stream40/kite.

## 5. Status effects: final recommended ruleset
| Status | Owner | Kind | Rule (numbers) | Boss | Readout |
|---|---|---|---|---|---|
| Bleed (Rend) | Ghost Wolves (+ Dire cleave) | DoT | one per enemy; new application: potency = max(current, new), time = max(remaining, 4 s); **reset potency on expiry (B3)**; Rend 15 -> 35% of bite per s (+4/rank) at fixed 4 s (not v1.1's 20 -> 50%: see 2.10) | full | pale-blue drips, summed number every 0.5 s (E2) |
| Pin | Ghost Wolves (Pouncing, Rally) | control | max 1.0 s (Pouncing B 1.5 s), then 1.5 s pin immunity; maul keep-alive cannot extend past the pin | immune | wolf-blue paw ring |
| Fear | Murder Storm only (Pack Howl retired by W2; Rally has no fear) | control | 0.6-0.8 s, 1.3x away, once per 1.5 s after recovery (built W1a) | immune (test exists) | feather wisp, eye flicker |
| Mark | Ravens (W8b) | amp | +10% damage taken, 3 s, refresh only; **total external amp cap: Mark is the only enemy-side amp at launch** (Pouncing B's +25% would need this cap raised: reason to prefer Pouncing A) | allowed | violet outline |
| Burn (Kindle) | Holy Orbit (all users; Elias's holy +15% applies once, to the hit) | DoT | one per enemy; potency = max(current, 20% of the triggering hit per s), time refresh to 2.0 s; applied by Orbit contact hits, Halo ground (replacing zone damage), Wheel blasts; **not** by Candle Wheel (ability stays modest) | full | 1-2 lilac flame licks, lilac summed number |
Shared: no status stacks with itself; different statuses coexist; no cross-status interactions at launch; DoT ticks cannot trigger on-hit effects; DoT kills credited via the source tag (bleed already, Burn the same); control never on bosses (R3, locked); sim-only state, never saved (R11); max 3 marks drawn per enemy; Low tier = tint only.
**DoT share gates (measured with a `dotBy` counter, E2):** each DoT <= 35% of its owner weapon's damage in its best scenario; <= 15% of team damage over a starter bot run; <= 10% of boss damage. Expected Burn: Orbit hits a touched enemy ~2/s -> Burn 0.2 hit/s -> ~9% of Orbit damage + 2 s tails, ~12-18% in Halo; Elias run-1 gain ~+5-9% Orbit DPS (moves Elias rows up; fold into R1).
**Burn timing:** Burn belongs with W4/W5 (Orbit work) and BEFORE the R1 retune, because it moves Elias run-1 rows (Elias is deliberately weak on dev; LOCKED Elias kit decision waits for R1).

### 5.1 Tree status nodes (input for skill tree sheet #5)
- One shared capped category **Status potency**: cap C = **8%** (stat %), PE weight **0.15** (a DoT is ~10-15% of team damage, so +1% potency ~ +0.15% power) -> **1.2 PE at cap**. Today's listed caps sum to ~13.9 combat PE (progression-gates 3.1), so 1.2 fits under the 15.5 validator limit with ~0.4 left; the first review's 0.1 weight (1.0 PE) undercounts. Conflict to record when locking: either accept 15.1 of 15.5 used, or take 0.5 from Area (0.7 PE).
- Control-duration nodes (Firm Grip pin +0.2 s, Old Fears fear +0.2 s, Raven's Eye mark +0.5 s) count as sustain/verb PE at a fixed 0.3 each against the sustain ceiling 5 (they are survival).
- Rules from the first review kept: nodes per status not per weapon, appear only once a source of that status is unlocked (Soulstone rule), unlock by playing the owner (kills of bleeding/burning enemies), prefer duration/visual nodes over raw %.
- Existing nodes `wf_bleed` (+0.5 s bleed) and `wf_third` (+0.5 s bleed, +6% power) become Rend potency under W7: they move into the Status category and must be re-costed (tree-ablate re-run, C18).
- **Must wait for sheet #5:** node positions in the weapon clusters; the per-status counters (save fields: bleedKills, burnKills, pins, marks) incl. schema version bump and save validator tests; whether status nodes exist at launch at all; final cap after the `dotBy` measurements.
- Conflicts checked vs LOCKED: none blocking. Notes: (1) LOCKED "Weapons v1.1" Rend 20-50% is a number inside a locked spec: my 15-35% is offered as W7 acceptance tuning, Matt confirms in W7; (2) Pouncing B and any second amp conflict with the planned W8b single-amp cap; (3) Burn on Candle Wheel would break the locked "Candle Wheel modest" (W3) - excluded.

## 6. Build order (small chunks, data first)
| # | Chunk | Type | Contents | Verification | Starter rows |
|---|---|---|---|---|---|
| 0 | Probes (THIS commit) | scripts | `evo-home.mjs`, `evo-pick-ranks.mjs` | n/a | untouched |
| E1/E2 | (in progress by another agent) | data/render | honest text, readable bleed, `dotBy` | sweeps byte-identical | identical |
| B1 | Gated bug fixes | sim | B4 Thunder nearest + 180 px, B5 Static floor, B7 Wheel blast gate, B8 fallbacks = data | starter `g1d-sweep` byte-identical; evo-home before/after on the 3 evolutions; new tests (no off-screen smite, floor) | identical |
| D1 | Decision 1 build (if A) | cards.js + test | evolved weapons keep stat cards for their non-recipe stats (nudge off, stirs off) | cards tests; starter sweep 96 seeds per hero: report win/first-evo/Blessing share (rows MOVE up, expected) | move (both) |
| W7 | Rend + bleed reset (B3) + wolf speed bite rate | code+data | as v1.1 W7 with 15-35% Rend | stat-ranks (Rend r0->r5 >= +12%), bleed share <= 35% swarm, same-ranks >= 1.0x | Wren moves |
| W4+BURN | Orbit guard + Burn + orbit speed hit-rate + Wheel A blast | code+data | contraction on base AND both evolutions, Burn rules section 5 | hug >= 25%, boss > 0 for Orbit/Halo/Wheel, Burn share <= 35% of Orbit, evo-home Wheel | Elias moves |
| W5 | Halo A | code+data | ground applies Burn, ring cap 12 | evo-home Halo p0/p1/max, swarm 2.0-2.3x | Elias moves |
| W6 | Legion A | code | echo wolves | evo-home Legion incl. boss <= 2.3x | both move |
| R1 | RETUNE checkpoint | data | hpScale / per-hero once | 250-seed sweep, win 17-30% both heroes | re-baseline |
| W8a/W8b/W9 | ravens, mark, Storm A, Dive A | code | as v1.1 + fear 0.6-0.8 s | evo-home ravens vs new base | gated only |
| W7b | Pouncing A (B1/B2 fix) + Dire A | code+data | as section 4.1 | evo-home wolves p1/p2/max, leap-time metric | gated only |
| W10 | Tempest A + Lance A | code+data | claimed re-home, count-scaled lance | evo-home bolts, wasted-bolt metric | gated only |
| W11 | Thunder A + Static A | data+code | smite 0.65, strikes from chains, no-repeat | evo-home chain p1 | gated only |
| E9 | Evolve beat | render | per-evolution first-verb + cue names + codex line | screenshots true size + phone; sweeps byte-identical | identical |
| E10 | Status marks + pin immunity | sim+render | section 5 | tests per rule; sweeps report | small move |
Each chunk: `npm test` green, `npm run build`, `npm audit`, starter sweep diff (byte-identical where marked), evo-home table (5 seeds) attached, screenshots for visible changes, Matt playtests, stop.
Also extend `tests/evo-promises.test.mjs` per chunk with a "cap at pick (p1, stream40/single/boss) <= 3.0x" check for that chunk's evolutions (immortal scenarios are deterministic enough for a test).

## 7. "Truly happy" acceptance
Numeric gates (every evolution, 5 seeds, evo-home + same-ranks): home band 1.8-2.3x at max; never below base (>= 0.98x) in single, stream10, stream40, swarm, kite, boss; cap@pick p1 <= 3.0x in stream40/single/boss and the mortal home scenario; boss > 0 and >= base; verb visibility metric per evolution (section 4 acceptance lines); in full bot runs with the evolution unlocked, runs that take it win at least as often as runs that skip it (48 seeds, report CI). Run-1 extra: bot win with vs without Howling Legion / Sanctum Halo: with >= without.
Playtest checklist for Matt (each evolution, one run): (1) did you notice the moment you picked it? (2) within 5 seconds could you say what it does? (3) did it feel stronger than just levelling the weapon? (4) is anything on screen confusing (off-screen strikes, wolves vanishing, blasts too busy)? (5) would you pick it again next run? A "no" on 2, 3 or 5 sends that evolution back to its options.

## 8. Decisions for Matt (max 3, recommendation first)
1. **What happens to a weapon's other stats after it evolves?** (Recommended) A: the two stats outside the recipe keep appearing as normal cards, so evolving early never freezes the weapon (it reopens the locked line "evolved weapons are final") / B: evolving raises every stat to max at once (HoloCure style: a huge spike that breaks the 3x cap at pick) / C: keep them frozen and tune every evolution to beat a fully levelled base weapon even at rank 1 (several would then break the 3x cap at pick).
2. **Rend strength (wolf bleed):** (Recommended) 15% -> 35% of the bite per second for 4 s, so bleed stays about a third of wolf damage / the locked 20% -> 50% (bleed becomes about half of wolf damage in crowds).
3. **Where Burn comes from:** (Recommended) Holy Orbit hits, Sanctum Halo's ground and Judgement Wheel's blasts, never the Candle Wheel ability / also the Candle Wheel ring (stronger ability, reopens "Candle Wheel modest").
Plus the per-evolution A/B/C choices in section 4 (A recommended for all eleven).

Security check: docs + two read-only analysis scripts (import the Sim and bot only; no network, no file writes, no new dependencies; TUNE env is parsed with JSON.parse, only known evolution ids accepted, in-memory only); no src/data/tests change; proposed status state is sim-only and never saved; future status counters are save fields and need the save validator (sheet #5).
Fit check: every option keeps its weapon's spirit and colour (wolves hunt/pin/bleed in pale blue, ravens fear/mark in violet, bolts and chains in cyan, Elias's flame burns in lilac), evolutions only add the gold rim, red stays danger; options that copy another hero's verb (Raven King, Glyph Halo, Great Howl) are offered only as contrasts and not recommended.
