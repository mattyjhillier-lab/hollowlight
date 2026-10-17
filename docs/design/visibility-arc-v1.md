# W6 Visibility + Vibrancy Arc v1 (design sheet, NOT locked)

Status: DESIGN ONLY, awaiting Matt. Nothing in `src/` changed. Source idea: Matt, docs/QUEUE.md IDEA 2026-10-16.
Research: docs/research/36-visibility-arc.md. Mock-ups and measurements: docs/mockups/visibility-arc/ (real dev build + a runtime debug override; see its README).
Reopens if approved: LOCKED world sheet #2 line "night light lifted ~14% (ARC retune in W6)" (option A is far darker at the start and brighter after 8:00; option "Clear" in Settings keeps the lifted night for anyone who wants it).

## 0. The idea in one paragraph
The run starts in deep night. Your lantern is the light. Beyond its warm pool the Hollow's creatures are mostly a pair of glowing eye-points and a faint cool rim; step closer (or let them come) and the lantern shows them fully. The sky greys toward 8:00, the boss arrives at 10:00 in the first grey light, the sky turns rose after 11:00 and the sun rises in the last minutes. As it brightens, enemies become dark silhouettes against a lighter ground (easy to read), and the colour you restored gets richer and more saturated, so the last two minutes look like the reward: "you are nearly through the night". Visual only: the sim, damage, spawns and balance do not change.

