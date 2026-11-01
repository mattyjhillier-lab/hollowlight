# Independent review: weapons, summons and evolutions v1

Reviewer: fresh agent, did not write the design. Reviewed: `docs/design/weapons-and-summons-v1.md` against CLAUDE.md, `docs/LOCKED.md`, heroes-and-abilities, progression-gates-v1, research 25, and the code/data on `dev` (2026-10-15). Probes re-run today: `node scripts/probe-summons.mjs`, `node scripts/evo-dps.mjs 20`, plus two scratch probes written for this review: `scripts/review-probe-misc.mjs` (Dire Alpha multiplier, wolf lag) and `scripts/review-probe-wolfspeed.mjs` (paired 200-seed win% with wolf speed overridden in memory). No `src/`, data, test or package file changed.

## 0. Verdict in one paragraph
The diagnosis is right and the bug list is honest: every claimed bug reproduces. The direction (more verbs, not more numbers; boss rule; "evolving never makes you weaker") fits the Hollow and the summoner fantasy. But the package is too big to tune as one thing, several stated numbers do not reach their own targets (Dire Alpha, Howling Legion, Bolts Swiftness), two redesigns break the design's own rules (Murder Storm wall vs bosses, Halo stopgap stacking), and W1 mixes gated-only fixes with run-1 balance changes, so it cannot be verified as "no balance change". **GO WITH CHANGES**: start with a gated-only bug slice that leaves starter sweeps byte-identical, and treat all run-1 changes (wolf speed, Rally, Rend, guard, Halo, Legion) as one tuned batch with an hpScale checkpoint.

## 1. Correctness: do the claims hold?
| Claim | Evidence (file:line, probe today) | Holds? |
|---|---|---|
| Murder Storm fears the boss | `weapons.js:222` sets `fearT` with no `e.boss` check; `Sim.js:373-376` applies fear to any enemy incl. boss. probe-summons boss: fear 46%, hitsTaken 0.00/s, ttk 113 s | YES |
| Murder Storm 15x swarm | 1124 vs maxed-base 74 DPS = 15.2x (probe-summons swarm). But evo-dps (static dummies, no fear) says 1.94x / 1.91x. The 15x is mostly the weak donut base plus fear keeping enemies in the ring. Real problem = 0 hits taken + boss lock, not the multiplier. | YES, but framing overstates |
| Sanctum Halo heals 0 | `weapons.js:376-377`: zone spawns at a random orb (radius 38+30=68 x1.6 = 109 px), r 22; `Sim.js:576` heals only if hero within 22 px of zone centre. Standing still never heals; walking through gives a little. | YES (standing) |
| Donut hole | orb at 68 px, reach 68+4+e.r: enemies at 0-~50 px never touched. probe: Orbit max boss 2 DPS, Halo boss 0, Ravens max boss 1. **New finding:** rank-0 Orbit hits the boss at 101 DPS and rank-0 Ravens at 75 DPS; the Reach/Watch stat itself removes boss damage (a stat that makes you worse vs the boss). | YES, worse than stated |
| Dire Alpha 0.65x single | probe-summons and evo-dps: 176 vs 269 = 0.65x | YES |
| Soul Lance 0.88x stream10 | evo-dps: 384 vs 439 = 0.88x; probe kite 426/625 = 0.68x, overkill 80-83% | YES |
| Speed-boost overwrite | `Sim.js:169-172` sets `speedMult = mult` unconditionally while duration takes max. Legion howl 1.2 overwrites Pack Howl 1.25. **The proposed fix ("keep the larger mult") is also wrong**: a short 1.25 then leaves 1.25 running for a longer 1.2's remaining time. Needs per-source timers or no fix (see 5). | YES; fix as written is buggy |
| Dive Bombers share targets | `weapons.js:202` `toughestEnemy` has no claim set. probe sameTgt: swarm 33/65 (51%), kite 29/62 (47%) | YES (~46-51%) |
| Wolf base speed 90 < Wren 105.6 | `weapons.json:11` 90; Wren 96 x1.1 (`characters.json:7-8`). Review probe, rank-0, hero running straight in a swarm: speed 90 max lag 295 px / avg 147 / 11.1 DPS; speed 110 max 198 / avg 120 / 14.7 DPS (+32%). "214 px" not reproduced exactly, direction holds. | YES |
| Pack Howl ~3.7x | Not re-measured. `weapons.js:45,53`: howl doubles dmg, speed and bite rate (2x2 = 4x bite DPS) during 6 s. Plausible. | Plausible |
| CLAUDE.md nudge drift (B10) | `balance.json:26-30` pair 4 / partnerRank 2 / mult 3; `cards.js:147-150` uses them; CLAUDE.md says x2.2 / rank 3 / x2 | YES |

