# Weapons, summons and evolutions v1.1 (WORKING SPEC for W1b, W2..W12)

Status: LOCKED (docs/LOCKED.md row "Weapons + summons + evolutions v1"). This file = v1 (`weapons-and-summons-v1.md`) with every amendment of the independent review (`weapons-review.md`, "R§" below) and Matt's decisions applied. Build chunks read THIS file only; v1 and the review stay as history. Where v1 and v1.1 differ, v1.1 wins. W1a is already built (d64071d). Nothing else is built.

## Changelog from v1
| # | Change | Source |
|---|---|---|
| C1 | Dire Alpha primary hit 5.0x -> **5.4x** bite (single then 1.10x; 5.0x gave 1.02x) | R§1 table 2 |
| C2 | Howling Legion: pack **x1.2** (was 1.1), echo **0.7x** (was 0.6x) -> ~1.9x best case (specced numbers capped 1.70x); the dropped player-speed howl is a hidden nerf and must be swept | R§1, R§6 d2 |
| C3 | Spirit Bolts Swiftness: volley gap 1.1 -> **1.0** (-0.02/rank), not 0.9 (0.9 gave +12% DPS); maxed DPS stays within +-5% | R§1 |
| C4 | Murder Storm keeps an **inner ring** (today's `i%2` at 0.55 Watch) so it still hits a boss in melee and things near the player; outer wall at Watch x0.7; keeps fear path (no new shove mechanic): boss-guard + 1.5 s per-enemy cooldown (built in W1a) | R§1, R§2, R§6 d10 |
| C5 | Orbit guard trigger uses **edge distance** (`d - e.r - p.r < 8`), not centre distance 24 px (a boss centre stays ~32 px away); Candle Wheel wins while active | R§1, R§2 |
| C6 | Echo wolves need a **kill-source tag** (`e.lastHitBy`, also catches bleed kills, `Sim.js:358`); echoes spawn from kills made by the pack (wolves, echoes, bleed), framed as "freed light taking the pack's shape"; alpha 0.5, no outline glow | R§2, R§6 d9 |
| C7 | Raven mark amount (+10%, 3 s) **deferred** to its own chunk W8b after ravens prove out; accept only if swarm team DPS <= +5% and boss TTK <= -8%; mark is shown as a violet tint on the enemy, not an icon | R§2, R§6 d5 |
| C8 | **Halo stopgap DROPPED** (stacked to ~2.1 HP/s, thrown away in W5). Until its own kill-heal chunk the Halo text says what it does (`evolutions.json:11` desc: leaves holy ground that burns). Halo kill-heal = its own chunk (W5b) | R§1, R§5.2, R§6 d4 |
| C9 | **`addSpeedBoost` fix DROPPED** (proposed fix was itself wrong; both callers, Pack Howl and Legion howl, are removed by W2/W6) | R§1, R§5.3 |
| C10 | **Rally the Pack: wolves-only damage bonus** (locked), wolves converge/pin, boss: attack no pin; also **calls ravens** (Matt approved, Reopened line in LOCKED), ravens get NO damage bonus | R§4, LOCKED |
| C11 | "1.8-2.3x" read as **home scenario** (Matt approved), plus never-below-base-at-same-ranks and 3x cap, now a measured table (section 4) | R§4, R§6 d7 |
| C12 | Build order replaced by the review's order, with an **R1 retune checkpoint** (hpScale / per-hero) after W6 and a one-time approved retune of the locked base difficulty | R§5, R§6 d8 |
| C13 | Wolf speed 90 -> 110 moved out of "bug fix" into run-1 batch **W1b** (measured +4..+9 win points both heroes) | R§3a |
| C14 | Soul Lance simplified: try first cd 1.1 -> 0.8, dmg 8 -> 6, aim through densest of nearest 5; add the burning line / multi-lance only if still < 1.0x | R§2 |
| C15 | W8 split: W8a ravens (no mark), W8b mark. Each chunk lists RunScene, card icons, HUD text and tree desc work | R§5 |
| C16 | Raven claim fallback: when fewer targets than ravens, ravens share (as wolves, `weapons.js:113`) so single/boss DPS does not collapse to one raven | R§2 |
| C17 | Rank-0 Orbit and Ravens must not LOSE boss DPS from their Reach/Watch stat (new finding: rank-0 Orbit 101 boss DPS, maxed 2) | R§1 |
| C18 | Interaction rules added: Rally x mark x Blessings x holy are multiplicative; mark is the exception to "max not product" only if total amp is capped (decided in W8b); tree `duration` nodes now buy Rend strength (re-run tree-ablate) | R§3 |

## 1. Shared rules (unchanged from v1 unless marked)
| # | Rule |
|---|---|
| R1 | Evolving never makes you weaker: evolution at the player's actual ranks >= same weapon unevolved at those ranks, in every scenario (>= 1.0x). |
| R2 | Power: 1.8-2.3x in the evolution's HOME scenario (section 4), never above 3.0x, never below 1.0x anywhere. |
| R3 | Boss rule: no fear, pin, hold or shove on `e.boss`. Damage amps allowed. |
| R4 | No dead ranks: stat that goes idle after evolving is re-purposed by the evolution. |
| R5 | No near-dead stats: 5 -> 0 on any stat costs >= 12% DPS in >= 1 scenario. |
| R6 | Summons invulnerable. Stagger parked. |
| R7 | Every weapon hits an enemy on the hero (0-15 px, incl. boss in melee, measured by EDGE distance) at >= 25% of its ring DPS. |
| R8 | Colour: weapon light colour; evolutions add a thin gold rim only. |
| R9 | Stat keys and evolution ids never change (no save migration). Display names/effects change. |
| R10 (new) | Every chunk lists text work: `weapons.json`/`evolutions.json` desc, verb, sub; `cardicons.js`; HUD-2 card text; `tree.json` descs. Text must be true the day it ships (C8). |
| R11 (new) | Kill-source tag (`e.lastHitBy`) is sim-only state, never saved. |

## 2. Weapon specs (deltas to v1; everything not listed is as v1 sections 2-3)
### 2.1 Ghost Wolves (summon, Wren)
Speed 90 -> 110 base (r5 160 -> 170; +12/rank) in **W1b**. Guard reflex (hurt: wolves within 80 px re-pick nearest-to-hero) and **Rend** (bleed 20% -> 50% of bite per s, +6%/rank; time 1.5 -> 4 s) in W1b/W7 chunk below. Wolves also take the Rally +50% (wolves-only; echo wolves included as wolf-source). Targeting, claim set, heel, boss-never-pinned: as v1 3.1.

### 2.2 Raven Flock (summon, scouts) — W8a/W8b
As v1 3.2 with: claim fallback (C16); **Rally calls ravens**: while Rally is active each raven swoops the rallied target (or next claim) on its normal cooldown, no damage bonus (C10); mark is W8b only. W8a ravens peck without marking. Stats (v1 section 4): Flock size 2->7, Peck 10->30 (+4), Watch 90->150 (+12), Wingbeat rest 1.6->0.85 s / flight 260->320 px/s. Rank-0 floor: >= 9 DPS kite. Visual: glow-violet light body vs dark enemy crows; out-and-back arc is the tell.

### 2.3 Spirit Bolts / Chain Lightning
Bolts: Power 10 -> 27.5 (+3.5); **Swiftness** speed 150->260 (+22), turn 5->8 (+0.6), **volley gap 1.1 -> 1.0 (-0.02/rank)** (C3); maxed DPS within +-5% of today (1.008x). Chain: Power 12->42 (+6), first strike 1.5x, Arc jump 60->110 (+10), decay 5%->0% (-1%/rank). Rest as v1.

### 2.4 Holy Orbit (Elias)
Guard contraction: when an enemy's **edge distance** to the hero stays < 8 px for 0.2 s (`d - e.r - p.r < 8`), the ring closes to 14 px over 0.25 s, holds >= 0.8 s, opens over 0.4 s. **Candle Wheel wins while active** (ring in ground sockets; no contraction). Idle flames return to sockets (visual). Kiting play untouched. Rank-0 Orbit must keep boss DPS (C17): acceptance in W4.

## 3. Evolutions (corrected rows only; the other rows are exactly v1 section 5)
| Evolution (id) | Verb and numbers v1.1 |
|---|---|
| Pouncing Pack (`phantom_stampede`) | v1 5.1: leap-pin non-boss 1 s (boss: leap + maul, no pin), chain-pounce after a kill (cd reset on kill, else 1.8 s). |
| Howling Legion (`howling_legion`) | Echo wolf per **pack-tagged** kill of a non-boss; echo lives Rend time x1.5 (~5 s), bites **0.7x**; echo cap = Pack size; pack bite **x1.2** (not x1.1 and not x1.4 wolves); player-speed howl removed; echoes alpha 0.5, no outline glow, short rise anim. Single target (no kills) >= 1.0x. |
| Dire Alpha (`dire_alpha`) | Primary target **5.4x** bite, cleave others 2.2x, bite gap 0.45 s, bleed x1.5; `count` ranks grow size +1 px, cleave +2 px (R4). |
| Murder Storm (`murder_storm`) | Flock doubles (cap 12). **Inner ring** at Watch x0.55 (half the birds, keeps hitting near/boss) + outer counter-rotating wall at Watch x0.7. Contact pecks 0.6x. Existing fear path kept with W1a rules: never on bosses, once per 1.5 s per enemy. Text: "sends enemies fleeing" stays true. Hits taken >= 40% of maxed-base Ravens. |
| Dive Bombers (`dive_bombers`) | Sky-dive: shadow lands 0.4 s before impact on the toughest **unclaimed** target, 6x + 2x splash (18 px), claim set (built W1a), fallback to shared when none unclaimed. Raven mark applies when W8b lands. |
| Spirit Tempest (`spirit_tempest`) | As v1: radial burst of 8 glyphs. Cooldown 0.8 -> 0.85 only if stream40 > 2.4x. |
| Soul Lance (`soul_lance`) | Step 1 (C14): cd 1.1 -> 0.8, dmg 8 -> 6, aim through the densest of the nearest 5 (`nearestEnemies`). Step 2 only if kite/stream10 still < 1.0x: burning script line 1.2 s at 0.25x/s and `count` lances 1 + floor(rank/2) (max 3, 12 deg fan). |
| Thunder Judgment (`thunder_judgment`) | Smite 0.9x -> 0.75x, 30 enemies, 260 px, every 3 s, 9 jumps. |
| Static Storm (`static_storm`) | Strikes per tick 3 + floor(chains/2) (max 5), dmg 0.5 -> 0.42. |
| Sanctum Halo (`sanctum_halo`) | **W5 (no heal):** wide slow candle ring (2x count, cap 12, r = Reach x1.5), ground inside burns 0.2x power/s (cap 20 enemies), ring contact 0.6x, guard contraction pulls candles in. Text honest: "leaves holy ground that burns". **W5b (own chunk, later):** cream mote per enemy dying inside heals 0.5 HP, cap 1.0 HP/s, via kill-source tag; no stopgap. |
| Judgement Wheel (`judgement_wheel`) | Burst 34 px, 1.8x (trim to 1.3x if kite > 3x), 1 s reform, spin x1.8; `radius` ranks grow blast +3 px/rank after evolving, not ring width. |

## 4. Home-scenario table (what "1.8-2.3x" means) and how to measure
Measure with `node scripts/evo-same-ranks.mjs 20 2` (scenarios single / stream10 / stream40, ranks `max` and `pair`; exports `measureRatios`) and `node scripts/probe-summons.mjs` (single / swarm / swarmRun / kite / boss); promise tests in `tests/evo-promises.test.mjs`. Every row also: >= 1.0x in all scenarios (never below base at the same ranks), <= 3.0x anywhere.
| Evolution | Home scenario | Target | Other scenario floor | Measured with |
|---|---|---|---|---|
| Pouncing Pack | kite swarm | 1.9-2.2x | single >= 1.2x | probe-summons kite, single |
| Howling Legion | standing/kiting swarm | 1.8-2.1x (~1.9x) | single >= 1.0x | probe-summons swarm, kite |
| Dire Alpha | standing swarm | 2.0-2.5x | single >= 1.1x (5.4x primary) | probe-summons swarm; same-ranks single |
| Murder Storm | standing swarm | 2.0-2.5x | boss damage > 0; hits taken >= 40% of base | probe-summons swarm, boss |
| Dive Bombers | boss / single | 1.8-2.3x | swarm <= 2.5x | same-ranks single; probe-summons boss |
| Spirit Tempest | kiting swarm | 2.0-2.3x | stream40 <= 2.4x | probe-summons kite; same-ranks stream40 |
| Soul Lance | single / boss | 1.8-2.2x | swarm >= 1.2x, kite >= 1.0x, stream10 >= 1.0x | same-ranks single, stream10; probe-summons kite |
| Thunder Judgment | kiting swarm | 2.0-2.5x | single >= 1.2x | probe-summons kite, single |
| Static Storm | standing swarm | 1.8-2.3x | pair-only ~1.0x | probe-summons swarm; same-ranks pair |
| Sanctum Halo | standing swarm | 2.0-2.3x | boss > 0 (guard) | probe-summons swarm, boss |
| Judgement Wheel | kiting swarm | 2.0-2.3x | swarm >= 1.2x, boss >= 1.0x | probe-summons kite, swarm, boss |
Known EXPECTED-FAIL until their chunk: Dire Alpha single 0.64x (W7b), Soul Lance stream10 0.87x (W10).

## 5. Build order and chunk specs
Order (review): **W1a DONE** -> W2 -> W3 -> W1b + W7 -> W4 -> W5 -> W6 -> **R1 RETUNE CHECKPOINT** -> W8a -> W8b -> W9 -> W7b -> W10 -> W11 -> W12 (W5b Halo kill-heal slots after W8b, own chunk).
Every chunk: scope in 3 lines, `npm test` green, probes below, true-size screenshots where visible, Security + Fit + lock-conflict lines, then Matt playtests and we stop. "Byte-identical" = `GATES=starter node scripts/g1d-sweep.mjs 96` output equals the previous chunk's (before-diff saved in the scratchpad). Run-1 chunks (W1b..W7) may move starter rows; the allowed-to-move list is stated; only the R1 checkpoint re-tunes difficulty.

| Chunk | Scope (3 lines) | Files | Named tests | Probes and acceptance | Art | Balance expectation |
|---|---|---|---|---|---|---|
| **W1a** DONE | Murder Storm boss guard + 1.5 s fear cooldown; Dive Bombers claim set; same-ranks probe. | `weapons.js:200-209,222` | `evo-promises.test.mjs` | starter sweeps byte-identical | none | byte-identical (both evos gated) |
| **W2 Rally the Pack** | Replace Pack Howl: wolves converge and pin toughest non-boss 6 s (boss: attack, no pin), **+50% wolf damage only** (wolf-source incl. echoes), pup-howl ember flare, no fear. Remove Pack Howl `addSpeedBoost` call (so C9 needs no fix). Ravens-call is wired in W8a (no ravens exist yet). | `Sim.js:669-676`, `weapons.js:45`, `characters.json:11`, ability text/HUD ring | `rally-wolves-only` (ravens/orbit/bolts hits unchanged), `rally-boss-no-pin`, `rally-pins-toughest`, `rally-no-fear` | ability-off win% within 5 pts (200 seeds, Wren); window DPS; first-evo median 3-5 min | pup howl, ember flare, converge lines | Wren rows MOVE (down, est. -3..-6 PE); Elias rows byte-identical (no Rally) |
| **W3 Candle Wheel** | Sanctuary ring r 80, 6 s/60 s, heal ~1.5 HP/s inside, orbs lock into sockets; flames burn anything crossing. Wheel priority over contraction (hook for W4). | `Sim.js:677-680`, `weapons.js:330-381`, `characters.json` | `wheel-heals-only-inside`, `wheel-locks-orbs`, `wheel-expires` | ability-off within 5 pts (Elias); heal 1.5 HP/s only inside | wheel plant (elias-v2 10 keyframes) | Elias rows MOVE (up); Wren byte-identical |
| **W1b wolf speed + W7 Rend/guard** | Wolf speed 110 (r5 170); Rend stat (bleed 20->50%, time 1.5->4 s, display name Rend); guard reflex. Text: `weapons.json` stat names + desc, `tree.json` duration descs. Re-run tree-ablate (C18). | `weapons.json:9-12`, `weapons.js:33-151` | `wolf-speed-keeps-up` (rank-0 lag < 150 px max running), `rend-scales`, `guard-reflex-repicks` | review-probe-wolfspeed pattern: expect +4..+9 win pts before Rally offsets; R5 probe-edge on `duration`; same-ranks >= 1.0x | none (drips exist) | Wren+Elias run-1 rows MOVE (up); gated rows byte-identical |
| **W4 Orbit guard** | Contraction with edge-distance trigger, hold 0.8 s, Candle Wheel priority; idle sockets; Wheel Reach -> blast after evolving. | `weapons.js:330-370`, `evolutions.json:12` | `guard-edge-trigger-boss`, `guard-hysteresis`, `guard-yields-to-wheel`, `wheel-reach-blast` | hug scenario (dummies 0-15 px, boss melee): >= 25% ring DPS; kite DPS >= 95% of today; rank-0 boss DPS not lost (C17) | contraction flare, socket idle | Elias rows MOVE (up est. +2..+5 PE); Wren byte-identical |
| **W5 Sanctum Halo** | Consecrated ground (see section 3), ring trim, honest text; NO heal. | `weapons.js:338,372-379`, `evolutions.json:11` | `halo-ring-cap-12`, `halo-ground-burns-cap-20`, `halo-text-true` (no heal claim) | swarm 2.0-2.3x; boss > 0; no sustain claimed | disc bloom | Elias rows MOVE (Halo is run-1) |
| **W6 Howling Legion** | Echo wolves with kill-source tag (`e.lastHitBy`, bleed kills included); pack x1.2, echo 0.7x, cap = Pack size; howl removed. | `weapons.js:39,55-62`, `Sim.js` (hurt/kill tag), `evolutions.json:3` | `echo-cap-pack-size`, `echo-from-pack-kills-only`, `echo-not-from-boss`, `echo-bleed-kill-tagged` | 1.8-2.1x home; single >= 1.0x; sweep for lost howl | echo rise, translucent wolf | both heroes MOVE (est. -2..-4 PE) |
| **R1 RETUNE CHECKPOINT** | Not a feature. Run the 250-seed starter sweep (random + focus, both heroes) after W1b..W7; Matt agrees ONE retune of `hpScale`/per-hero (Wren vs Elias must stay close; no-tree 17-30%). Matt playtests run 1. Record in LOCKED Reopened (difficulty retune, already approved in principle). | `chapters.json`/`balance.json` only | sweep regression | win% 17-30% both heroes; first-evo median 3-5 min; gates-pace within +-1 run | none | this is the one planned re-baseline of the starter sweep |
| **W8a Ravens** | Real summon: crescent, swoop, peck, return, claim + fallback; Rally calls ravens (no bonus); stats per 2.2; no mark. | `weapons.js:154-227`, `weapons.json:15-27`, `Sim.js` (Rally hook), `tree.json` raven descs (`rv_wide`, `rv_oath`) | `ravens-claim-distinct`, `ravens-claim-fallback-shares`, `ravens-rank0-9dps`, `rally-calls-ravens-no-bonus` | rank-0 kite >= 9 DPS; boss DPS > 0; probe-builds pairs 0.5-1.5x median | crescent, swoop, perched bob | gated rows MOVE (ravens up); starter rows byte-identical vs R1 baseline |
| **W8b Raven mark** | +10% damage taken 3 s, refresh only, bosses included, violet tint; cap on total amp decided here (C18). Touches `Sim.hurt`. | `Sim.js:183-190`, RunScene tint | `mark-no-stack`, `mark-expires`, `mark-boss-ok`, `mark-amp-capped` | swarm team DPS <= +5%, boss TTK <= -8% (else drop or shrink) | violet tint | gated rows MOVE; starter byte-identical |
| **W9 Raven evolutions** | Murder Storm inner ring + wall; Dive Bombers sky-dive shadow tell. | `weapons.js` ravens, `evolutions.json:5-6` | `storm-hits-boss-in-melee`, `storm-never-fears-boss`, `dive-distinct-targets` | Storm swarm 2.0-2.5x, hits taken >= 40%, boss > 0; Dive boss 1.8-2.3x | storm ring, dive shadow | gated only; starter byte-identical |
| **W7b Dire / Pouncing** | Dire Alpha 5.4x primary + size ranks; Pouncing chain-pounce. | `weapons.js:33-151`, `evolutions.json:2,4` | `dire-single-ge-1.1`, `pounce-chain-after-kill` | same-ranks single >= 1.1x; swarm 2.0-2.5x; kite 1.9-2.2x | alpha pelt glow, leap arc | Dire gated; Pouncing is Evolve-wolves gate 1 (gated) |
| **W10 Bolts** | Swiftness gap 1.0; Soul Lance step 1 (step 2 only if needed); idle magazine ring. | `weapons.js:230-264`, `weapons.json:36-41`, `evolutions.json:8` | `bolts-swiftness-within-5pct`, `lance-ge-1-stream10` | maxed DPS +-5%; Lance single 1.8-2.2x, kite >= 1.0x | glyph idle ring, script line (step 2) | gated only |
| **W11 Chain** | First strike 1.5x, Arc decay 0, power +6; Static strikes; Judgment trim. | `weapons.js:267-327`, `weapons.json:50-55`, `evolutions.json:9-10` | `chain-first-strike`, `static-strikes-per-chain-rank` | single >= 70 DPS; Chain pairs >= 0.5x median | first-strike crack | gated only |
| **W12 balance pass** | All-gates sweep, pairs, pacing, tree-ablate, remaining expected-fail tests turn green. | data only | full suite | section 6 acceptance | none | gated rows re-baselined |
| **W5b Halo kill-heal** | Cream motes from enemies dying inside the disc heal 0.5 HP, cap 1.0 HP/s; honest text updated. After W8b. | `weapons.js`, `Sim.js` (kill tag reuse), `evolutions.json:11` | `halo-heal-zero-idle`, `halo-heal-cap-1hps` | heal 0.3-1.0 HP/s swarm, 0 idle | cream motes | Elias rows MOVE (up); re-check vs R1 baseline |

## 6. Standing acceptance (every chunk, unchanged from v1 section 8)
| Check | Tool | Acceptance |
|---|---|---|
| Evolution power / R1 | `evo-same-ranks.mjs`, `probe-summons.mjs`, `evo-dps.mjs 30` | section 4 |
| Dead stats | `probe-edge.mjs` | R5 |
| Hug / boss melee | probe-edge + hug scenario | R7 |
| Boss rule | probe-summons boss row + per-evo test | fear/held/shove on boss = 0 |
| Builds | `probe-builds.mjs` B | pairs 0.5-1.5x median |
| Run balance | `g1d-sweep.mjs` / `bot.mjs` 250 seeds, GATES=starter | per chunk "allowed to move" list; band 17-30% after R1 |
| Gate pacing | `gates-pace.mjs 12 40` | progression-gates-v1 table 2.2 +-1 run |
| Tests | `npm test` | green; expected-fail list only as in section 4 |

## 7. Interactions to respect (from review R§3)
- Blessings damage multiplies summons only (`Sim.js:149`): echo wolves and ravens inherit it.
- Rally +50% (wolves) x mark x Blessings x holy are multiplicative; W8b decides a total-amp cap.
- Tree stat nodes on `duration` now buy Rend strength: re-run tree-ablate in W1b.
- Wren vs Elias closeness is the most fragile lock: W2/W3/W1b/W4/W5/W6 are checked per hero and tuned together at R1.
- Murder Storm shoved/feared enemies leaving the wolves' 150 px leash: fear is once per 1.5 s per enemy.

## 8. Open questions for Matt (max 3)
1. **Echo fiction:** echoes only from kills the pack made (recommended; the freed light takes the pack's shape), or from any kill? Default in this spec: pack kills only.
2. **Rally + ravens bonus:** ravens are called by Rally but get no damage bonus (locked wording, as built here). Recommend keep; only reopen if playtest says Rally feels weak with ravens.
3. **CLAUDE.md nudge line drift (B10):** the file says x2.2 / rank 3 / x2; data is pair 4, partnerRank 2, mult 3 (`balance.json:26-30`). Recommend I update that one line in CLAUDE.md (your file, so your yes first).

Residual conflict flagged: docs/LOCKED.md Abilities row and `heroes-and-abilities.md` still say wolves only; the Reopened line (2026-10-15) already covers "also calls ravens". No new conflict found, so nothing added to Reopened.

Right now: Matt reads this spec and answers the 3 questions. Next: W2 Rally the Pack (wolves only). Parked: summon stagger, summon mastery, third evolutions for non-wolf weapons, life-map gameplay link.

**Security check:** docs only; no src/data/tests/package change; kill-source tag and mark are sim-only state, no save fields or keys change (R9, R11); tree text stays `textContent`.
**Fit check:** every verb tied to the Hollow (freed crows, freed wolves, guarding candles, consecrated ground); gold only as evolution rim; mark is violet tint, not a new colour.
