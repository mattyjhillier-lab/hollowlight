# Boss design sheet #7: THE ELDER TREANT (design only, NOT locked, awaiting Matt)

Design only: no game code changed. Research: docs/research/40-boss-fights.md (new). Mock-ups: docs/mockups/boss-treant/ (code-drawn Style v1 over the real build plates, true size at 1280x720, 844x390@2x, 390x844@2x; README there). Built on the locked rows BOSS DIRECTION + BOSS DIRECTION CLARIFIED (2026-10-20), HUSKS BATCH 3 (Treant = The First Husk), DAMAGE + CROWD READABILITY + DR2/DR3/DR4, VISIBILITY ARC + WL6b, AL-6 DAWN CHORUS, DIFFICULTY TIERS (boss HP x1.5 / x2.0), RESULTS SCREEN (victory = gold dawn layout, defeat lantern dims), the status ruleset (bosses immune to fear/pin/shove; take Bleed/Burn/Mark) and the ability principle (bounded, readable, fair).

What Matt asked for (locked direction): the Treant is the LAST PUSH at the very end of the 15-minute run, once the world has gone light; NO timer (beat it or die); it gets its OWN ARENA that appears on screen so you cannot run away but can still kite; its own varied moves (not just "dodge touching it"); VICTORY = the whole screen becomes light and full of life.

## 0. Today's build (what changes)
- `chapters.json` bossAt 600 (10:00); `enemies.json` elder_treant hp 3600 (fixed, no hpScale), speed 18, contact 13, r 26; ONE move: slam (0.9 s tell, r 74, x1.4 dmg, 6.5 s cd) + 3 Root Crawlers per slam; drops heart + magnet + 5 shards; `bossMul 0.5` on the three must-react waves while it lives; victory = surviving to 900 s (`checkEnd`), killing the boss is optional.
- New rule: victory = the Treant dies. Survival to a time no longer wins.

Probe (scripts copied to the scratchpad, game code untouched): a sponge Treant at 13:00 (old rules: full waves alongside), damage dealt to it per second, 24 seeds per cell (16 for the full tree), BLESS on, bot dodge on. Noise is large (n reached 3-11 per cell): treat as order of magnitude only.

| kit | reached 13:00 | boss DPS median (p25-p75) |
|---|---|---|
| Wren starter random / FOCUS | 9/24, 5/24 | 78 (73-98) / 90 (68-100) |
| Elias starter random / FOCUS | 3/24, 5/24 | 134 (96-134) / 118 (108-134) |
| Wren full tree (GATES=all) | 4/16 | 75 (49-75) |
| Elias full tree (GATES=all) | 11/16 | 59 (36-93) |

Reading: (1) a boss that lives on top of full waves kills most runs that reach it (died in the window: 7 of 9 Wren random), so waves must stop or thin; (2) wide-area full-tree kits put LESS damage on the boss than starter kits while waves are up (their damage goes into the crowd): the arena without waves is what lets every build focus the boss; (3) a starter kit does ~80-130 DPS to one big target, so ~6000 HP is about a 60-90 s fight. All numbers re-measured in B7 with the real fight.

## (a) ARRIVAL
| | A (Recommended) THE LAST HOUR | B FULL FIFTEEN | C EARLY ELDER |
|---|---|---|---|
| Arrival | 14:00 (840 s), after the 13:00 "sun at the rim" light | 15:00 (900 s), after the full run | 12:30 (750 s) |
| Waves | ALL regular waves and swarm events stop at the arrival; every living Husk crumbles to ash over 1.5 s (its XP drops as gems, no kill credit/gold, Almanac counts untouched); adds come only from the boss | same as A | waves thin to x0.3 and spawn only outside the arena (they press on the wall) |
| Clock | the run clock HOLDS at 14:00: the moon parks on the dawn line (a brass "held" pill); sim time keeps counting for stats; the dawn arrives only with the kill | holds at 15:00 (moon already on the line: no "almost dawn") | counts on; at 15:00 the moon waits on the line |
| Warning | 13:40 the hush (critters hide, fog thins, music thins: AL-6 hush moved here); 13:55 a soft ground tremor + "Something old wakes" chip; 14:00 the beat below | same, 20 s later | same at 12:10 |
| Run length | ~15:00-16:00 (fight 60-120 s): honest "15-minute run" | ~16:00-17:00 | ~13:30-15:00 |
| Why / risk | the build-up stays 14 min; the fight IS the last minute of dawn; the world is light (13:00-14:00 arc rows) | longest build, but the 14:00-15:00 dawn flood would already have played: the victory flood has nothing left to reveal | more fight time in rising light; Branch-Mane #3 is dropped; the end of the run no longer feels like the end |

