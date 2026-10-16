# Ambient life v1: making the Hollow feel alive (DESIGN ONLY, nothing built, not locked)

Date 2026-10-16. Trigger: Matt on W0, "I like it but the world still needs to feel more alive." Mock-ups: `docs/mockups/world-sheet/ambient/` (am1-am5 sheets + raw frames; rebuild `node build.mjs` there, own headless Chrome only). Labels: OFFICIAL (engine source/docs, checked here), COMMUNITY (wikis/players), OPINION (mine), UNVERIFIED (from memory, not re-checked).

## 1. What makes a survivors-like world feel alive (and stay readable)
Honest coverage: web evidence on ambient design in this genre is thin (same finding as research/30). No postmortem found. Table is mostly OPINION/UNVERIFIED; do not treat as data.

| Game / source | What it does | Label |
|---|---|---|
| Vampire Survivors (Mad Forest) | Almost static tiled ground; the only "living" map objects are braziers (light sources that break open). Readability comes from a calm background, life from the horde itself | COMMUNITY (research/30 wiki rows) |
| Halls of Torment, Brotato, HoloCure | Mostly static ground; lighting/torches, fog and a few props carry mood (Halls), single fixed arena (Brotato) | UNVERIFIED (memory) |
| Stardew, Zelda-likes, Hollow Knight, Ori | Grass/foliage that sways and parts when the player passes, drifting motes, birds that flush as you approach: the standard cheap "alive" kit in top-down/side games | UNVERIFIED (memory) |
| Phaser 3.90 (our engine, local source) | Image/Sprite have NO skew (setSkew exists only on DOMElement), so sway must be rotation about the base or baked lean frames; Light2D exists but is costly (research/06) | OFFICIAL (node_modules/phaser/src, checked) |
| Our own repo | Fog banks + 24 fireflies already exist (Med/High); tiers in src/gfx/quality.js; life map visual-only (LOCKED) | OFFICIAL (repo) |

Principles I draw from it (OPINION):
1. The eye reads movement as life, so a few slow, shared, low-amplitude motions beat many busy ones. One wind source keeps it coherent, not noisy.
2. In a swarm game the gameplay layer must own contrast and motion. Ambient gets its own lane: below creatures, low contrast, small, quiet in combat, and never in the pickup colours (mint gem, rose heart, violet magnet, gold evolve/dawn).
3. Hollowlight has a free identity hook: colour = life already. Make MOTION = life too: restored ground sways, glows and hosts critters; the Hollow is still. This is also the main readability argument: enemies come out of still ground, so their motion pops more, not less.

## 2. Options (each: look / build / cost High-Med-Low / caps / readability risk)
Costs are estimates (OPINION) until a spike proves them on a real phone. All pooled, culled to camera + margin, drawn from one small canvas-generated atlas (tufts, blooms, critters) plus the existing glow texture. Caps live in `src/gfx/quality.js` CAPS as a new `ambient` entry.