Arithmetic in the design that does NOT hold:
| Item | Design says | Reality | Fix |
|---|---|---|---|
| Dire Alpha primary 5.0x -> single >= 1.1x | 1.1x | Review probe: 5.0x gives **1.02x**; 5.4x gives 1.10x | primary 5.4x (or bite gap 0.42) |
| Howling Legion 1.8-2.1x | pack x1.1 + echoes 0.6x, cap = Pack size | Best case (cap always full) (7x1.1 + 7x0.6)/7 = **1.70x**; and the player-speed howl (~+10% average move speed) is removed | pack x1.2, echo 0.7x -> ~1.9x; sweep for the lost howl |
| Bolts Swiftness "maxed DPS within +-5%" | gap 1.1 -> 0.9, power +3.5 | 1.1/0.9 x 27.5/30 = **1.12x** (+12%) | gap -0.02/rank (1.1 -> 1.0): 1.008x |
| Murder Storm keeps R1/R7 | wall at Watch x0.7 = 105 px, bosses never shoved | Boss in melee sits ~32 px from centre (treant r 26): wall does ~0 boss DPS while base swooping ravens do hit it -> evolving makes you weaker vs boss (breaks R1, R7) | keep an inner ring (today's `i%2` at 0.55) or let 2 storm ravens keep swooping |
| Halo W1 stopgap 0.8 HP/s | 0.8 HP/s | zones every 1.5 s, ttl 4 s -> ~2.7 overlapping zones at the feet when standing = **~2.1 HP/s**, above the design's own 1.0 cap and above Candle Wheel's 1.5 | do not ship the stopgap (see 5) |
| Guard trigger "enemy within 24 px" | centre distance | Treant centre stays ~32 px away in melee: trigger never fires for the boss | use edge distance (d - e.r - p.r < 8) |

## 2. Design quality
| Element | Fits Hollow / hero / summoner? | Readability at 40-60 px | Code/anim cost | Verdict |
|---|---|---|---|---|
| Wolves polish (speed 110, guard reflex, Rend) | Yes, Wren's pack | Good | S | Keep. Rend is good (bleed time is near-dead today). |
| Ravens as scouts (swoop, mark, return) | Yes: freed crows, second true summon, distinct from Orbit | **Risk:** player ravens dart among enemy Carrion Crows (r 4); both are small birds. Needs glow-violet light body vs dark corrupted crows, and the out-and-back arc as the tell. Feather icon over a 4 px crow is unreadable: use a violet rim/tint on the marked enemy instead. | M | Good idea, not a trap. Add claim fallback (share when fewer targets than ravens, as wolves do at `weapons.js:113`) or single-target/boss DPS collapses to one raven. |
| Raven mark +10% | Summoner synergy is real | Fine if tint, not icon | S, but touches `Sim.hurt` (every hit) | Multiplies everything (Rally, Blessings, tree, holy) and a boss stays marked permanently. Build as its own chunk after ravens prove out. |
| Echo wolves (Legion) | Strongest Hollow tie. **Fit gap:** a killed crow or root crawler turning into a wolf is odd. Frame echoes as "freed light taking the pack's shape" or spawn only from pack kills. | 7 real + 7 translucent wolves + Rally + bleed drips: busy. Echo alpha 0.5, no outline glow, short rise anim. | M; **hidden cost:** `Sim.hurt` has no source, bleed kills (`Sim.js:358`) are anonymous. Needs a kill-source tag (`e.lastHitBy`). | Good, with tuned numbers and source tagging in scope. Perf fine (cap 7). |
| Orbit guard contraction | Very good: "the candles protect him"; fixes donut and boss | Clear (snap in / breathe out) | S-M | Best idea in the doc. Needs: edge-distance trigger, hysteresis (already 0.8 s hold), priority rule with Candle Wheel (wheel wins while active). |
| Sanctum Halo consecrated ground + kill motes | Fits Elias and colour-bloom identity | Disc + motes readable | M | Good. Motes = another per-kill hook (same source-tag work as echoes). |
| Murder Storm shove | Fine fiction | Fine | M | **Simpler:** today's fear 0.3 s at 1.3x speed (`Sim.js:375`) already moves an enemy ~18-24 px, i.e. it IS a shove. Keep the fear path, add boss guard + per-enemy 1.5 s cooldown + inner ring; rename text. No new mechanic. |
| Dive Bombers sky-dive shadow | Readable, distinct | Good (shadow tell) | S-M | Keep; claim fix is cheap. |
| Soul Lance written line (best line of 8, burning script, 1-3 lances) | Fits Isolde later | Script line readable | **L: three new mechanics in one evo** | Over-built. Try first: cd 1.1 -> 0.8, dmg 8 -> 6, aim through densest of nearest 5 (existing `nearestEnemies`). Add the burning line only if still < 1.0x. |
| Chain first strike 1.5x, Arc no-decay | Fine | Fine | S | Keep. |
| Bolts idle magazine ring | Visual only | Good | S | Keep (art chunk). |

Missing from every behaviour spec: the RunScene work (new states: swoop, perch, echo rise, contraction, mark tint) is not listed in W-chunk file lists; nor are `cardicons.js` / HUD-2 `verb`/`sub` text and `tree.json` descs.

## 3. Balance risks
Rule of thumb (progression-gates-v1 line 10): ~2 win points per PE (1 PE ~ +1% effective power). Run-1 (starter) content is Wolves + Orbit + Legion + Halo; everything else is gated and only moves the "all gates" 45-55% target.

| Change | Starter? | Direction | Rough size | Notes |
|---|---|---|---|---|
| Wolf speed 90 -> 110 (r5 160 -> 170) | yes | **both heroes up** | **+4 to +9 win points measured (3a), ~2-4 PE** | rank-0 running DPS +32% |
| W2 Rally replaces Pack Howl (~3.7-4x wolves for 6 s, fear, +25% run speed) | yes | **Wren down, likely large** | -3 to -6 PE est. | Locked, not optional; dominates the Wren number |
| Rend (bleed 0.35 -> 0.20..0.50 of bite) | yes | Wren down at low rank, up ~+7% wolf DPS at r5 (`duration` is in the nudged Legion pair, so often maxed) | +2 to +4 PE for wolf builds | |
| Orbit guard | yes | Elias up (huggers, boss) | +2 to +5 PE est. | bot kites at 90 px but still takes ~2 hits/s in swarms |
| Halo rework | yes | Elias: DPS down (872 swarm today -> 2.0-2.3x of new base), heal up (0 -> 0.3-1.0 HP/s) | unknown sign | |
| Legion rework | yes | down: <=1.7x as specced, howl gone | -2 to -4 PE | both heroes |
| Chain +6 power, first strike, no decay | gated | Chain up ~+30% swarm | | fixes Chain 0-25% builds |
| Ravens power x2, Watch, swoop | gated | Ravens up a lot at rank 0-2 | | |
| Mark +10% | gated | all-weapons x1.10 on marked; boss always marked | up to +5 PE in the boss phase | 47-63% of Wren deaths are at the boss (research 25) |
| Murder Storm / Halo trims, Dive claim | gated / starter (Halo) | down | | |

Consequences for the locks:
- **No-tree win 17-30% (LOCKED hpScale 0.46/0.020) will move** on both heroes, in different directions: Wren (Rally down, speed/Rend up) and Elias (guard up, Halo/Legion down). **Wren vs Elias "close" is the most fragile lock.** Expect an hpScale or per-hero retune; Matt should agree in advance that the locked base-difficulty numbers may be re-tuned once (record it in LOCKED "Reopened").
- Must be tuned together, as one batch with one checkpoint: wolf speed + Rally + Rend + Legion (Wren); guard + Halo + Candle Wheel + Legion (Elias).
- Interactions: Blessings damage multiplies summons only (`Sim.js:149`): echo wolves and ravens inherit it, so Legion/ravens gain from Blessings more than magic. Tree stat nodes on `duration` now buy Rend strength (bigger than "bleed time" was): re-check tree-ablate. Rally +50% x mark x Blessing x holy are all multiplicative (research 23 rule 11 says use max, not product): decide mark is an exception or cap total amp. Candle Wheel vs guard contraction need a priority rule.
- "1.8-2.3x" lock: the design redefines it as "in its home scenario". That is a sensible reading but it is a reinterpretation of a LOCKED line; Matt should approve it explicitly.

Measured (review-probe-wolfspeed, paired seeds 1-200, starter gates, Blessings on): see table 3a.

### 3a. Wolf speed 90 -> 110 alone (win%)
| Cell | speed 90/+14 (today) | speed 110/+12 | Delta |
|---|---|---|---|
| wren random | 20% | 24% | +4 |
| wren focus | 20% | 28% | +8 |
| elias random | 23% | 32% | +9 |
| elias focus | 22% | 29% | +7 |
Same seeds 1-200 in both runs, CI about +-6 per cell, so read the direction, not the exact size. **A one-number "data" change in W1 adds +4 to +9 win points on both heroes** (Elias also takes wolves in run 1) and pushes Elias to the top of the locked 17-30% band. This is the strongest proof that W1 is not a "promise fix": wolf speed belongs in the run-1 batch, tuned together with Rally (which will pull Wren down).

## 4. Locked-design conflicts
| Item | Lock | Conflict? |
|---|---|---|
| Rally the Pack extended to ravens; W2 text says "+50% summon dmg" | LOCKED: "+50% **wolf** damage", wolves converge | **YES**: W2 must build wolves-only; extension needs Matt's reopen |
| 1.8-2.3x "home scenario" | LOCKED principle "~1.8-2.3x base, 3x cap" | Reinterpretation: needs Matt's OK |
| Base difficulty hpScale 0.46/0.020, no-tree 17-30% | LOCKED | Run-1 changes will move it; plan a reopen |
| Elias holy +15% | LOCKED (characters.json:19 = 1.15) | none (research 25 says 1.10, superseded by research 26) |
| Candle Wheel "orbs lock into the ring" | LOCKED | consistent, but guard contraction must yield to it |
| Keep 11 evolutions, pairs, ids, stat keys, gates, gold for evolutions only | LOCKED / CLAUDE.md | consistent (R9, 5.6, R8) |
| Echoes from any enemy | Unique creatures / identity | fit question, not a lock break |
| CLAUDE.md nudge line | CLAUDE.md (Matt's file) | doc drift; ask before editing |

Nothing else found that contradicts LOCKED.md or CLAUDE.md.

## 5. Build plan
Problems with W1-W12:
1. W1 mixes gated-only fixes (Murder Storm, Dive) with run-1 changes (wolf speed, Halo stopgap, speed-boost fix), so "no balance change" cannot be proven and the sweep delta has several causes.
2. The Halo stopgap is throwaway code that moves Elias's balance twice (and stacks to ~2.1 HP/s). Make the text true instead (`evolutions.json:11` desc "leaves holy ground that burns" until W5) or go straight to W5.
3. `addSpeedBoost` fix: both callers (Pack Howl, Legion howl) are removed by W2/W6. Drop it; if kept, use per-source timers.
4. Run-1 balance is checked chunk by chunk but only re-tuned at W12. Move a **run-1 retune checkpoint (R1)** right after W7 (W1 wolf speed, W2, W3, W4, W5, W6, W7 Rend) and before any gated work.
5. W8 is too big: split W8a ravens summon (no mark), W8b mark.
6. Add RunScene/visual work and text (`weapons.json` desc + stat names, `evolutions.json` desc/verb/sub, `tree.json` raven descs) to each chunk's file list.
7. New `design-probe-evolve-same-ranks.mjs` belongs in W1 (it is the R1 check for every later chunk).

Proposed order: **W1a** gated bug slice -> W2 Rally -> W3 Candle Wheel -> W1b wolf speed + W7 Rend/guard reflex -> W4 Orbit guard -> W5 Halo -> W6 Legion -> **R1 retune checkpoint** (hpScale/per-hero, Matt playtest) -> W8a ravens -> W8b mark -> W9 raven evos -> W7b Dire/Pouncing -> W10 Bolts -> W11 Chain -> W12 all-gates pass.

### Smallest safe first slice (W1a), gated content only
| Change | Where | Test / acceptance |
|---|---|---|
| Murder Storm: skip `e.boss`; per-enemy fear key once per 1.5 s via `sim.canHit(e, 'stormFear', 1.5)` | `weapons.js:222` | unit: boss `fearT` stays 0 for 120 s; probe-summons murder_storm boss fear 0%, swarm hitsTaken/s > 0 |
| Dive Bombers claim set (copy `weapons.js:110-113` pattern, fallback to shared when no unclaimed) | `weapons.js:200-209` | unit: with >= 7 enemies in range no two concurrent dives share a target; probe swarm sameTgt 0; evo-dps stream10 stays 1.8-2.8x |
| New probe `scripts/design-probe-evolve-same-ranks.mjs` (read-only) | scripts | prints pair-only and random-rank ratios for all 11; no acceptance yet (baseline) |
| `tests/evo-promises.test.mjs` with the two tests above | tests | `npm test` green |
| Starter balance unchanged | - | `GATES=starter node scripts/g1d-sweep.mjs 96` output **byte-identical** to before (both evolutions are gated) |
Size: ~25 lines of sim code + 2 tests + 1 probe. No art, no text change needed except Murder Storm desc stays true ("sends enemies fleeing" still holds).

## 6. The five decisions (reviewer's answer)
| # | Design rec | Reviewer | Why |
|---|---|---|---|
| 1 Ravens identity | A summon | **A**, with claim fallback for single/boss and a strong visual split from enemy crows | Second real summon, fixes donut and rank-0 (2-4 DPS today). |
| 2 Legion verb | A echo wolves | **A**, but pack x1.2 / echo 0.7x, kill-source tagging in scope, echoes framed as freed light | Specced numbers cap at 1.70x; howl removal is a hidden nerf to sweep. |
| 3 Orbit donut | A guard | **A**, edge-distance trigger, Candle Wheel priority | Local, readable, fixes boss DPS lost to Reach. |
| 4 Halo heal | A (+B stopgap) | **A, no stopgap**; make the text true now | Stopgap stacks to ~2.1 HP/s and is thrown away in W5. |
| 5 Raven mark | A | **A later** (own chunk W8b, after W8a), accept only if team DPS <= +5% swarm and boss TTK <= -8% | Multiplies every source incl. Rally/Blessings; boss permanently marked. |

Missing decisions to add: (6) Rally extension to ravens (locked change, default NO for now); (7) approve "home scenario" reading of 1.8-2.3x; (8) accept a one-time run-1 retune of the locked base difficulty after the batch; (9) echo fiction (any kill vs wolf kills only); (10) Murder Storm must still touch a boss in melee (inner ring) to satisfy R1/R7.

## 7. VERDICT: GO WITH CHANGES
- First slice: **W1a** exactly as in section 5 (Murder Storm boss guard + fear cooldown, Dive claim set, evo-promises tests, same-ranks probe, byte-identical starter sweep).
- Before W2+: fix the numbers in section 1 table 2 in the design doc (Dire 5.4x, Legion 1.2/0.7, Swiftness gap -0.02, Storm inner ring, guard edge trigger), drop the Halo stopgap and speed-boost fix, restrict Rally to wolves, add the R1 retune checkpoint.

Checklist
| Security | Fit |
|---|---|
| Sim-only state (mark, echo, claims); no save fields, keys or ids change (R9) | Every verb tied to the Hollow (freed light, consecrated ground, guarding candles) |
| Tree/card text stays `textContent`; no new deps; no network | Ravens visually distinct from enemy crows (light vs corruption) |
| URL `grant=` debug path already clamps ranks and validates evo ids (`Sim.js:853-859`); new tune keys read from local JSON only | Echo wolves framed as freed light, not crows turning into wolves |
| Each chunk: `npm test`, `npm audit` unchanged (no deps) | Gold only as evolution rim; mark = violet tint, not a new colour |
| Probes are read-only; scratch probes write nothing | Every evolution beats its base at the same ranks, bosses never locked |