ARRIVAL BEAT (A, 3.0 s; frame 04): 0.0 s a red-orange dashed ring tell (r 230) circles the hero, the waves stop, Husks start to crumble, every gem on the map flies to the hero (one free magnet: a last level-up burst before the fight); 0.3-1.5 s roots erupt along the ring in one sweep; 1.0-3.0 s the Treant tears up out of the soil 120 u in front of the hero (spike burst, ground cracks), banner "THE ELDER TREANT WAKES / the oldest mask in the forest" (bark-textured title, 2.0 s); the sim pauses for 1.2 s of the beat (input locked, Calm motion = no shake); the boss bar slides in (locked HUD-3 slide-in) under the held clock; the fight starts at 3.0 s with a 2.0 s grace (no move fires). Sound cues reserved: boss_tremor, boss_wake, boss_roots_rise.

Re-timing (follow-on changes, all visual/data):
- Branch-Mane (EN7, not built): 3:20 / 7:00 / **11:30** (was 12:30; 11:30 = 690 s keeps >= 30 s from the 660 s swarm and leaves 2:30 before the boss; tier 4th Alpha 8:40 unchanged).
- WL6 arc: the 10:00 row loses its "BOSS" label (no other change); while the boss lives the arc HOLDS at its 14:00 values (no further brightening); the 15:00 "dawn" row becomes the VICTORY state (played by the flood, section e).
- AL-6: first light 8:00 unchanged; the hush moves 10:00 -> 13:40-14:00 (pre-boss calm); the dawn flood burst (was 14:02 on the clock) moves into the victory beat; the 14:00-15:00 petals/shafts do not play before the kill.
- Ambient life inside the arena: critters hushed for the whole fight; fireflies off; fog thin.

## (b) ARENA
Real view sizes (camera `zoomFor`, world units): desktop 1280x720 = 533 x 300; phone landscape 844x390 = 620 x 287; phone portrait 390x844 = 250 x 541. Hero speed Elias 76, Wren 106 effective; boss 18 (P1) / 22 (P2) / 26 (P3). Diagrams to scale: frame 03.

| | A (Recommended) ROOT RING | B OLD CLEARING (fixed camera) | C THORN HEDGE (shrinking) |
|---|---|---|---|
| Shape / size | circle r 230 (460 across): ~1.5 desktop views wide | oval 520 x 290: exactly one desktop view | circle r 300 -> 250 at P2 -> 200 at P3 |
| Forms | the Treant's own roots erupt in a ring sweep (0.3-1.5 s), pale bark tips, a few thorns, dark corruption band under them | standing stones/stumps rise out of the ground | a bramble hedge grows in, red-orange thorn tips |
| Edge | HARD wall: hero, adds and boss thorns stop at it; soft push-back, NO damage | hard wall | DAMAGING: 4 + shove back each touch (0.5 s gate) |
| Camera | follows the hero, centre clamped so the view never shows more than 40 u past the wall; zoom -8% for the fight (desktop 580 x 326); amber edge arrow to the boss when it is off view (portrait) | stops following, frames the whole clearing; portrait must zoom out to 0.48x (sprites too small) | follows the hero |
| Kite lap (path r = R - 50) | 1131 u: Elias 14.9 s, Wren 10.7 s | ~1200 u: 15.8 / 11.3 s | 19.8 / 15.7 / 12.4 s (Elias) |
| Boss crosses (24 u/s) | 19 s | 22 s long axis | 25 / 21 / 17 s |
| Low-tier cost | ~110 pooled root sprites High / 70 Med / 36 Low (+ ring stroke) | cheapest | ~130 thorn sprites + edge damage checks |
| Risk | the far wall is often off screen (fine: it cannot be left) | best overview on desktop, fails portrait | punishes joystick slop on phones; second pressure source stacks with the moves |