| # | Option | Look | Build | H / M / L | Readability risk and fix | Verdict |
|---|---|---|---|---|---|---|
| 1 | Grass/flower sway | Tinted-outline tufts lean +-6 px (3 logical) with the wind; amplitude x life value | Pooled sprites on a 96-unit hash grid, rotation about base (origin bottom), 20 Hz staggered update, life sampled 2 Hz; 6 alive + 3 hollow tuft variants baked at boot | 64 / 36 / 0 swaying (Low: still tufts baked into the tile) | Motion under small wolves. Ground depth below all creatures, contrast <= ~18%, nothing within 78 px of the hero | YES |
| 2 | Drifting motes + fireflies | Warm cream pollen inside restored ground; faint glowless pale dust in the Hollow; fireflies already exist, tint by life | Additive 'glow' sprites, drift = wind + slow sine; wrap around the view like buildAmbient() | motes 28 / 14 / 0; fireflies 24 / 10 / 0 (today) | Mistaken for gems. Cream only, core <= 2.5 px logical, alpha <= 0.6, never mint/rose/violet/gold | YES, small |
| 3 | Critters (ambient only) | Sparrow perched on stump/stone, hare on restored ground, moths circling lit lamps; warm tan/cream, dark round eye, soft rim | Tiny state machine (idle, perch, flee, fly off, return) on the pooled atlas; OWN visual RNG stream, never sim RNG; decor only (no collision, targeting, drops, hits) | 5 / 3 / 2 (Low: plain sprites, no glow) | Mistaken for enemies. Enemies: faceless, cold, glowing eye-points, approach. Critters: warm, no glow, flee, hush when any enemy within ~100 px or 12+ on screen, return after ~6 s | YES, with rules |
| 4 | Shared wind in props | Crowns lean +-0.8 deg; petals/leaves blow across; gusts every ~10-14 s | One function `wind(x,y,t)`; crown sprites (W4 splits trunk/crown) setAngle; 8 petal sprites | crowns yes / yes / no; petals 8 / 4 / 0 | Low. Crown amplitude tiny; crowns already draw under creatures | YES |
| 5 | Creature-reactive foliage | Tufts within ~37 px of the hero, spirits and nearest enemies lean away, spring back in ~0.4 s | Pushers = hero + <= 6 spirits + <= 10 nearest enemies (read-only, from arrays the renderer already reads); 64 tufts x 17 = ~1k distance checks at 20 Hz, ~0.1 ms | yes / yes / no | Looks busy. Lean only, never height; capped; fades with wind scale | YES, after 1 |
| 6 | Restore-bloom | Flowers pop open (bud, half, open, 0.5 s ease-out-back, one sparkle) where life crosses 0.5; the best "colour returns" beat | Hash-cell candidates sampled at 4 Hz on the life CPU array; rising-edge trigger spawns a pop; <= 6 spawns/s; flowers also baked in the tile for Low | 32 / 16 / 0 (Low = colour only) | Edge flicker. One pop per cell, edge hysteresis (open at 0.5, close below 0.3) | YES, best value |
| 7 | Dawn-chorus moments | Three quiet, once-per-run beats: FIRST COLOUR (~0:40, first flower pop: a sparrow lands, first fireflies); BREATH OUT (boss/miniboss death: a few birds return, bloom ripple from the kill spot, wind +20% for 5 s); DAWN CHORUS (the win: 8-10 bird silhouettes cross from the sun side, 3 butterflies, motes x1.5, bloom wave from the dawn edge) | Triggered from existing time / boss-dead / victory events (read only); <= 12 sprites, <= 6 s; gold/warm only at the dawn beat | 12 / 8 / 4 (birds only) | Distraction in a fight. Beat 2 only after the kill and only if <= 12 enemies near; beat 3 happens when the run is won | YES, last |

Rejected or deferred: Light2D per-prop lighting (cost, research/06), wind shader on the ground (new shader risk on top of the unproven ground blend), a bigger critter zoo (scope, confusion risk), sound (separate audio chunk; hooks only).

## 3. Recommendation
Do 1, 2, 3, 4, 5, 6 and 7, but in a deliberate order (below). Principle: MOTION = LIFE, the Hollow stays still. Default reduced-motion handling: wind x0.25, critters perch still, motes slow-drift, no petals, bloom instant.

Per-tier totals (estimate): High ~165 ambient sprites (<= 28% of the 600 budget), Med ~85, Low ~2 (+4 birds at dawn). Extra draw calls: +2 on Med/High (one atlas batch, one additive glow batch), +0/1 on Low. CPU < 0.3 ms High. Visual only: sim and bot sweeps must stay byte-identical (own RNG stream; tests assert it).

