# Damage readability + crowd readability v1 (design sheet, NOT locked)

Date 2026-10-20. Source: Matt's playtest (Wren, built game): "there are points where it becomes quite hard to actually see what is going on... sometimes it felt like I was getting hit but I couldn't understand where from or even see that I was getting hit", and "I like the fact loads of enemies are on screen at one time but there must be a way to visually make this easier to see."

Goal: the player always understands (a) THAT they were hit, (b) WHERE from and WHAT hit them, (c) how much health is left, without clutter, and the big swarms stay big but legible. Design only: no game code, no LOCKED edits. Mock-ups: `docs/mockups/damage-readability/` (README there).

Status: LOCKED 2026-10-20 (all option A, see docs/LOCKED.md 'DAMAGE + CROWD READABILITY'); BUILD in progress as chunks DR1 (hit feedback + direction), DR2 (enemy warnings), DR3 (crowd readability), DR4 (death recap): see the BUILT rows in LOCKED.md. (Original status: RESEARCH + DESIGN done; REVIEW and Matt's four decisions pending.) Measured on 59c0062; the wolf AI changed right after (c2be534 spread rule + hero leash), so the wolf share and crowding numbers should be re-run with `scripts/dr-hitprobe.mjs` before DR1 (render findings unaffected).

---

## 1. What exists today (read from the code, HEAD 59c0062)

| Cue | Today | Where |
|---|---|---|
| Hero flash | white fill 0.06 s, then red fill `0xff7a6a` until 0.25 s; soft squash 12% + lean -9 deg back over 0.25 s; ember dims | `rigmath.hurtFx`, `herorig.js`, `eliasrig.js` |
| I-frames | 0.4 s (`balance.playerIframes`); hero swaps rig <-> flat sprite at 24 Hz (12 flashes/s), also under Calm motion | `herorig.js:143`, `RunScene.js:860` |
| Taken number | light red `0xff8078` '-N' at hero +24/-16 world units; outranks enemy numbers in the pool but sits inside the enemy number cloud | `numpool.js`, `RunScene.feedback` |
| Screen | HUD `.hurtflash` inset edge glow `rgba(217,83,79,.6)` (danger red, not the light red of the 'taken' rule), 0.35 s fade; **skipped entirely under Calm motion**; camera shake 90 ms / 0.004 (Settings: Screen shake) | `app.js:159`, `hud.css:76` |
| HUD | lantern flame + 'NN / 60'; low-HP frost edge (30% -> 10%) | `hud.js` |
| Crowd | when 3+ enemies crowd the hero a cream silhouette fades in to alpha 0.7 above everyone | `RunScene.js:1128` |
| Sound | none yet | |
| Source info | none on screen; sim counts `hurtBy` (counter only) | `Sim.damagePlayer` |
| Tells | Fell Wolf lunge: OLD style solid red line 55 u + red triangle above the head (pre-Husk code); Piper dashed aim tick + ring; Toad filled fuse ring; Hart dashed charge band + arrow; boss slam disc. All red-orange, all above the vignette | `RunScene.js:1105-1114`, `enemytells.js` |

Hit rules: contact = the strongest overlapping enemy lands one hit per 0.4 s; hero radius 6 u, wolf contact radius 6 + 5.1 = 11 u, but a Husk wolf is drawn ~26 u long (52 px at 720p). Enemies are y-sorted with the hero (`D_LIT + y`), so anything standing just south of Wren is drawn over her.

## 2. Measured (sim, damage-taken by source)

Probe: `playRun` with a wrapper on `Sim.damagePlayer` (scratch script, clean export of HEAD, starter gates, Blessings on, dodge model ON, random picks). 48 seeds per hero (+16 extra seeds per hero for attacker state and 16 with DODGE=0). Noise: shares +-3 points between the 48 and 16-seed sets.

**Share of damage taken by source (48 seeds, dodge ON)**

| Hero | Fell Wolf | Grave Crow | Root Crawler | Bramble Hart | Treant slam | Thorn | Toad burst |
|---|---|---|---|---|---|---|---|
| Wren (2/48 wins) | 56.4% | 20.7% | 17.1% | 3.0% | 2.4% | 0.4% | 0 |
| Elias (8/48 wins) | 43.5% | 34.4% | 16.8% | 3.5% | 1.4% | 0.5% | 0 |
| Wren, DODGE=0 (16) | 41.5% | 15.0% | 8.5% | 5.0% | 1.1% | **28.9%** | 0 |
| Elias, DODGE=0 (16) | 35.2% | 29.3% | 13.4% | 7.2% | 1.9% | **12.8%** | 0.3% |

**By time (Wren / Elias, dodge ON)**

| Window | Hits | Top sources | Mean hit | Crowd within 80 u (median) |
|---|---|---|---|---|
| 0:00-1:30 (dark) | 43 / 198 | wolf 81% / wolf 52% crow 47% | 4.8 / 4.0 | 3 / 4 |
| 1:30-3:30 (dark) | 302 / 568 | wolf 64% crow 21% crawler 15% | 5.4 / 4.7 | 4 / 6 |
| 3:30-6:30 (4:00 swarm, piper, toad) | 440 / 1048 | wolf 51%, crow 29%, crawler 20% | 6.0 / 5.5 | 5 / 6 |
| 6:30-9:30 (hart) | 185 / 400 | wolf 65% / 51%, hart 3-7% | 7.4 / 7.1 | 5 / 5 |
| 9:30+ (boss, dawn) | 176 / 292 | wolf 48-57%, slam 7-10%, hart 9-10% | 10.1 / 10.1 | 4 / 4 |

Swarm windows (25 s after each swarm event): 34-35% of all hits and of all damage.

**The 'invisible hit' cases, with numbers**

1. **Lunging wolves**: 51% (Wren) / 46% (Elias) of wolf hits land DURING the lunge (3.2x speed, 147 u/s for 0.6 s after a 0.55 s tell) = about a quarter of ALL damage taken. The lunge starts inside 130 u, which is exactly the lantern radius in the dark (130): the tell happens at the pool edge.
2. **Which one hit me**: at the moment of a hit, 56-59% of hits have 2+ enemies within 40 u (about one wolf length) and 20-26% have 3+; median 5-6 within 80 u, p90 9-10. Only one of them dealt the damage (11 u contact vs 26 u sprites), and it is usually under or behind the hero's body.
3. **Hero buried**: in the staged real-build frames the hero sprite is overlapped by 4-8 enemy sprites drawn ABOVE her at 6:20 and 20-26 at an 11:30 swarm of 350 (`occluders` metric).
4. **Hit at the same moment as other numbers**: 19-23% of hits land with 5+ weapon hits (numbers) within 80 u in the same 0.4 s.
5. **Red everywhere near the hero**: at the 11:30 swarm 17-30 tells are live at once (most of them wolf lunge lines converging on the hero) and 10-14% of the pixels within 0.2 x screen-height of the hero are tell red-orange. The hero's own hurt tint `0xff7a6a` is the same hue as the LOCKED bleed body tint `0xff8a82` that Wren's wolves put on most enemies around her, so her red flash disappears into a ring of red-tinted bleeding enemies; the HUD flash is a third, darker red.
6. **Slow continuous drain**: Elias takes 36% of his hits within 0.6 s of the previous one (i-frame cadence); feedback repeats every 0.4 s and blurs into one long flicker. Wren takes fewer, bigger hits (median gap 9.7 s, mean hit 11% of her 60 HP; Root Crawler hits are 17-22% of her HP each: 113 of her 181 hits over 15% max HP).
7. **Deaths**: final blow wolf 39% / crow 33% / crawler 24% (Wren); crow 50% / crawler 25% / wolf 23% (Elias). Median death 6.1-6.5 min. Median share of max HP lost in the last 5 s: 17% (Wren) / 8% (Elias): deaths are a slow bleed, so 'what killed me' is really 'what has been chipping me' (supports a by-source recap, not only a final-blow line).
8. **Thorns**: rare with the dodge bot (0.4-0.5%), 13-29% without dodging; a human sits between. Origin offscreen: 1 of 4 (Wren) / 1 of 8 (Elias); the shooter had moved or died in 2 of 4 / 2 of 8 (orphan thorn). The thorn is r 3 u (6 px at 720p), dark with an ember core: hard to pick out over a pile of enemies.
9. **Dark opening (0:00-3:00)**: 13-15% of damage. Eyes are above the vignette, tells too, so the attacker is visible as eyes + a tell, but the BODY lights only inside 130 u.
10. **Slam**: brown ring `#7a4a1b` for 0.3 s, low contrast; the tell disc is fine. 2-10% late.
11. **Offscreen attackers**: contact attackers cannot be offscreen; tells only start inside the view (F2 rule works). Only thorns can arrive from outside (rare, above).
12. **Props/foliage**: not measured as a cause; enemies sort with the hero, props do not cover hits in the frames captured.

## 3. Real-build frames (before)

`docs/mockups/damage-readability/before/` (real build, own headless Chrome, staged like `scripts/pace.mjs`, sim frozen on the hit, 30 / 120 / 300 ms after it):
- `m1-dark-0m40-*`: first wolves in the dark: wolf lunge lines and triangles converge on the hero; '-5' sits among '13' weapon numbers.
- `m2-swarm-4m00-*` (thorn hit): the hero is under a pile of wolves; toad fuse discs cover her; '-6' sits next to blood-red bleed '1's; the piper's dashed aim line is visible but nothing links the hit to it.
- `m3-hart-6m20-*` (charge hit, -17 = 29% of Wren's HP): the hart that hit is BEHIND the hero and bleed-tinted red; '-17' is partly behind a big gold '27'; HUD edge glow barely visible.
- `m4-crowd-11m30-*` (350 enemies): about 27 tells live, three toad discs over the hero, hero invisible, low-HP veil; this is the frame Matt describes.
- `m5-elias-11m30-desk-crowd`: Elias in the same crowd.

## 4. Diagnosis: top causes, in order

1. **The hero is not drawn as the most important thing on screen** (buried by y-sort under 4-26 enemies; the cream silhouette at 0.7 is too faint; toad discs and lunge lines are drawn above her).
2. **One red for everything**: tells (red-orange), bleed body tint and bleed numbers (blood red), hurt flash (salmon red) and HUD flash (danger red) are all reds in the same place; the hurt cue has no colour, shape or position of its own.
3. **Tell flooding**: every wolf (the main source) shows a long line + floating triangle, whether or not it threatens you; at 4:00 15-18 tells, at 11:30 17-30 converge on the hero, so the real threat is not singled out. Wolf tells use the old style, not the EN3-EN5 grammar.
4. **No source information**: nothing shows WHICH of the 2-6 nearby enemies hit you or from where (hitbox 11 u vs sprite 26 u; attacker hidden under the hero).
5. **The hurt number is in the crowd of weapon numbers** (same spot as bites; 19-23% of hits land with 5+ numbers nearby) and the HUD flash is off under Calm motion.
6. **Fast wolf lunges** (a quarter of damage) start right at the lantern edge in the dark.
7. Minor: thorn too small/dark over crowds; slam ring low contrast; i-frame flicker at 12 Hz (photosensitivity rule elsewhere in the game is <= 3 crossings/s).

## 5. Options (three per area, A recommended)

Colour rules respected throughout: red-orange `#ff5a3c` only for enemy eyes and tells (enemies are cold, threats warm-red), light red `#ff8078` for damage TAKEN, warm cream/amber = friendly/hero, gold only for evolution. No new colour family is needed. Every cue has a shape cue too (colour-blind safe), and a Calm motion variant.

### (i) Hit feedback on the hero

| | A. Hurt rim + lantern flinch (RECOMMENDED) | B. Ground ring + white silhouette | C. HUD-led |
|---|---|---|---|
| Look | the hero's own outline (existing `hero_*_o` silhouette) flashes LIGHT RED above everything for 0.25 s (replaces the salmon body fill; first 0.06 s white kept); soft squash kept (no head jolt); HUD lantern plate rims light red and the flame gutters (dips 20% and recovers in 0.3 s); the '-N' goes ABOVE the head on a small dark plate, 1.25x size, its own lane (enemy numbers within 24 u hidden for 0.4 s) | white silhouette flash above the crowd + a light-red ellipse ring at her feet expanding 0.25 s; HUD edge glow (light red, thin) | world nearly unchanged; thin light-red screen-edge pulse; HUD lantern glows and shakes 2 px; a 'lost chunk' of the HP bar drains over 0.4 s; '-N' next to the lantern |
| Readability | strongest at the hero, works when buried (outline is above the crowd) | strong, but the ring overlaps toad discs (same shape language as area tells) | weak in the world: eyes stay on the hero, the cue is in a corner (fighting-game style) |
| Build | S (outline image exists; tint swap; number lane; CSS flinch) | S | S-M (HUD bar ghost) |
| Perf | 1 image + 1 plate: ~0 all tiers | 1 image + Graphics ellipse: ~0 | DOM only |
| Accessibility | shape = outline + flame dip + number position; Calm: no squash/flinch movement, outline + number stay | Calm: static ring | Calm: no shake |
| Fit | warm lantern = your life; light red stays 'taken' | ring reads like an enemy area tell (risk) | fine, but not where the player looks |

### (ii) Direction / source

| | A. Attacker flare + contact crescent (RECOMMENDED) | B. Compass arc with source badge | C. Source-tagged number |
|---|---|---|---|
| Look | the enemy that hit is lifted above the crowd for 0.3 s with a dark rim + light-red outline; a short light-red crescent (120 deg arc, r 25 u) on the hero's side facing it; thorn hits: the crescent points along the thorn path, and if the shooter is offscreen a small chevron on the screen edge | a ring arc at 58 u around the hero pointing to the source with an arrow head and a small badge showing the attacker's sprite | the '-N' carries a mini sprite of the attacker and slides away from it, with a hairline back to it |
| Readability | answers 'which one' and 'from where' at the hero, 0.3 s | answers 'from where' + 'what' clearly; a second ring around the hero (busy with orbs/ravens) | 'what' is clear; 'where' only by number drift |
| Build | M (attacker id from the sim hit: needs a 1-field event payload `ev.src/ev.id`, counters only, sims stay byte-identical) | M | S-M |
| Perf | 2 images + 1 arc: ~0 | 1 arc + badge | 1 badge |
| Accessibility | shape: crescent + lifted outline; Calm: no motion, static 0.3 s | badge icon shape | icon shape |
| Fit | quiet, local, uses the hero/enemy art itself | adds UI chrome into the world (risk vs 'restraint') | numbers get bigger, crowd risk |

### (iii) Enemy attack readability (tells)

| | A. One tell language, threat-first (RECOMMENDED) | B. Body-first tells | C. Hero radar ring |
|---|---|---|---|
| Look | one grammar for all types: GROUND decal + body pose; red-orange at full strength ONLY for a tell whose path will reach the hero (wolf lunge line passes within hero r + its r + 6 u, toad ring covers her, hart lane crosses her, thorn on course); all other tells at 28% alpha; wolf lunge = small ground chevron at the feet (15 u, dark rim) instead of the long line + floating triangle; cap: 4 full-strength wolf chevrons + 6 faint, nearest first; projectile visibility floor (thorn drawn >= r 5 u with dark rim, ember ring, cream core and 16 u trail); toad disc fill capped at 0.18 alpha while the hero stands in it (ring stroke stays); burst/charge decals above clutter (already); slam ring cream-red not brown | no decals for common enemies: wolf lunge read from the crouch + hackles + an eye flare only; decals stay for must-react types (piper, toad, hart, boss); bigger thorn | individual decals faint; a ring around the hero lights the segment where an attack will arrive within ~0.6 s, thicker when closer |
| Readability (frames) | red near the hero 5.4% -> 1.6% (desk), tells still all present | red 5.4% -> 1.7%; relies on spotting a crouch in a crowd of 60 wolves (fails at 11:30) | red goes UP (8-10%), the ring overlaps the hero; abstract |
| Build | M (wolf tell moves into `enemytells.js`; threat test is pure math, render only) | S | M |
| Perf | fewer Graphics strokes than today | fewer | +1 ring + segments |
| Accessibility | chevron + ring + lane shapes; Calm drops pulses only (threat cues stay, as today) | fails colour-blind if the eye flare carries it | shape ok |
| Fit | continues EN3-EN5 F-rules and the enemies-v1 tell grammar | 'restraint' but too subtle for swarms | gamey HUD-in-world |

Plus in all options: a **combat clarity rule**: when 8+ enemies are within 120 u of the hero (or 120+ in view), ambient layers ease down over 0.5 s: petals/fireflies/motes paused, fog -50%, foliage push-reaction off, ribbon/glow alpha capped 0.6, weapon damage numbers under 20 merged (no new small numbers near the hero). Visual only.

### (iv) Recap on death / results (parked 'killed by')

| | A. 'Struck down by' + What hurt you bars (RECOMMENDED) | B. Last five hits strip | C. One plain-words tip |
|---|---|---|---|
| Look | under the title: icon + 'Struck down by a Fell Wolf's lunge at 6:31'; in the card: 4 bars (icon, name, % of damage taken) + one line ('Half of the wolf hits were lunges') | the last five hits as icons with '-N' and the time, the final blow highlighted | one card: the top source + what its tell looks like + what to do |
| Why | deaths are slow bleeds (median 8-17% of HP in the last 5 s), so the by-source view teaches more than the last hit | shows the end, not the cause | teaches, but one tip can be wrong for the run |
| Build | S (`sim.hurtBy` exists; add `lastHit {src, kind, t}` counter; results view model) | S | S-M (copy per source) |
| Fit | slots into the locked U6 results layout (where the weapon bars are) | same | brass 'lantern word' tone fits |

### (v) Crowd readability (big swarms stay, 350 enemies)

| | A. Threat hierarchy (RECOMMENDED) | B. Lantern pocket | C. 'High clarity' setting |
|---|---|---|---|
| Look | filler swarmers (wolf, crow, crawler) drawn at lower contrast (alpha 0.74 in the mock; build: value pulled 15% toward the ground + 30% less saturation, thinner rim) and sorted BELOW must-react types; must-react types (piper, toad, hart, boss, later miniboss) keep full contrast, a cream hairline rim and sort above filler; enemies within 30 u of the hero fade to 0.5 so she and her hits show; hero silhouette always on at 1.0 when 3+ crowd her; tells per (iii)A; combat clarity rule | a soft clear pocket: inside ~50 u of the hero, enemies drawn at 0.42 alpha with a faint rim, a faint cream ground ring; no type hierarchy | Settings > Picture > Clarity: Normal / High. Normal = A at half strength; High = A + B + weapon numbers only for big hits |
| Measured (desk / land / phone portrait, same staged 350 crowd) | sprites over the hero 22/26/4 -> 0/0/0; red pixels near hero 10.1/4.7 -> 1.3/5.0 (land/phone re-stage had a different tell count, see README); 'squint edge' 20.9 -> 20.0 | occluders -> 0; red unchanged 9.6% (tells untouched) | occluders -> 0; red 1.3% |
| Perf | must-react rim: <= 23 extra images (live caps 8+10+5); alpha/depth are per-frame writes already made; ambient easing SAVES cost (estimate: High -0.2 to -0.5 ms at 350; needs a measured perf run in the build chunk) | 0 | as A |
| Risk | filler too dim loses the Husk art and the 'loads of enemies' feeling: tune with Matt on the real build; must not break WL6 gates G1/G2 (eye >= 3:1, body/ground gap >= 6) | the swarm still reads as one red mass | a setting can hide a bad default; keep default good |
| Fit | identity: 'enemies cold, threats warm', restraint; Husk silhouettes intact | lantern fantasy | standard accessibility option (like Brightness) |

Squint/pixel metrics (computed on every captured frame, `metrics-*.json`): `occluders` = enemy sprites drawn above the hero overlapping her box; `redPct` = share of red-orange pixels inside a circle of 0.2 x the short screen side around the hero; `squintEdge` = mean luminance gradient of the frame downsampled 8x (a proxy for 'busy'); A/C reduce occluders and red, squintEdge barely moves (outlines add edges while ambient removes them), so it is reported but not a gate.

## 6. Quick fixes (bugs / no design decision needed; render only, sims byte-identical)

1. HUD hurt flash is skipped under Calm motion (`app.js:159`): Calm players get no screen cue at all. Keep the opacity-only edge flash under Calm (it is not motion); only the shake stays off.
2. HUD hurt flash colour is danger red `rgba(217,83,79)`; the locked rule says damage taken = light red: use `#ff8078`.
3. I-frame flicker: rig <-> flat swap at 24 Hz (12 flashes/s), also under Calm. Replace with a steady 0.75 alpha (or <= 3 Hz) during i-frames; none under Calm (matches the WL6b photosensitivity rule).
4. Taken number drawn at the same depth/size as weapon numbers: draw it one depth above the weapon numbers and 1.2x, placed above the head (position change only, same colour).
5. Thorn visibility floor: draw at >= r 5 u with a dark rim + cream core + short trail at all tiers (keeps colours; Low keeps no streak).
6. Toad fuse disc fill alpha capped (0.18) while the hero stands inside it, ring stroke unchanged (the hero vanished under three discs at 4:00 and 11:30).
7. Slam landing ring `#7a4a1b` brown at 0.3 s: use the tell red-orange stroke for 0.3 s (it is the tell resolving).

(Items 3, 5, 6 touch looks Matt has seen; they are fixes of contradictions with the locked fairness rules, listed so he can veto.)

## 7. Build plan (small chunks, each with a gate)

| Chunk | Content | Acceptance gate |
|---|---|---|
| DR0 | quick fixes 1-7 + sim `lastHit {src, kind, id, t}` and hurt event payload (counters only) | tests (Calm flash on, flicker <= 3 crossings/s, payload), sweeps byte-identical (`sweep.mjs` 24 seeds both heroes), frames at 3 sizes |
| DR1 | (i) hit feedback (picked option) | 1-second clip test: 5 strangers (or Matt + 2) shown 10 random 1 s clips at 4:00/6:20/11:30 say 'was I hit?' >= 9/10 |
| DR2 | (ii) direction/source (picked option) | same clips: 'what hit you / from which side' >= 8/10 |
| DR3 | (iii) tell language + combat clarity rule | redPct near hero at the 11:30 staged crowd <= 4% desk; WL6 contrast harness gates still pass; perf at 350 within +0.3 ms per tier (`cdp.mjs perf`) |
| DR4 | (v) crowd hierarchy (+ Clarity setting if C) | occluders <= 2 at the staged 350 crowd, all 3 sizes; Matt squint test on the real build; G1/G2 contrast gates pass |
| DR5 | (iv) recap on results | results tests (view model, textContent only), 3 sizes |

Balance: all of this is render/UI only; the sim gains counters only, so balance targets do not move (sweeps must stay byte-identical; reported each chunk). Security: no new deps; recap text from fixed id -> name tables (no untrusted strings, `textContent` only).

## 8. Decisions for Matt (recommendation first)

1. **Hit feedback + direction** (one package): A+A = hurt rim above the crowd + lantern flinch + '-N' above the head, and the attacker briefly lifted with a light-red outline + crescent on that side (RECOMMENDED); or B+B ring + compass badge; or C+C HUD-led + tagged numbers.
2. **Enemy tells**: A one threat-first tell language (wolf lunge becomes a small ground chevron, only tells that will reach you are bright, thorn floor, clarity rule) (RECOMMENDED); B body-first (no wolf decals); C hero radar ring.
3. **Crowd readability**: A threat hierarchy (filler quieter and below, must-react types rimmed and on top, enemies over the hero fade, hero silhouette always on) (RECOMMENDED); B lantern pocket only; C a Clarity setting (Normal/High) on top of A.
4. **Death recap**: A 'Struck down by a Fell Wolf's lunge' + 'What hurt you' bars (RECOMMENDED); B last-five-hits strip; C one plain-words tip.

Conflict check vs docs/LOCKED.md: bleed blood-red body tint (2026-10-16 BLEED COLOUR) is a cause (hero hurt red is lost in a ring of bleeding enemies); the options avoid reopening it by moving the hurt cue to SHAPE (outline above the crowd) and position; if Matt still finds it muddy after DR1, the next lever is a darker/desaturated bleed BODY tint (numbers unchanged), which would need his reopen. Frost low-HP edge (HUD tuning row) untouched. Telegraph colour rule (red-orange only for eyes/tells) kept; wolf tell restyle follows the EN3-EN5 grammar. Calm motion rule kept.

Fit check: every option uses existing roles (cream/amber hero light, light-red taken, red-orange tells, cold enemies) and the hero/enemy art itself; no new palette, no HUD clutter in A. Security check: docs and mock-ups only; mock-ups were drawn in a throwaway in-page script on a scratch build (nothing saved); recap mock HTML has no external requests (local fonts), accepts only opt=A|B|C.