## 1. What the current build does (measured, not guessed)
- Lighting: half-res MULTIPLY lightmap (src/gfx/lightmap.js) at depth 5000; ambient from `ARC` in src/gfx/palette.js (violet dusk -> darkest at 55% = 8:15 -> rose -> dawn). Lantern light radius 130 (90 at low HP), pup light 24, boss light 90.
- Enemies are drawn at depth 60000, ABOVE the lightmap, so the ambient never darkens them; RunScene only tints them 1.0 -> 0.62 between 0 and 170 units (16 steps).
- The edge vignette (depth 120000, ink) sits on top of everything and dims far enemies' eyes at the screen edge.
- Eyes are baked into the enemy textures (radius 1.15 world units, red-orange #ff4a2a, cream core). Measured with the contrast harness (desktop 1280x720, High): eye-to-ground contrast is only **1.3-2.3 : 1** at every distance and every time, including inside the lantern pool. Today's enemies already fail a 3:1 eye floor; this chunk fixes that as a side effect.
- Low tier: no lightmap; ground and props are multiplied by `gradeAt` (x0.62 for the W1 daylight tiles). Eyes measure 4-10:1 on Low because the ground is darker.

## 2. THE ARC (option A, recommended)
Time is run seconds (run = 900 s; boss at 600 s in Chapter 1). Interpolate linearly between rows (keep the existing allocation-free `arcAt`, extended to more columns; quantise to 150 steps as now).

| t | moment | ambient (Med/High) | ambient Y | vs current | Low tint | lantern r | far body V | eye alpha | rim alpha | restored saturation | dawn wash |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0:00 | deep night | #222b54 | 0.027 | 0.14x | #6c76aa | 150 | 0.40 | 1.0 | 0.85 | 0.80 | 0 |
| 3:00 | deep night (hold) | #242e5a | 0.031 | 0.23x | #707cb0 | 150 | 0.40 | 1.0 | 0.85 | 0.82 | 0 |
| 5:00 | night thinning | #2c3868 | 0.044 | 0.40x | #7c8abc | 145 | 0.45 | 1.0 | 0.75 | 0.88 | 0 |
| 8:00 | blue hour | #3c4a80 | 0.074 | 0.91x | #8e9cc8 | 140 | 0.55 | 0.9 | 0.60 | 0.95 | 0 |
| 10:00 | first grey (BOSS) | #56609a | 0.127 | 1.32x | #a4acd4 | 135 | 0.58 | 0.75 | 0.35 | 1.00 | 0 |
| 11:30 | rose pre-dawn | #7a74a8 | 0.195 | 1.69x | #beb4d6 | 130 | 0.48 | 0.70 | 0 | 1.08 | 0.04 |
| 13:00 | sun at the rim | #a8889c | 0.283 | 1.53x | #dcc0c4 | 130 | 0.55 | 0.55 | 0 | 1.16 | 0.10 |
| 14:30 | sunrise | #e0b8a8 | 0.530 | 1.24x | #f2dccc | 130 | 0.68 | 0.40 | 0 | 1.26 | 0.20 |
| 15:00 | dawn (victory flood) | #ffe2c4 | 0.796 | 1.00x | #fff0dc | 130 | 0.75 | 0.30 | 0 | 1.30 | 0.30 |

Columns: ambient Y = relative luminance of the ambient colour (the multiply factor on unlit ground); "vs current" = ratio to today's ARC at the same time. Far body V = enemy body tint value beyond the pool (cool-tinted: R x0.86, G x0.93, B x1.0). Eye alpha / rim alpha = strength of the eye layer and cool rim for enemies outside the pool (section 3). Restored saturation = multiplier on the RESTORED layers only (section 2.2). Dawn wash = the existing warm ADD rectangle (`this.dawn`, 0xffa888), now driven by the table instead of `f > 0.7`.

Why this shape:
- **Darkness is inverse to danger.** The first 3 minutes have the fewest, slowest enemies (wave rate0 0.12-0.4/s, events at 1:00 and 2:30), so that is where darkness costs least. Density peaks after 9:00, when the ambient is 1.3-1.7x brighter than today.
- **Monotonic, slow.** Ambient luminance only ever rises after 3:00; steepest slope 13:00 -> 14:30 is +0.0027 Y per second (no visible step; research: transitions over minutes, never seconds). No flashes.
- **Boss in first light.** At 10:00 the Elder Treant walks out in the first grey light (1.32x today's brightness), always fully lit by its own light (section 3.4).
- **Contrast flips at 11:30 on purpose.** Before ~10:30 far enemies read as a light cool rim + eyes on dark ground; after 11:00 they read as dark silhouettes on a lighter ground (Limbo-style). The crossover is the riskiest moment (body = ground lightness), so far body V is LOWERED at 11:30 (0.48) to jump past it, and the eyes stay at >= 0.7 through it (measured, section 5).
- **Lantern pool 150 -> 130.** Bigger when the dark matters most, back to today's 130 by 11:30. Low-HP shrink keeps today's rule but never below 115 while ambient Y < 0.08 (so a hurt player is not blinded in the dark).

### 2.1 Colour grading (cool Hollow lit warm)
- Unlit Hollow stays cool blue-grey at every moment (ambient blue channel always highest until 13:00). Warm colour only comes from the lantern, spirits, trails and (late) the sun; this is the identity rule "Light is the only warmth" (BIBLE 2).
- From 11:30 the ambient warms (rose -> peach -> dawn cream). The dawn wash is the existing warm ADD sheet, capped at 0.30 (today 0.36) so late-run pickups, numbers and eyes keep contrast.
- Gold stays reserved: the dawn sun/flood is the only other gold-family light, as locked.

### 2.2 Vibrancy (the "nearly cleared it" nod), visual only
`vib(t, R) = satClock(t) x (0.85 + 0.15 x R)` where `satClock` is the table column and R is the restored share of the view (0..1).
- R = mean `sampleClean` life over a fixed 8x5 grid of points in the view, sampled at 2 Hz (40 samples, no allocation). Restoring more of the view makes the late colour richer; a player who restored little still gets the clock part (dawn is generous: BIBLE 7).
- Applies ONLY to restored layers: ground shader restored tile (one new uniform `uSat`), AL-1 tufts/flowers, W4 restored prop images, AL-5 critters, petals. Never to enemies, eyes, telegraphs, pickups, numbers or UI.
- 0.80 at the start means restored colour is a little muted in deep night (it is night), so the late 1.30 reads as a real change, not just "more".
- Late-run accents: from 13:00, restored flowers get +10% head size via the existing AL-2 bloom pose (no new sprites) and the AL-6 dawn chorus birds (already planned, Low has 2 + 4 birds) start. Both visual only.

## 3. ENEMY VISIBILITY RULES
### 3.1 What the player ALWAYS sees (all tiers, all brightness settings)
1. Eye-points of every non-boss enemy in view (Low: nearest-first cap 40; Med 120; High 200 eye slots; 2 eyes = 2 slots; filled in two passes: enemies within 1.8 x lantern radius first, then the rest, no sort).
2. A body that is never pure black and never matches the ground: far body V floor 0.40 in the dark, plus the cool rim (Med/High) or the Low tint floor; after 11:00 a dark silhouette at least 6 L* below the ground.
3. Telegraphs (charge line, boss ring), damage numbers, pickups and their halos, the boss, and the HUD: drawn above the lightmap and NOT darkened by the arc (they already are; the rule is now a test).
4. Eyes and telegraphs draw ABOVE the edge vignette (depth 120001+), so the vignette never hides a threat at the screen edge.

### 3.2 Inside vs outside the lantern pool
- `lit = clamp((1.25R - d) / (0.5R), 0, 1)` with d = distance from the lantern ember (not the feet), R = lantern radius from the table.
- Inside (lit = 1): enemies look exactly as authored (today's look, full tint). Eye overlay stays at a small floor (alpha 0.35) so eyes meet 3:1 even inside the pool (today they do not).
- Edge band (0.75R-1.25R): body tint, eye and rim blend smoothly; no pop when an enemy crosses the edge.
- Outside (lit = 0): body tint = far body V (cool), eye layer at the table alpha, rim at the table alpha (Med/High), W3 cold glow unchanged.
- Spirits' own lights (wolves, ravens, orbit, bolts, lightning) already add to the lightmap; they also count as light for enemies: an enemy within 40 units of a lit spirit uses `lit >= 0.5`. Cheap: only checked for the 12 brightest spirit lights per frame (High; Med 6; Low 0).

### 3.3 Eyes (look)
- Two layers per eye: a 9-unit ember halo (`glow`, tint #ff6a3a, additive) and a 4.2-unit cream-amber core (#ffe2b0, additive). The CORE carries luminance, so protan players still see a bright point (research: red-on-dark vanishes for protanopes; hue never carries it).
- Steady (no flicker, so no flashing risk), they blink once every 4-7 s per enemy (one frame of alpha 0.2; off with Calm motion). Faceless rule kept: eyes are the only face.
- Per-type offsets from the sprite definitions (wolf one eye at +6.2,-1.6; crow +3.9,-1.2; root crawler two eyes at -2/+2.2,-0.8; flipped with faceX). Enemy sheet #4 (pending) must keep eyes at a clear, data-driven anchor per creature.

### 3.4 Bosses and minibosses
- Always fully lit (tint 1.0) at any distance, keep their own light (boss 90 now; 120 while ambient Y < 0.1), boss eyes in #ffb84a (ROLE.bossEye) with a larger core; boss telegraph ring unchanged and above the vignette. Minibosses (W8, not built) follow the boss rule.

### 3.5 Crows (darkest enemy, fastest erratic mover)
- Crow eye core +20% (5 units) and rim alpha x1.2. Measured: crows are the weakest class inside the pool (eye 1.6-2.0:1 on High today), which the eye floor fixes.

## 4. FAIRNESS GUARANTEES (numeric gates for the build)
Measured by an automated pixel-contrast harness (prototype in docs/mockups/visibility-arc/capture.mjs: real build in headless Chrome, 3 enemy types x 3 distances frozen on Hollow ground, one frame with and one without enemies, per-pixel mask; reports WCAG eye contrast and CIELAB delta L* of the body median vs the ground behind it).
- **G1 Eyes:** every non-boss enemy outside the pool: eye peak contrast >= 3.0:1 vs local ground, at 0:30, 4:00, 8:00, 11:30 (14:30 is daylight: G2 only), High/Med/Low, desktop and phone sizes. Inside the pool >= 3.0:1 from the eye floor.
- **G2 Silhouette:** every enemy either passes G1 or has |delta L*| >= 6 body vs ground; after 11:00 |delta L*| >= 6 is required for all (daylight silhouettes).
- **G3 No void:** ambient Y >= 0.025 at every moment on Normal; no rendered enemy pixel below RGB 12; never pure black (OLED smear, research 5).
- **G4 Coverage:** in a 350-enemy swarm at 0:30 every enemy within 1.8R has eyes (cap never cuts the near band; test counts), and every enemy that touches the hero was visible (eyes or lit) for >= 0.6 s before contact (test with spawn rings at the view edge; fastest enemy crow 62 u/s covers ~37 units in 0.6 s).
- **G5 Above the dark:** telegraphs, numbers, pickups, boss, hero, spirits are never tinted by the arc (unit test on depths/tints).
- **G6 Smoothness:** ambient luminance change <= 0.004 Y/s and no keyframe step (unit test on the table).
- **G7 Sim untouched:** sweeps wren+elias x24 seeds random+FOCUS byte-identical (visual only). The bot cannot see, so "no early deaths introduced" is checked by Matt's playtest checklist (section 4.1) and G4.
- **G8 Perf:** at 350 enemies, work ms +<= 0.6 (High), +<= 0.4 (Med), +<= 0.2 (Low) vs the same frame without W6 (scripts/pace.mjs); no per-frame allocations (pooled eyes/rims, packed-int colours).

### 4.1 Playtest checklist for Matt (desktop + his phone)
1. Play 3 runs on Normal. Did anything hit you that you did not see coming? (Note the time.)
2. First 3 minutes: can you tell wolf, crow and root crawler apart beyond the lantern by eyes + shape? Does it feel tense in a good way or just hard to see?
3. 4:00 swarm event and 9:00-10:00 waves: do you lose track of where the crowd is?
4. Boss at 10:00: is the treant and its attack ring always clear?
5. 13:00-15:00: does it feel brighter, warmer and more colourful, like nearly reaching dawn? Too much?
6. Phone: once indoors at your normal brightness, once outdoors in daylight. Try Normal and Brighter.
7. Settings > Picture > Brightness: does Clear feel like the old game?
8. Any eye strain after a full run?

## 5. Measured results (contrast harness, desktop 1280x720, seed 3; 1 frame per cell, so noise of roughly +-0.3 on contrast and +-1.5 on delta L*)
Eye contrast (WCAG, ground = median behind the enemy) for wolf / crow / root crawler at 70 (inside), 140 (edge) and 220 (outside) world units:

| moment | current build High | option A High | option A Low |
|---|---|---|---|
| 0:30 | 1.5-1.8 / 1.3-1.8 / 1.5-2.0 (fails 3:1 everywhere) | inside 2.9/2.0/3.2, edge 4.5/3.4/5.1, out 4.9/4.7/5.8 | 6-14 |
| 8:00 | 1.7-2.1 / 1.5-2.2 / 1.7-2.4 | inside 2.8/2.0/3.0, edge 4.4/3.4/5.1, out 4.5/4.2/5.6 | 4.8-11.7 |
| 11:30 | 1.7-1.9 / 1.5-2.1 / 1.7-2.1 | inside 2.4/1.9/2.5, edge 2.8/2.5/3.3, out 3.0/2.8/3.6; silhouettes delta L* -6 to -7 (pass G2) | 4-8.5 |

Gate pass count (G1 eyes >= 3:1 OR G2 |delta L*| >= 6; 5 moments x 2 tiers x 3 types x 3 distances = 90 cells): **current build 61/90 (outside the pool 36/60)**, **A 86/90 (outside 60/60)**, B 83/90 (59/60), C 84/90 (59/60). A's 4 misses are all wolves at 70 units INSIDE the pool on High (eye 2.4-2.9:1, body about the same lightness as the lit ground): fixed by the inside eye floor (section 3.2), which the mock does not draw.
Full tables (all options, all moments, both tiers): docs/mockups/visibility-arc/contrast/contrast.csv.
Reading: option A meets G1 outside the pool at night with margin (3.4-6.1). It does NOT yet meet G1 inside the pool (crows 2.0) because the mock only draws the eye layer outside; the build adds the inside eye floor (alpha 0.35, section 3.2). At 11:30 eyes are 2.5-3.6 and the silhouettes carry it (G2). Options B and C measure close to A on eyes (the eye layer does the work); C's far bodies are near-invisible (|delta L*| < 1 at 220 units at 0:30), which is exactly its risk.

## 6. ACCESSIBILITY
- **Settings > Picture > Brightness** (new key `brightness`, enum validated in src/save/schema.js like `quality`; per device like the other picture settings):
  - **Normal** (default): the arc above.
  - **Brighter**: ambient multiplied by 1.6 (capped at the table's dawn value), far body V +0.15, eyes unchanged, lantern unchanged. Recommended first-run default on touch devices (phones lose most to sunlight and low brightness, research 5).
  - **Clear**: the locked "lifted night": ambient = max(table, today's ARC x 1.14), far body V floor 0.62 (today's distance tint), eyes and rim still drawn. For anyone who does not want darkness; the vibrancy ramp still plays.
- **Calm motion (existing reducedMotion)** also: no eye blinks, rim static, dawn wash capped 0.2, vibrancy change still happens (it is colour, not motion) but over the same slow curve.
- Colour-blind: eyes rely on a bright cream core (luminance), not on red; telegraphs keep their shapes (line + triangle, ring), not only red. Check with protan/deutan simulation in the harness (CSS filter pass) before lock of the build.
- Never: full-screen flashes, sudden brightness steps, pure black.

## 7. TIER COSTS AND IMPLEMENTATION IDEAS (no new per-frame allocations)
| piece | High | Med | Low |
|---|---|---|---|
| ambient arc (lightmap fill colour) | same cost as today | same | Low tint via `gradeAt` (same cost) |
| enemy far tint | existing tq path, 16 steps, now from the arc | same | same |
| eye layer | 200 slots (2 pooled additive images each) | 120 | 40 |
| cool rim | baked outline texture per enemy type at boot (`outlineOf` like the hero outline), 1 pooled image per far enemy, cap 120 | cap 60 | none (tint floor only) |
| vignette | eyes/telegraphs above it | same | (no vignette on Low) |
| vibrancy | ground `uSat` + sway/prop/critter restored images via a vivid atlas frame set made at boot | ground `uSat` + sway only | Low tint warms (no saturation) |
| restored share R | 40 life samples at 2 Hz | same | same |

- Reuse: `ARC` table in palette.js (more columns, same `arcAt`), the existing Lightmap (just the fill colour and the lantern radius), the existing `tq` tint path in RunScene, SpritePool for eyes/rims, `outlineOf` for rims, the life map `sampleClean` for R, the ground shader for `uSat`.
- Estimated cost at 350 enemies: eyes ~0.2-0.3 ms (High, 200 slots x 2 images, already batched additive), rims ~0.2 ms, the rest ~0. Within G8; must be measured.
- Phone: the portrait view is 640 x ~1385 world units, so most of a portrait screen is outside the 130-150 pool; that is why Brighter is the suggested phone default and eyes must pass G1 at phone size (the harness runs at 844x390 and 390x844 too).

## 8. THREE OPTIONS (pick one; A recommended)
| | A Deep dusk: eyes + faint rim, contrast floor (Recommended) | B Dim dusk: bodies visible, desaturated, eyes glow | C Near-black: only the lantern pool, eyes beyond |
|---|---|---|---|
| Start ambient | #222b54 (Y 0.027, 0.14x today) | #404e84 (Y 0.082, 0.44x today) | #0e1226 (Y 0.007, 0.04x today) |
| Far enemies | cool body V 0.40 + cool rim + bright eyes | cool body V 0.85, no rim, eyes 0.7 | body V 0.10 (black shapes), eyes only |
| Lantern | 150 -> 130 | 140 -> 130 | 165 -> 130 |
| Brightening | darkest 0:00-3:00, today's level at ~8:00, brighter than today after | gentle, close to today's lifted night | very dark until 5:00, fast rise 8:00-11:30 |
| Measured eyes outside pool (High, 0:30) | 4.7-6.1:1 | 4.4-5.9:1 | 4.0-5.3:1 |
| Measured silhouette at 220 (0:30) | delta L* +3.6..+4.2 (rim) | +2.0..+5.1 | -0.8..+3.0 (near invisible) |
| Fit | strongest "your lantern is the light" + eyes in the dark, keeps creature shapes (identity rule) | safest, least change, weakest wow; eyes add little | most dramatic (20 Minutes Till Dawn-like), but hides the unique silhouettes we paid for |
| Risks | needs the rim + eye layer to be built right; phones in sunlight (Brighter default) | barely different from today (Matt asked for "very dark") | unfair-feeling hits, phone sunlight unusable, eye strain, silhouettes lost; would need Brighter as default everywhere |
| Cost | eyes + rims (High/Med) | eyes only | eyes only |

## 9. FIT CHECK AND MECHANICAL SENSE
- Fit: colour = life and "light is the only warmth": the cool Hollow is darkest when the least is restored, warmth comes only from the lantern and spirits, and the dawn floods colour (BIBLE 2, 7; IDENTITY). Faceless enemies with glowing eye-points (LOCKED) become the main night read. Trails/spirit lights matter more at night (they light the Hollow), which sells the summoner fantasy. Gold stays reserved.
- Mechanical sense: visual only (no sim change, sweeps byte-identical). Darkness peaks when danger is lowest; every threat keeps eyes or a silhouette (gates G1-G5); the boss is always lit. The brightness setting keeps it fair for phones and low vision.
- Lock conflicts: REOPENS world sheet #2 "night light lifted ~14%" (Normal is darker early, brighter late; Clear keeps the lift). No other conflict: HUD stays frost-only; ambient-life locks (Hollow still, critters hush) unchanged; AL-6 dawn chorus slots into 13:00+; results/UI untouched. Enemy sheet #4 (pending) must keep data-driven eye anchors.

## 10. WEAK SPOTS (honest)
1. Mock-ups use a whole-camera saturation matrix (it also tints enemies/HUD-free world); the build applies vibrancy to restored layers only. Late-run frames therefore look slightly more saturated on enemies than the build will.
2. The mock draws eyes only outside the pool and the rim as a scaled tint-fill copy (rough edges); the build uses baked outlines and an inside eye floor.
3. The harness measures 1 frame per cell on one seed and Hollow ground only; restored/corrupted ground and props behind enemies need adding (build chunk W6d).
4. No real-phone or sunlight test yet; Brighter-as-phone-default is a recommendation, not measured.
5. 20 Minutes Till Dawn vision distance not measured (research gap); radii are our own numbers.
6. Eye blink + spirit-light-reveal (3.2) are designed but not mocked.

## 11. BUILD PLAN (small chunks, each needs the lock first; each: tests + sweeps byte-identical + harness + screenshots 1280x720 / 844x390 / 390x844 + perf)
- **W6a Arc data + setting:** ARC table in seconds with the new columns, `brightness` setting (schema enum + Settings Picture row + tests), lightmap ambient/lantern radius/dawn wash from the table, Low tint. Gate: G3, G6, Clear matches today's lifted look.
- **W6b Enemy night read:** far tint from the arc, eye layer (pooled, caps, near band first, above vignette, inside floor), baked rims (Med/High), boss rule, crow boost, blink (Calm off). Gate: G1, G2, G4, G5, G8.
- **W6c Vibrancy:** `uSat` in the ground shader, R sampler, vivid frames for sway/props/critters (High), Med ground+sway, Low warm tint. Gate: never applied to enemies/pickups (test), G8.
- **W6d Harness + checklist:** scripts/w6-contrast.mjs from the mock harness (all tiers, 3 sizes, Hollow/restored/corrupted ground, protan/deutan filter), Matt's playtest + phone check.
- Then AL-6 dawn chorus.

## 12. DECISIONS FOR MATT (max 3)
1. **How dark and how enemies read:** A deep dusk with eyes + rim (Recommended) / B dim dusk, bodies visible / C near-black, eyes only. (A or C reopen "night lifted ~14%".)
2. **Brightness setting:** Normal / Brighter / Clear, Normal default on PC and Brighter default on phones (Recommended) / same three, Normal default everywhere / no setting.
3. **Vibrancy driver:** clock + how much of the view you restored (Recommended) / clock only.