## 4. Readability rules (build-gating)
R1 ground ambient is a decal below all creatures, <= ~18% contrast, <= 3 flowers per 100x100 px (1280 frame), none within 78 px of the hero. R2 airborne motes cream only, core <= 2.5 px, alpha <= 0.6, <= 28. R3 critters only on restored ground or by lit lamps, flee the hero, hush in combat. R4 motion amplitude <= 6 px, period >= 6 s, no flicker. R5 the Hollow is still. R6 phone: same view at 0.61 scale, so tufts become texture: density x0.6 on phone, drop the smallest flowers. No per-enemy exclusion test on ground items (too costly, unnecessary given R1). Checked in the mock with a grey + blur squint test (am4): wolves, pool, gems still read with the layer on. Not yet checked: real phone, real motion (a static PNG cannot show sway).

## 5. Fit check
- Look: Hollowlight Style v1 (tinted L2 outlines, H2 soft gradient/rim, chibi critters, warm lantern lane); Warm Lantern mood (cream/amber motes). Gold stays reserved for evolutions/dawn; cold glow stays enemy-only.
- Identity: extends "The Hollow" (colour returns) with motion returns; same life map, no new system. Mechanical sense: purely visual, no sim link, no collision, no drops, no balance numbers; critters flee and hush so they never compete with fights. Conflict check vs docs/LOCKED.md: none (life map stays V0/V1 visual-only; Low tier keeps no lightmap/vignette/fog; HUD stays frost-only; zero-budget, code-drawn assets; no new dependencies).
- Weak spots (honest): the mock is static, so amplitude and tempo are untested by eye; the main risk is "too busy at phone size"; the hero drawing in the mock is the existing A/B test pair (you play one hero); ground blend + lightmap are the real fill-rate risk, not this layer; sparrow/hare art needs a proper pass in the build (silhouettes shown are first-draft SVG).

## 6. Recommended small-chunk build order (slots into W1-W5; each needs Matt's go-ahead)
| Chunk | Goes with | What | Done-check |
|---|---|---|---|
| AL-0 | before W1 (cheap) | `src/gfx/wind.js` pure (wind(x,y,t), gust, reduced-motion scale) + tests; `caps.ambient` in quality.js + tests; no visuals | tests green, sweeps byte-identical |
| AL-1 | right after W1 (ground v1) | sway: tuft atlas + pool, life-scaled; Hollow still; Low = baked still tufts | screenshots 640x360 + phone, squint test, fps Low/Med/High, REAL-PHONE check (the gate for everything below) |
| AL-2 | right after W2 (trails) | restore-bloom pops | same checks; edge-flicker test |
| AL-3 | with W4 (props) | crown sway + wind petals | same |
| AL-4 | after AL-3 | creature-reactive foliage | pusher cap test, fps |
| AL-5 | with W5 (air) | motes + fireflies by life; critters (state machine tested in Node, own RNG, hush rule) | not-an-enemy screenshots, swarm test |
| AL-6 | after W6 (arc retune) | the three quiet moments | triggers tested in Node, no sim read-back |
Every chunk: tests + build, sweeps byte-identical, screenshots true size + phone, Low-tier fps, security note (no new deps, pure local drawing, no untrusted input), fit + LOCKED conflict check.

## 7. Decisions for Matt (recommendation first)
1. Principle: "Motion = life, the Hollow stays still" (Recommended) vs "ambient motion everywhere" (Hollow also sways lightly; livelier but enemies lose the stillness contrast).
2. Critters: sparrow, hare, moths, ambient only with the hush rules (Recommended) vs birds and moths only (no hare) vs none for launch.
3. Order: sway + bloom first, right after W1/W2, the rest with W4/W5/W6 (Recommended) vs everything together in W5 vs only the cheap four (sway, motes, bloom, wind) for launch and critters/chorus after launch.

Right now: waiting on Matt for these 3. Next: if yes, AL-0 (wind + caps, tests only) with the W1 go-ahead. Parked: sound for chirps and rustle, per-zone ambient sets (Dead Grove vs Meadow), weather.