Size note: research 40 floats ~2 screens wide (OPINION, on the old 640x360 view); r 230 is chosen from the REAL view sizes so the wall and the boss stay within about one view of the hero on every screen, while a kite lap still takes 11-15 s.
Where it forms (A): centre = hero + 60 u toward the boss's rise point, clamped >= 260 u from the world edge; the hero starts 60 u from the centre, the boss 60 u past it.
Outside the ring the Hollow stays grey and still (desaturated, no spawns, no pickups) until the victory flood; inside, the life map works as normal (your light paints the floor while you fight).
Pickups / XP / gems: arrival = one free magnet for every gem on the map; pickups outside the ring are banked as gems/heals at once; inside, adds drop gems and level-ups happen as normal (cards pause the fight as today); each phase change sheds ONE heart (30% heal, locked heart rule) at the boss's feet; boss death drops heart + magnet (kept) + shards. No props inside (no tree trunks to hide behind; root-stub walls from moves are temporary).
Ambient layers: fog x0.5, fireflies off, critters hushed, dawn petals/shafts held for the victory.

## (c) MOVE SET AND PHASES (Take A look; frames 02, 05, 06, 07, 08)
Shared rules (damage-readability-v1 + DR2): every move tells with a POSE first (arms, chest, eyes x1.3 brighter) and a ground decal second; decals red-orange with a dark rim, filling from the centre over the tell; full strength only if the zone will reach the hero (telebudget threatens()), else 28%; at most 2 boss tells live at once (plus the existing 3-token cap for adds); >= 0.6 s between two boss hits landing; every tell >= 0.7 s and long enough for Elias (76 u/s) with a 0.35 s reaction (checked per move below). The boss body never turns red; eyes stay amber (#ffb84a, baked socket + socket-shaped glow). Boss damage is FIXED (no dmgScale, like its HP): light 6, mid 10, heavy 15, contact 8 (Wren 60 HP: 10 / 17 / 25 %; Elias 150 HP: 4 / 7 / 10 %).

| # | Move | Phases | Tell (pose + decal) | Shape / size | Dmg | Counter-play | Elias escape check |
|---|---|---|---|---|---|---|---|
| 1 | BARK SLAM | P1+ (only if hero within 110) | arms rise 1.2 s (all phases) | disc r 74 at the feet | heavy | step out; P3 leaves 4 root spikes 4 s (small walls) | hero pushed out of the trunk (min 32 u); worst 80 - 32 + 6 = 54 u = 0.71 + 0.35 = 1.06 < 1.2 |
| 2 | ROOT ERUPTION | P1 3 / P2 4 / P3 5 circles | eyes flare + roots ripple 1.0 s | circles r 26: one on the hero's spot, the rest 40-90 u around | mid | keep moving; only the circle that will catch you is bright | 26 + 6 = 32 u = 0.42 + 0.35 = 0.77 < 1.0 |
| 3 | SEED TOSS | P1 (P2 x2 pods) | chest opens 0.6 s, pods arc (landing ring 1.1 s, harmless) | 3 pods; a pod not killed in 3 s becomes a SAPLING HUSK (hp 30, speed 40, contact 6, cap 8 live) | adds | kill pods (spirits auto-target them; they count as enemies) | n/a |
| 4 | VINE SWEEP | P2+ (if hero within 160) | one arm swings back 1.2 s | cone 90 deg, r 130, aimed at the hero at tell start | heavy | sidestep ~45-55 u or get behind/out of reach | worst (d ~76) 54 + 6 = 60 u = 0.79 + 0.35 = 1.14 < 1.2 |
| 5 | THORN VOLLEY / NOVA | P2 fan 5; P3 nova (fan 7 on Long Night) | chest flares cold 0.7 s (fan, aim ticks) / 1.0 s (nova) | fan 5 thorns 0.2 rad apart, speed 120, life to the wall; nova ring of 14 with 4 wide gaps | light (max 1 thorn hit per 0.5 s) | strafe; stand in a gap; go far (gaps widen with distance) | thorns visible in flight, Piper rules |
| 6 | ROOT LANES | P3 (2 lanes, then 3) | ground cracks along the lane 1.2 s | lanes 22 wide across the whole ring; roots stay up 3 s as SLOWING brush (x0.65, passable, never solid) | mid | step out of the lane; walls split the arena briefly | 11 + 6 = 17 u = 0.22 + 0.35 < 1.2 |

Phases (by boss HP; a phase change = 1.0 s stagger: immune, no damage, a crack of cold light through the bark, ONE heart, the arena shudders; no heal, no reset):
- P1 AWAKENING 100-66% (grey crown with a few memory-green leaves; groaning sway): slam, eruption 3, seed toss. Move gap 3.2 s. Speed 18.
- P2 BLIGHT 66-33% (cold violet veins in the bark, crown thins, face crack widens): + vine sweep + thorn fan; seed toss doubles its pods; eruption 4. HUSK CALL on entry: 6 Fell Wolves run in from the root wall. Gap 2.8 s. Speed 22.
- P3 WRATH 33-0% (bare branches, chest glows cold white: the read for "nearly there"): + root lanes + thorn nova; slam leaves spikes; eruption 5. HUSK CALL on entry: 4 Fell Wolves + 2 Puffback Toads. Gap 2.4 s. Speed 26.
- Move picker: weighted by phase, no same move twice in a row (except eruption), range-gated (slam <= 110, sweep <= 160); deterministic sim RNG only.

Per-hero fairness: Elias (76 u/s, 150 HP, Candle Wheel r 80 heals 1.5 HP/s inside): every tell passes the escape check at 76 u/s; the Wheel invites standing near the boss, which the slam punishes = a real choice (not a trap: slam needs the hero within 110 and tells 1.1 s). Wren (106 u/s, 60 HP, wolves): dodges easily, dies to two heavies, so heavy = 25% of her HP max; her wolves bite the boss whatever the adds do, but Rally the Pack (LOCKED: pins the toughest NON-boss) will go to saplings/called wolves while they live: measured in B7 (weak spot W3, no lock change proposed now). Ravens/bolts/lightning/orbit: all hit a big slow target; Mark/Bleed/Burn apply; fear/pin/shove never (locked).
How it differs from the miniboss (Branch-Mane): the miniboss is a CHASER inside the normal run (howl + 0.7 s line charge, no arena); the Treant is a slow PLANTED caster that controls GROUND (circles, cones, lanes, rings) inside its own arena and makes its own adds. No charge, no lunge.

### Independent review (fresh agent, 2026-10-20) and the fixes taken into this sheet
1. Determinism gate: B0 vs today = identical to 599 s only (today's boss spawns at 600 and draws RNG); later chunks vs B0 to 839 s. FIXED in (h) and B0.
2-3. Slam / sweep escape math ignored hero radius and the hero standing under the trunk: hero/boss push-out (min 32 u) added, both tells now 1.2 s; every escape row includes p.r 6. FIXED above.
4. Adds scale HP/damage by run minutes and time keeps counting: a hidden ramp. FIX: spawns after arrival use a frozen `scaleMinutes` = 14.
5. Boss damage today = 13 x dmgScale x tier.enemyDmg; 'fixed damage' changes locked tier behaviour (tiers row: dmg x1.15/x1.3 not boss-exempt). Listed as a LOCK TOUCH-POINT for Matt (default: tier dmg applies to the fixed numbers too, so the tiers row is not changed).
6. Adds would give endless hearts/heal cards (no timer = farm). FIX: boss-made adds have `noDrops` (gems only, no hearts/magnets), the heal-card swap is off while the boss lives, add XP capped per fight (40 gems).
7. Candle Wheel kiting cheese (boss walks through the ring, hero holds 110-160 u). FIX: eruption/lanes weight targets inside a planted Wheel x2; bot case 'wheel between hero and boss' reported in B7.
8-9. Spawn/recycle code would put adds outside the ring; summons could chase past the wall. FIX: `arenaPoint()` for calls/pods (at r - 20 near the wall), arena clamp applied AFTER separation, recycle off during the fight, targets outside r - 10 excluded from summon targeting.
10. Level-up pause mid-tell. FIX: level-up offers wait until no boss tell is live (max 3 s), arrival magnet cards fall inside the 2 s grace.
11. Phone portrait loses the boss at the kite band. FIX: portrait fight zoom to ~300 u wide (was -8% only) + the amber boss arrow; bot kite band 100-140 u; dodge measured with the portrait view.
12. P3 trap risk (lanes + spikes + crossing lanes). FIX: lane roots and slam spikes are slowing brush, never solid; Long Night crossing lanes always leave a >= 40 u gap.
13. HUD/results/AL-6 read sim.time / runSeconds. FIX: `sim.clock` (held display clock) used by hud moon, RunScene arc/AL-6, resultscopy (new 'fell in the fight' copy, tests at t 890/930).
14. B0 must also: remove the 900 s victory in checkEnd, remove slam crawler spawns, make the 1.2 s arrival pause a SIM state ('bossIntro') so headless sweeps match, keep shards as the chapter counter.
15. Probe n too small for the HP pick; 'adds <= 30% of damage' needs counters. FIX: `bossDmgBy` counter in B0 (counters only), B7 uses 840 s state snapshots replayed N times per seed to cut noise. Wren speed is 105.6 (not 106).

## (d) PRESSURE without a timer
| | A (Recommended) THE FOREST LEANS IN | B CLOSING ROOTS | C ENRAGE |
|---|---|---|---|
| Rule | each 30 s of fight time the move gap shrinks 6% (floor 70% of the phase gap), the sapling cap +2 (max 14), slam/lane spikes linger +1 s (max 6 s); phases still drive the big steps | after P3 starts the wall creeps in 1 u/s from r 230 to a floor of r 160 | at 150 s of fight: boss damage x1.5 and gap x0.7 for the rest |
| Feel | slowly busier, never sudden; the player reads it as the forest waking | a visible squeeze | a cliff |
| Bot-measurable | escalation index = gap(t); deaths by fight time | ring radius(t) | death spike at 150 s |
| Risk | slow builds take longer and harder fights (intended pressure, capped) | stacks with lanes in P3: crowding on phones | a hidden timer by another name (research: avoid) |
Safety valves in every option: tells never get shorter, damage never ramps (A), hearts at phase changes on every tier, no boss healing.

## (e) VICTORY BEAT (frames 09, 10)
| | A (Recommended) RADIAL FROM THE BOSS | B SWEEP FROM THE HERO | C WHITEOUT TO COLOUR |
|---|---|---|---|
| Story | the life the Treant held runs out of it into the ground (BIBLE: colour runs down its trunk; enemies are victims) | your light wins and spreads | the sun crests: everything at once |
| Read | the boss is the centre of the moment | hero-centred, simplest on phones | biggest single hit |
| Risk | the boss may be at the edge of the view (flood still covers the view in ~1.5 s) | loses the "freed tree" story | a white flash breaks the arc "no flashes" rule; Calm must remove it |
Timeline A (sim stops at the killing blow; any key after 1.5 s skips to results; Calm motion = no shake, no slow-mo, the flood is a 1.0 s fade):
- 0.0 s killing blow: 120 ms hit-stop, a soft white tick (0.18), every add crumbles to ash; music cuts to one held note (cue boss_fall).
- 0.0-1.2 s slow-mo 0.3x on the boss only: it kneels, the face crack runs through.
- 1.2-1.8 s the First Husk mask cracks and FALLS OFF (the Husk death rule at boss scale; cue mask_crack); living heartwood underneath with a quiet resting face.
- 1.8-2.6 s one green leaf grows from the chest; colour (green-gold rivulets) runs down the trunk into the ground; the root ring sinks.
- 2.6-4.6 s FLOOD: restored life spreads from the trunk at ~420 u/s across the view and on beyond it (the whole map's life map is set restored, render only): saturation returns, flowers pop, grass tufts sway, the outside-grey lifts, dawn wash rises to the 15:00 arc row (gold allowed: the dawn sun), the AL-6 victory flush pulse and an EXPANDED flock (birds burst from the ring edge, cap 12/8/4), petals, 3 light shafts; critters come out (cue dawn_flood = dawn_chorus_3).
- 4.6-6.0 s free movement is NOT given (no input during the beat; the hero turns toward the tree, the pup sits); the hero's text bark (locked: 3-6 words, e.g. Wren "We made it, pup.", Elias "Rest now, old friend.").
- 6.0 s the results slide in: the locked gold dawn layout (results sheet R1-R4; this beat IS the parked R5 in-world beat); shards 5/7/10 by tier, Dawnglass per the tier economy; the boss bar's last frame shows "The Elder Treant rests".
- Take C (Lantern-Keeper) adds: its six dead lanterns relight one by one at 2.6-4.0 s.

## (f) DEFEAT at the boss (frame 11)
Locked beat unchanged: quiet grey 2 s, the lantern DIMS (not out), then the results card with the big Again button. DR4 recap line: "Struck down by the Elder Treant's Vine Sweep, 1:21 into the fight" (the boss clock is held, so the fight time is the useful number; total run time stays on the card). New attacker kinds for DR4: slam, sweep, roots (eruption), lanes, thorn, nova, contact; adds keep their own names ("a Sapling Husk"). One extra line when the boss was hit at all: "The Elder Treant was at 18% (Wrath)" (progress = hope; one-screen fit order puts it right after the struck-down line, dropped before the weapon bars on phone landscape).

## (g) TIERS
| | A (Recommended) ONE NEW RULE PER TIER | B NUMBERS ONLY | C A FOURTH PHASE |
|---|---|---|---|
| Deep Dusk | HP x1.5 (9,000) + "Thorned": thorn fan from P1, nova gaps 4 -> 3 | HP x1.5, dmg x1.15, gap x0.9 | HP x1.5 |
| Long Night | HP x2.0 (12,000) + "Old Growth": P3 lanes cross (one lane perpendicular), saplings carry the Ironbark mark, fan 7 | HP x2.0, dmg x1.3, gap x0.8 | HP x2.0 + P4 HEARTWOOD at 15%: the mask falls early, nova + lanes together, arena -20% |
| Kept on every tier | tells never shorter, hearts at phase changes, no healing, Hollow marks never on the boss (locked) | same | same |
Research (Hades Extreme Measures, Dead Cells BC): adding a readable move per rank beats raw HP; damage multipliers on the boss are already in tiers.json (enemyDmg is not applied to the fixed boss numbers unless B is picked).

## (h) BALANCE, MEASUREMENT, SIM, GATES, RISKS
Targets (proposed; any change to a LOCKED target needs Matt):
- Twilight no-tree starter random win stays 15-30% (LOCKED). It is now P(reach 14:00) x P(beat | reach): aim P(beat | reach) 60-75% starter, 85-95% full tree.
- Fight length median 75-100 s (starter that reaches it), 45-70 s (full tree), p90 <= 150 s.
- Boss share of all defeats 20-35% (starter); deaths still spread 6-14 min plus the fight window; no deaths before ~5:00 unchanged.
- Damage share inside the fight: adds take <= 30% of the kit's damage (otherwise the adds are a sponge: research note on absorbing orbs).
- Wren vs Elias P(beat | reach) gap <= 10 pts.
Starting numbers (Twilight): HP 6,000 fixed (was 3,600; probe: starter 80-130 DPS on one big target -> 60-75 s pure DPS time, ~75-95 s with dodging and adds); contact 8; light/mid/heavy 6/10/15; speed 18/22/26; gaps 3.2/2.8/2.4 s; sapling hp 30.
Bot dodge model (extends scripts/bot.mjs dodgeVec, DODGE=0 still reports the no-dodge baseline): the sim exposes live boss tells (`sim.bossTells`: kind, shape, centre/aim, t0, tEnd); the bot notices a tell 0.35 s after it starts (human reaction), then steers to the nearest safe point (12 directions x 2 distances, first point outside every live zone and inside the ring) with 100% weight until clear; between tells it kites at 120-170 u from the boss (outside slam reach), collecting gems inside 60 u of its path. Report P(beat | reach) with dodge ON and OFF; ON is the target, OFF shows how much the dodging carries.
Sim changes needed (all data-driven, deterministic, sim RNG only, `src/sim` stays Phaser-free):
- `src/sim/boss.js` (new, pure): state machine idle -> tell(move) -> act -> recover; phase table and move table from `enemies.json` elder_treant.`boss` block (phases [{hpAt, gap, speed, moves:{id:{w, tell, r, dmg, ...}}, call:[...]}], arena {r, wallPush}, pressure {every, gapMul, floor, capAdd}); tells published as plain objects for the renderer + bot; no allocation per frame.
- `Sim.js`: `chapter.bossAt` 840; `arena` state {cx, cy, r, formed} + clamp for player, adds and boss projectiles (summons follow the hero, unclamped); `spawnHalt` flag (waves + events stop at arrival); crumble list (gems only); free magnet; `checkEnd` -> victory only when `bossKilled`; the timer held for display (`clockHeld = 840`), `time` keeps counting; new enemy id `treant_sapling` (enemies.json, Husk art); `hurt` kinds for DR4.
- RNG: the boss consumes the sim RNG only after 840 s. Gates: B0 vs today's build = byte-identical up to t=599 (today's boss spawns at 600 and draws RNG, slams spawn crawlers and bossMul halves three waves, so 600-839 legitimately differ: the 10:00-14:00 stretch gets harder without the boss, measured in B0); every later chunk vs B0 = byte-identical up to t=839.
Perf / visibility gates: boss = live part rig on Med/High (<= 14 parts + 2 eye glows; Low = one flat baked sprite + eyes), root ring pooled (110 / 70 / 36), boss decals <= 8 live; fight frame work +<= 0.5 ms High / +0.3 Med / +0.2 Low vs a 14:00 crowd frame (scripts/pace.mjs); WL6 contrast harness at 14:00 light (boss always lit; decals above the vignette; G1-G8); DR2 red-orange share near the hero <= 4% desktop at a staged P3 frame except during a live full-strength tell.
Acceptance (whole feature): tests green; sweeps byte-identical to B0 up to 840 s; targets above within noise at 96 seeds per cell (both heroes, random + FOCUS, starter / half / full, three tiers); screenshots at the three sizes; security (no new deps, data validated, no DOM from data); fit check; Matt playtest.
Risks: (R1) "beat it or die" makes the run end on a loss more often: the 15-30% band must be held by tuning HP, not by softening the moves; (R2) Rally pins adds not the boss (Wren weaker in the fight); (R3) phone portrait: 250 u wide view, far wall/boss off screen half the time (edge arrow + -8% zoom); (R4) the arena forms where the hero stands: near a world-edge wall it is shifted (clamp) so the ring may start partly behind the hero: tested on all four edges; (R5) level-up cards mid-fight interrupt flow (kept: same as today, and gives a reason to collect add gems); (R6) perf of the root ring + part rig + decals on a low phone; (R7) adds as damage sponges for AoE builds (gate: adds <= 30% of damage).

## Art (frames 01, 02; Style v1, The First Husk)
| | A (Recommended) THE FIRST HUSK, ELDER | B THE BOWED ANCIENT | C THE LANTERN-KEEPER |
|---|---|---|---|
| Look | tall grey elder, the biggest oldest bark mask grown on with root straps, knot-hole sockets with amber glow pooled low (baked socket + socket-shaped glow), branch arms, a cold split chest, a heavy grey crown with a few memory-green leaves | shorter, wider, bent forward; bigger lower mask (more chibi); long arms that drag on the ground ending in root claws; a hunched back of dead branches and moss | Take A + six cold UNLIT glass lanterns of lost Hollowlighters hanging in its branches; they relight at the victory |
| Phase story | crown full -> thin + veins -> bare + glowing chest | moss back thins; claws crack | as A; lanterns flicker cold in P3 |
| Reads | THE tree from across the arena; arms up/back = the slam/sweep tells | arms = the threat read | most story; best payoff |
| Risk | the quietest silhouette; the moves must bring the drama | less "tree", hides the crown that carries the phases | busiest; lanterns on an enemy blur "warm = ours" until they relight |
True size: ~85 u tall, ~200 px on desktop (2/3 of the 300 u view height), ~110 px on phone landscape; hitbox r 26 (unchanged). Death: kneel, mask falls off (Husk rule), heartwood face at rest, green leaf from the chest (BIBLE). Saplings: tiny stump Husks with a side bark mask and ONE red-orange eye in a socket (an ordinary foe; never amber).

## Fit check
Look: The First Husk at boss scale (Husks family: grown bark, knot sockets, root straps; amber eyes only on the boss; red-orange only on decals; gold only in the dawn sun of the victory); the arena is the Treant's own roots; the victory is the IDENTITY dawn (colour = life) at full scale. Mechanics: a planted ground-control caster is a new verb in the roster (not a bigger chaser), bounded by the shared telegraph rules, fixed damage, capped adds and a capped pressure ramp; consistent with the locked status ruleset (no control on the boss) and tiers. Lock conflicts: REOPENS (already reopened by Matt) 'boss at 10:00'; touches WL6 'boss at 10:00 in first grey light' (label only + hold while the boss lives), AL-6 hush/flood timing, enemies-v1 Branch-Mane #3 12:30 -> 11:30, the RESULTS R5 'in-world beat later' (this is it), the HUD-3 boss bar (reused). None of these are changed until Matt approves.

## BUILD PLAN (small chunks; each = tests + sweeps + screenshots + security + fit; each needs the lock first)
| Chunk | What | Acceptance gate |
|---|---|---|
| B0 | Sim scaffolding: bossAt 840, victory only on kill (900 s rule removed), 'bossIntro' sim state, spawn halt + crumble + free magnet, arena state + clamp after separation + arenaPoint, frozen scaleMinutes, sim.clock held + HUD/results/AL-6 switched to it, slam crawler spawns removed, bossDmgBy counter (old slam only) | every seed byte-identical to today up to t=599 (state hash; 600-839 differ by design: no boss at 10:00); tests for clamp/halt/victory; win% and deaths 10:00-14:00 printed (not tuned yet) |
| B1 | boss.js state machine + P1 moves (slam, eruption, seed toss + treant_sapling) + `bossTells` + bot dodge for them | determinism test (same seed = same moves); escape-check tests at 76 u/s; dodge ON/OFF numbers |
| B2 | P2 + P3 moves (sweep, thorns/nova, lanes), phase staggers + hearts + Husk Calls, pressure option | per-move tests; P(beat | reach), fight length, boss death share reported |
| B3 | Render: Treant part rig (picked take) with phases, tell poses, socket eyes, death; Low flat sprite | true-size shots at 3 sizes; WL6 contrast at 14:00; perf |
| B4 | Render: root ring forming, outside grey, camera clamp + -8% zoom, boss edge arrow, decals via telebudget, boss bar + held clock | DR2 red-orange metric; frames at 3 sizes; perf |
| B5 | Victory beat (flood, leaf, birds, AL-6 re-timing, bark) + defeat recap kinds + progress line | Calm motion variant; results fit test on all sizes; skip after 1.5 s |
| B6 | Tiers (picked option) + rewards hooks | tier sweeps |
| B7 | Balance pass (HP, damage, gaps) to the targets; Matt decides anything moving a locked target | 96 seeds x heroes x random/FOCUS x starter/half/full x tiers |
| B8 | Verify: perf on low tier, real phone, screenshots, security review | all gates |
Also (data only, with EN7): Branch-Mane #3 11:30.

## DECISIONS FOR MATT (first batch, max 3; recommended first)
1. WHEN does the Treant come and what happens to the clock? A 14:00, waves stop, the clock holds at 14:00 until you win (Recommended) / B 15:00 after the full run / C 12:30 with thinned waves.
2. WHICH ARENA? A Root Ring r 230, hard wall, camera follows (Recommended) / B fixed-camera clearing / C shrinking damaging thorn hedge.
3. WHICH LOOK? A The First Husk, Elder (Recommended) / B The Bowed Ancient / C The Lantern-Keeper.
Next batch after these: move set confirm (the six moves + phases as above), pressure (A/B/C), victory beat (A/B/C); then tiers (A/B/C). Defaults taken (Matt may override): fixed boss damage 6/10/15, HP 6,000 start, one heart per phase change, recap 'N into the fight', Branch-Mane #3 at 11:30.

## Weak spots (honest)
- W1 Balance numbers are a rough probe (3-11 runs reached per cell, old rules with waves); the real fight is only measurable after B1-B2.
- W2 The win rate WILL drop when victory needs the kill; holding 15-30% depends on HP tuning (B7).
- W3 Rally the Pack targets adds, not the boss (locked rule): Wren may be weaker in the fight; measured in B7, a change would need Matt.
- W4 Mock-ups are static; the victory frames tint the whole plate (HUD included) because the plate cannot separate ground from sprites: the real flood works on the ground/life map only and will look cleaner and more colourful; phone portrait uses a painted ground (no portrait plate) at 1.3 px/u (real zoom 1.56).
- W5 Boss art is at hero-sheet bar for the face/eyes; the trunk texture and arms are simpler than Wren/Elias; refine in B3 like the Husk art pass.
- W7 The independent review's 15 findings are folded in above; none needed Matt except finding 5 (tier damage on the boss: default keeps the tiers row).
- W6 Research coverage was thin on some official sources (several wiki pages blocked); unverified items are listed in research 40 section 9.
