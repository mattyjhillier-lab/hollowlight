# 15 - Wow art direction (style A, "Moonlit Spirit-Glow")

Status: spec for implementation, 2026-10-14. Labels: MEASURED = numbers taken from our own screenshots/code this session; OPINION = art-direction judgement (not from a fetched source). Builds on 06, 11, 13, 14. Sim untouched unless a line says "ASK MATT".
Units: "u" = logical world units (sim space). px = CSS pixels. Colours are sRGB hex. "V" = 0-255 luma of the final pixel (what a screenshot measures).

## 0. Where we are (MEASURED)
Gameplay crop (x 5-95%, y 20-82%) of `docs/screenshots/compare/*` at 1280x720:

| Shot | mean V | median | p95 | p99.5 |
|---|---|---|---|---|
| a-midrun | 28.7 | 28 | 44 | 133 |
| a-swarm | 27.4 | 24 | 43 | 114 |
| a-phone-midrun | 30.4 | 24 | 53 | 209 |
| b-midrun | 27.6 | 25 | 44 | 145 |

95% of the play area sits in the darkest 17% of the value range, and there are almost no highlights. Hero is 14x18 u = ~28x36 px on desktop, ~22 px tall on a landscape phone, and ~11 px tall on a 390 px portrait phone, because `fit()` sets zoom = W/640.
**Targets (same crop):** mean V 45-60, median 35-50, p95 >= 110, p99.5 >= 235. Hero >= 56 px tall at 1280x720, >= 36 px at 390x844 portrait.

## 1. Diagnosis: 8 reasons there is no wow, and the fix for each
| # | Problem (seen in a-midrun/a-swarm) | Fix |
|---|---|---|
| 1 | **Scale.** Logical view 640x360 on every device. Characters are 2-3% of screen width, which looks like a minimap. Portrait phones show 640 u across, so the hero is about 11 px. | Zoom by the short side: 300 u visible on landscape, 250 u on portrait (section 3). Draw sprites 1.3-1.9x larger than the hitbox. |
| 2 | **Value crush.** The textures are painted dark, then multiplied by the grade (~0.6), then the vignette (ink tint), so mid-tones turn to mud. Mean V is 28. | Paint the world mid-value. Darkness comes from one lightmap (section 5), so lit areas reach V 80-140 and unlit areas sit at V 15-30. Contrast comes from light, not from dark paint. |
| 3 | **No light hierarchy.** Everything is equally dim and the only bright pixels are tiny halos. Nothing says "this is where the action is". | One rule: spirits and the hero's lantern are the light sources. They cast coloured pools on the ground, and enemies are lit only when they enter the light. |
| 4 | **Weak silhouettes.** Hero is a plain doll. Crows are dark ellipses on dark ground. Wolves are grey-brown on blue-grey. There are no rims and the eyes are too small. | Each creature gets a recognisable outline (ears, wings, roots), a 1 u rim light on the side facing the hero, and oversized emissive eyes (section 4). Enemies show bright eyes plus a dark body. |
| 5 | **Muddled colour story.** Hero is brown/tan like the wolves and roots. HP bar red is the most saturated thing on screen. Gems and spirits share teal. | Cool light = friend (cyan/violet/ice). Ember red/orange = enemy eyes and danger only. Warm amber/cream = the hero. Gold = evolution only. Mint = pickups. |
| 6 | **Static motion.** Sprites slide with no cycle. No squash, bob, wing flaps or cloak sway. Deaths are a puff. | Generate 4 frames per creature at boot and add code animation (bob, squash, lean) with a per-sprite phase offset (section 4). Deaths dissolve into rising wisps plus a light flash. |
| 7 | **Effects scale.** Hits, bolts and orbs are 5-10 px. Rings are thin. Evolution and level-up happen in the same muted frame. | Give each weapon a signature light colour and an impact flash 2-3x its body size. Use ground scorch/light decals that fade over 600 ms. Big moments use slow-mo, zoom punch and colour flash (section 6). |
| 8 | **UI outshines the world.** Wide glass panels, a 450 px saturated HP bar and big grey damage numbers (32 px, blurry, overlapping) take more attention than the play area. | Slimmer HUD with icon tiles. HP stays low-saturation until damaged. Damage numbers drop to 16-18 px, outlined and colour-coded (section 8). The world becomes the brightest thing on screen. |

## 2. Visual pillars and colour/value plan
**Pillars** (every asset and effect must obey all four):
1. **Spirits are the light.** Only spirits, spirit magic, the hero's lantern and spirit-touched props (runes, mushrooms, fireflies) emit light. Everything else is lit by them or by the ambient.
2. **Every cast throws light on the ground.** Each summon, bolt, strike and orb adds a coloured pool to the lightmap, so you can read the fight from the floor.
3. **Shadow creatures, ember eyes.** Enemies are cool, desaturated dark bodies with a warm rim and burning ember eyes. In the dark you see the swarm as eyes.
4. **Gold is earned.** Gold (#ffd36b) appears only on evolutions, evolution cards, boss rewards and the dawn. Nothing else may use it.

**Palette by role and value order** (V = target luma on screen at night; "base" = painted colour before the lightmap):
| Rank | Role | Hex (base / lit) | Night V on screen |
|---|---|---|---|
| 1 | Void / unlit ground | ground base #3a4a66, lightmap ambient night #3a4670 | 15-30 |
| 2 | Ground in hero light | same, lit by #ffd9a0 lantern | 60-95 |
| 2b | Ground under spirit pools | + additive #6fd3c5 / #8a5cff at 0.18-0.25 | 80-120 |
| 3 | Enemy bodies | wolf #5b4f63 / #8a7d92 top; crow #3e3a58 / #6c6890; root #4e3b34 / #8a6a52 | 45-110 (min tint 0.62) |
| 3e | Enemy rim + eyes | rim #ff9a6a a0.55; eyes #ff4a2a core #ffd0a0 | rim 150-180, eyes 230+ |
| 4 | Hero | Wren cloak #b4643c -> #ffb27a, hood lining #2a1d3a, face #f6dfc0, white rim a0.6; Elias robe #e8e2d0, sash #8a5cff | 120-210 |
| 4b | Hero lantern / ground ring | core #fff1c8, glow #ffcf7a | 245 |
| 5 | Spirit summons / magic | ghost wolf #9fe8ff core #ffffff; raven #8a6fe0 / #c9b8ff; orb #b8f2ff; bolt #7ff0ff; lightning #e8f4ff + #8a5cff | core 230-255, halo 120-180 |
| 6 | Pickups | gem mint #7dffc4 / sparkle #ffffff; heart #ff6f86; magnet #a98aff | 200-255 + twinkle |
| 7 | Evolution gold | #ffd36b, hot #fff3c4 | 255 (bloom) |
| - | Danger only | #ff4a3a (eyes, boss telegraph, low-HP vignette) | - |

**Dusk-to-dawn arc** replaces `GRADE` in `palette.js` and keeps the same `gradeAt()` API. It drives the lightmap ambient on Med/High and the multiply rect on Low:
| Run fraction | Ambient (lightmap fill) | Low-tier multiply | Mood |
|---|---|---|---|
| 0.00 | #6a5a9a | #c0b0f0 | violet dusk, soft |
| 0.25 | #44507e | #98a4e0 | blue evening |
| 0.55 | #33406c | #8a98d6 | deep night (darkest, spirit light rules) |
| 0.80 | #5a4a78 | #b8a0c8 | rose pre-dawn, warm edge on horizon fog |
| 0.95 | #b08a8a | #e8c0b8 | first light |
| 1.00 (victory) | #ffe2c4 -> #ffffff over 3 s | #fff0dc | dawn payoff |
Also lerp the fog tint #4a6a9a -> #c88a9a and the firefly count (night x1.5, dawn x0.3) on the same timeline.

**Role tokens (palette-agnostic rule).** No hex in sprite, effect or UI code. `palette.js` exports `ROLE` = {void, ground, groundLow, enemyBody, enemyTop, enemyRim, eye, eyeCore, hero, heroTrim, lantern, spiritA (wolves/bolts), spiritB (ravens/static), spiritC (orbs/holy), lightning, pickup, heart, evo, evoHot, danger, uiA, uiB, uiText, uiMuted} plus `ARC` (the ambient/lowMultiply/fog keyframes above). `sprites.js` draws from ROLE (with `sh()` for shades). The CSS vars are generated from ROLE (existing `applyCssPalette`). Textures are rebuilt at boot, so a palette swap costs one JSON-sized object. Later a palette can be set per chapter (`chapters.json` -> `palette: "moonlit"`). Every hex in sections 2-8 should be read as its role token.

### 2b. Palette alternatives (Matt open to change)
| Role | A Moonlit Spirit-Glow (spec default) | B Aurora Grove | C Ember Dusk | D Ink & Spirit |
|---|---|---|---|---|
| Void / ground base | #0d1426 / #3a4a66 | #06120f / #2c4a44 | #140a1a / #4a2e48 | #0e0f12 / #4a4e58 |
| Enemy body / rim / eye | #5b4f63 / #ff9a6a / #ff4a2a | #4a2a44 / #ff7ab0 / #ff3a6a | #1a1020 / #ffb070 / #b07aff | #15161a / #ffffff a.3 / #ff3a3a |
| Hero / lantern | #b4643c / #ffcf7a | #e8d2a8 / #ffe39a | #3a4a7a (cool cloak) / #bff4ff | #e8e2d6 / #fff6dc |
| Spirits A/B/C | #9fe8ff / #8a6fe0 / #b8f2ff | #5dffb0 / #ff6ad5 / #8af0ff | #8af6ff / #c8b0ff / #e8fbff | #bff4ff / #bff4ff / #ffffff (one hue) |
| Pickup | #7dffc4 | #fff08a | #7dffc4 | #7dffc4 |
| Evolution / danger | #ffd36b / #ff4a3a | #ffd36b / #ff3a3a | #ffe08a (paler, hotter) / #ff3a8a magenta | #ffd36b / #ff3a3a (the only reds) |
| UI accents A/B | #5ee6ff / #8b6cff | #5dffb0 / #ff6ad5 | #8af6ff / #ff9a5a | #e8e2d6 / #ffd36b |
| Mood | cold moonlight, eerie, calm-to-hope | Northern-lights wonder, magical, vivid | warm sunset dying into night; cool spirits as the only cold light | ink-wash minimalism (Gris/Limbo-like), stark, artsy |
| Light hierarchy | cool spirits on a cool world: contrast from value, not hue | green/magenta spirits pop on deep teal; enemies magenta-eyed | **strongest hue contrast**: cyan spirits on a warm-plum world; the hero is cool so it reads against the warm ground | pure value contrast; spirits are the only colour |
| Dusk-to-dawn arc | violet -> blue night -> rose -> warm dawn | teal dusk -> green-black night with aurora bands (ADD gradient strips overhead) -> pale mint dawn | orange-plum dusk -> violet night -> deep night -> gold dawn (dawn feels like the dusk returning; weaker payoff) | grey dusk -> black night -> white-gold dawn (strong payoff) |
| Phone readability | good; needs the lightmap + ember eyes (night ground V 15-30) | very good (high chroma survives small screens and sunlight) | good for spirits; enemy bodies near-black on plum can vanish without rims | best value contrast, but monotone gets tiring over 15 min and hides weapon identity |

**Honest ranking:**
1. **A (refined)**, kept for Chapter 1. It best fits "Spirits of the Dusk / forest", all current UI uses it, and with the lightmap its lack of hue contrast is fixed by value.
2. **C Ember Dusk.** The strongest single-frame wow (warm/cool complement). Best as a later chapter (e.g. a burning-marsh chapter). Its danger colour moves to magenta.
3. **B Aurora Grove.** The most "magical" and phone-friendly, but it competes with the evolution gold and can look toy-like. Good for an ice/tundra chapter.
4. **D Ink & Spirit.** Distinctive and artsy, but it fights weapon colour-coding. Use it only for the defeat moment or a bonus chapter.

Recommendation: no switch now. Build the ROLE tokens (task 1 includes this), then judge with an A/C screenshot pair after task 2.

## 3. Camera, scale, density
**Zoom rule** (render-only, replaces `fit()`): `short = min(W,H)/dpr`, `S = H>=W ? 250 : 300` (units on the short side), `zoom = min(W,H) / S`. Then clamp so the long side shows at most 620 u: `zoom = max(zoom, max(W,H)/620)`. Resize screen-space layers (grade, vig, dawn, flashR, lightmap) to `W/zoom x H/zoom`, not the fixed 760x440.
| Device (CSS px) | Visible u | px per u | Hero (26 u) | Ghost wolf (28 u) | Crow (18 u) |
|---|---|---|---|---|---|
| Desktop 1280x720 | 533x300 | 2.4 | 62 px | 67 px | 43 px |
| Desktop 1920x1080 | 533x300 | 3.6 | 94 px | 101 px | 65 px |
| Phone landscape 844x390 | 620x286 (clamped) | 1.36 | 35 px | 38 px | 25 px |
| Phone portrait 390x844 | 250x541 | 1.56 | 41 px | 44 px | 28 px |
Half-diagonals (306 / 298 / 341 u) stay under `spawnDistance` 390, so enemies still spawn off-screen. Walk-in is about 1.5-2 s longer. **ASK MATT** before trimming `spawnDistance` to ~350 (balance change).

**Display sizes** (hitbox `r` unchanged; display scale multiplies `inv(key)`). Texel density: 5 texels/u for hero, 4 for creatures, 3 for others, so DPR2 desktop stays sharp.
| Thing | Current u | New u (w x h) | Note |
|---|---|---|---|
| Hero | 14x18 | 20x26 | + lantern sprite 6x10 |
| Enemy wolf (r6) | 18x12 | 26x17 | overlap is fine |
| Crow (r4) | 14x10 | 18x13 | |
| Root crawler (r8) | 20x20 | 28x28 | |
| Elder Treant (r26) | 64x72 | 120x136 | boss must dominate: ~45% of view height |
| Ghost wolf summon | 18x12 x r/4 | 28x18 | bigger and brighter than enemy wolves |
| Raven summon | 12x10 | 16x12 | |
| Orb / bolt | 12 / 10 | 14 / 12 core + 2.5x halo | |
| Gem | 8x10 | 7x9 + twinkle | smaller, but brighter |

**Density target:** mid-run 25-40% of the view covered by things (creatures + light pools); swarm 50-60%. Never more than 70% opaque body coverage. Fill with light, not more sprites.
**Player readability in a swarm** (all cheap, single sprites):
- Ground ring: ellipse 24x9 u, 1.2 u stroke, #ffcf7a, alpha 0.45-0.65 pulsing at 1 Hz, above the lightmap and below characters. Turns #ff4a3a and pulses at 3 Hz below 30% HP.
- Lantern light: radius 130 u in the lightmap, #ffd9a0, intensity 0.9, flicker ±3% (sum of 2 sines at 7 and 11 Hz, no random).
- Silhouette pass: when 3 or more enemies are within 16 u, draw a pre-baked hero outline texture (1.5 u, #fff1c8) above all characters at alpha 0.7. Fade in and out over 120 ms.
- Hero is never darker than V 120. Enemies drawn in front of the hero use alpha 0.85 within 10 u of it.

## 4. Character and creature designs (Canvas2D at boot, 4 frames each, one atlas)
Shared rules:
- Draw each creature as N phase variants at boot (`draw(c, phase)`), so walk cycles cost zero per frame.
- Animate with `setScale`, `setRotation`, `setY` offsets from `(time*freq + id*0.618) % 1`. Never allocate per frame.
- Rim light = a 1 u stroke on the top/left edges at alpha 0.55 (warm #ff9a6a for enemies, white for the hero and spirits).
- Eyes are drawn last, at 1.5-2x the current radius, with an additive bloom blob baked into the texture.
- Spirits use additive blend for their halo sprite only, never for the body (bodies stay normal blend so they read as shapes).
- Death = 1 frame of white tint-fill (60 ms), then 6-10 pooled wisps, then a ground light flash in the lightmap (radius 30 u, 200 ms).

| Creature | Shape layers (back to front) | Palette | Frames / animation recipe | Death |
|---|---|---|---|---|
| **Wren** (hero) | shadow; cloak back (dark #6a3a24, 2 sway frames); body cloak (russet gradient, hem with 3 tattered points); wolf-ear hood (2 pointed ears, the identity read); face (cream, small); tied scarf tail (teal #6fd3c5 strip, 2 frames); staff + lantern as separate sprite | see section 2 | 4 walk frames (hem points and scarf alternate). Moving: bob ±1.2 u at 9 Hz, lean rotation 0.07 rad toward velocity, squash Y 1±0.05 on the step. Idle: breathe scaleY 1±0.025 at 0.5 Hz; lantern swings rotation ±0.18 rad (pendulum, lags 120 ms behind turns) | Defeat moment (section 6) |
| **Elias** | same body; hood -> white mitre-cowl with gold-free trim (#d8d0ff); holy sigil disc behind the head (ice, additive, slow spin 0.3 rad/s) | ivory robe, violet sash | same recipe, bob ±0.8 (calmer) | same |
| **Enemy wolf** | shadow; tail (sways ±0.25 rad, 2 frames); 4 legs; body (low, long, hackles: 5 spikes on the back); head, ears flat back; 2 ember eyes 1.2 u radius | #5b4f63 body, #2e2838 underside, rim #ff9a6a | 4-frame lope (legs, body Y ±0.8). Run cycle speed scales with sim speed. 15% get a 1.06 size variant. | white flash, body splits into 8 dark-violet smoke puffs + 2 ember sparks |
| **Crow** | shadow (offset 6 u down = flying); 2 wings (4 flap frames: up, mid, down, mid); body teardrop; beak #e0b040; 1 big ember eye | #3e3a58 / #6c6890 rim | flap at 8 Hz plus phase offset, body bobs ±1 u opposite the wings; 3 frames of feather ribbon on High only | 5 black feathers (spin + fall 500 ms) + ember spark |
| **Root crawler** | 7 root legs (4 frames: crawling wave, phase per leg); bark core with cracks; moss cap; 2 green-lantern eyes #9dff7a | #4e3b34 bark, #8a6a52 rim, cracks #ff8a3a a0.4 | legs ripple; core squash 1±0.08 at 3 Hz; leaves a faint dark root trail decal (pooled, 1 per 0.4 s, fades 1.5 s, Med/High) | bark shards (6) + the green eye lights pop outwards |
| **Elder Treant** (boss) | see phases | bark #5a3e2a -> #8a6448 rim; canopy #2f6a3a; eyes #ffb84a | idle sway: canopy rotation ±0.03 rad at 0.3 Hz; body breathe 1±0.015; root feet shuffle (2 frames) when moving; slam telegraph = ground ring #ff4a3a growing 0->60 u over 700 ms | 2.5 s: canopy collapses into 60 leaf particles, cracks flare gold, light burst radius 260 u, then dawn trigger |
| Treant phase 1 (100-66%) | full canopy, amber eyes, 3 hanging moss strands | green canopy, amber eyes | slow | - |
| Treant phase 2 (66-33%) | canopy texture swaps to thinned version, 1 leaf/0.3 s falling; bark cracks glow (overlay sprite alpha 0 -> 0.6, #ff8a3a); eyes -> #ff5a2a | adds ember cracks | sway x1.5; 150 ms shake + leaf burst on the transition | - |
| Treant phase 3 (<33%) | bare burning branches (crown of ember tips, 8 small ADD sprites); cracks full; ground under it gets a red-ember light pool r 90 u; rage pulse ring every 2 s | ember #ff4a2a, violet corruption smoke #5a2a6a | fast sway, eye flare on each attack | - |
| **Ghost wolf** (summon) | additive halo (teal, 1.6x body); body = translucent ice gradient #9fe8ff -> #4ab8e0, alpha 0.9; white spine line; 3 wisp tail streamers; white eyes | ice/teal + white core | 4-frame bound with stretch on the leap (scaleX 1.25, scaleY 0.85 for 120 ms); trail = 3 ghost copies at 40/80/120 ms lag, alpha 0.35/0.2/0.1 (High), 1 copy (Med), 0 (Low) | n/a (dismiss: shrink into a light mote that flies to the hero) |
| **Raven** (summon) | violet halo; ink-violet body; 4 flap frames; ice eye; wing-tip highlights #c9b8ff | violet | flap 10 Hz, bank rotation follows turn rate (±0.4 rad); feather trail 2 particles/s | - |
| **Holy orb** | outer ring (thin, ice), core sphere, 1 specular dot, a lavender halo | ice/lavender | spin specular, pulse scale 1±0.06 at 2 Hz | - |
| **Spirit bolt** | comet: core 12 u + stretched tail texture (24x6 u, gradient to 0) rotated to velocity | teal/ice | tail length scales with speed | impact: star flash 18 u, 120 ms |

**Perf rules:** every creature is 1 Image from the atlas (frames = atlas frames, set by `setFrame` on frame change only), plus at most 1 halo for spirits. Eyes are baked into the texture. Boss extras are 10 sprites max. All pooled. Target: 380 enemies + 60 summons/projectiles + 100 gems = 540 sprites + ~120 halos/pools in 6-9 draw calls.

## 5. Light-based world
**Lightmap (Med/High)** is the core wow feature. Steps:
- Create a RenderTexture at half the canvas resolution, scrollFactor 0, blend MULTIPLY, depth between props and characters. It replaces the `grade` rect on Med/High.
- Each frame: `rt.fill(ambient)`. Then, inside `beginDraw()/batchDraw*()/endDraw()`, stamp the `glow` texture for each light with ADD blend, using screen position `(wx - view.x) * zoom / 2`.
- Verify the blend and draw API in `node_modules/phaser/src/textures/DynamicTexture.js` before coding. Fallback: an invisible pooled Image set with blend ADD, drawn via `rt.draw(list)`.
- Light budget per frame: hero lantern (r130), each summon (r40, cap 40), each projectile (r24, cap 30), lightning strikes (r60, 150 ms), runes/mushrooms (r35-50, cap 8 visible), death flashes (r30, cap 10), boss eyes/phase pool (r90). Hard cap: 80 stamps on High, 40 on Med.
- Characters are drawn above the lightmap, so they are never black. Instead, give each enemy a tint by hero distance: `t = clamp(1 - d/170, 0, 1)`, `tint = lerp(0.62, 1.0, t)`, quantised to 8 steps so `setTint` runs only on change. Ember eyes are baked bright, so they still pop at 0.62.

**Low tier:** no RT. Use the existing multiply rect at the Low-tier colours from section 2, plus additive ground pools (a glow sprite at alpha 0.18 under summons, cap 20) and the hero lantern pool (alpha 0.25).

**Ground pools** (all tiers): an ADD `glow` sprite at ground depth (above the lightmap) under each summon/orb: scale 3x body, alpha 0.18, tinted to the spirit colour. Bolts and strikes leave a 600 ms fading pool. This gives the "coloured light on the floor" look even on Low.

**Ground texture recipe** (replace `groundA` blots; the 512 u tile stays seamless):
1. Fill #3a4a66 on Med/High (#24304a on Low, which has no lightmap).
2. Value noise: build 3 small canvases (8x8, 16x16, 32x32) of random grey values ±1. Draw each scaled to 1024x1024 with `imageSmoothingQuality='high'`, alpha 0.06/0.04/0.025 (overlay light / multiply dark alternately). Tile seamlessly by wrapping the noise grid edges. This gives soft gradients with no blobs.
3. Moss tint: the same 8x8 noise thresholded at 0.6 -> #2f4a4a at alpha 0.12, blurred (`ctx.filter='blur(12px)'` at boot only).
4. Grass tufts: jittered grid with 14 u cells, 1 tuft per cell at 70% chance. Each tuft is 3 strokes of 2-4 u, colour base ±10% value, alpha 0.35, slight lean. Top-left blade 15% lighter.
5. Leaves/pebbles: 80 ellipses of 1.2-2.5 u, dark bottom edge, light top-left dot.
6. 3 dirt paths: Catmull-Rom curves 18-28 u wide, #4a5068 at alpha 0.18, feathered with 3 strokes (w, 0.7w, 0.4w). Draw each at 9 wrap offsets (±512).
- Rule: no feature over 40 u may differ by more than 8% in value from its surroundings. Interest on the ground comes from lights, decals and props.

**Props** (seeded placement, sit under the lightmap, so lit for free):
| Prop | Size u | Look | Light |
|---|---|---|---|
| Dead tree | 40x60 | twisted silhouette, 3-4 bare branches, #1a2234 with cool rim #6a8ab0 a0.4 on the left | none |
| Living tree (current) | 30x42 -> 44x60 | keep it, lower canopy value to #1f3048, keep the teal rim | none |
| Rune stone | 14x20 | slab, carved glyph | glyph #6fd3c5 at 0.5 Hz breathe, r45 light; flares to r90 when the hero passes within 40 u (1 s) |
| Mushroom cluster | 12x8 | 3-5 caps | cyan #7fe8ff or violet #b08aff, r30 light, a0.6 |
| Fallen log / stones | 30x10 / 6-10 | dark, rimmed | none |
| Spirit shrine (1 per 800 u) | 24x30 | lantern post | warm r70, it is a landmark |
Density: about 1 prop per 90x90 u. 40 visible max. Props never above V 70 unless lit.

**Atmosphere layers** (Med/High):
| Layer | Depth / scroll | Content | Cost |
|---|---|---|---|
| Canopy shadows | above characters, scroll 1.15 | 4 huge soft dark blobs (#05070f a0.22, 300 u) drifting 3 u/s | 4 sprites |
| Fog banks | above characters, scroll 1.05 | existing, alpha 0.05-0.08, tint by arc | 6 sprites |
| Motes / fireflies | world, scroll 0.95 | existing; add 20 slow upward motes (spirit dust, teal/violet, 1 u) | 30-40 sprites |
| Ground mist | ground, scroll 1 | 3 long soft strips (#8aa0c8 a0.04) | 3 sprites |

## 6. Weapon and evolution spectacle
Each row is the signature to build; no two may share a colour + shape pair.
| Weapon / evolution | Colour | Shape language | Trail | Impact flash | Screen effect |
|---|---|---|---|---|---|
| Ghost Wolves | ice #9fe8ff | low bounding wolves | 1-3 ghost copies | white bite slash arc 14 u, 90 ms | none |
| - Pouncing Pack | ice + white | leap arcs (parabola, scale up 1.3 at apex) | long streak during the leap | pin = 4 claw marks decal (600 ms) + ice ring 30 u | shake 60 ms 0.002 per pin |
| - Howling Legion | teal #6fd3c5 | 12+ wolves, faint | shared mist ribbon | soft bites | howl: concentric teal sound rings from the hero every 4 s (3 rings, 400 ms) + lightmap ambient +10% for 1 s |
| - Dire Alpha | ice-white #e8f8ff with violet mane | one 2.4x wolf, heavy | mane particles 6/s | cleave arc 40 u, white | shake 90 ms 0.003 on each cleave; bleeding enemies drip ember dots |
| Raven Flock | violet #8a6fe0 | birds orbiting | feathers | small violet peck spark | none |
| - Murder Storm | violet + black | vortex of 30+ ravens, spiral | swirling ribbon ring around the hero | fear = enemies' eyes turn white for 1 s | a violet vortex ground pool r80 slowly rotating |
| - Dive Bombers | violet -> hot magenta #ff6ad5 | vertical dive (bird scales 1.6 -> 1 and drops shadow-first) | sharp dive streak | 26 u burst + feather starburst | zoom punch 0.01 on big hits |
| Spirit Bolts | teal #7ff0ff | comets | tapered tail | 12 u star | none |
| - Spirit Tempest | teal + white | bursts of 8 in a fan, spiralling homing | tight curly trails | last-hit explosion 28 u ring + 10 sparks | lightmap pulse r60 per explosion |
| - Soul Lance | white core, ice edge | one long spear (40x8 u), straight | lingering beam line 300 ms | pierce sparks along the whole line | 1 frame chromatic pulse (High), shake 80 ms |
| Chain Lightning | ice-white #e8f4ff + violet glow | jagged 2-pass bolts | none (instant) | branch flash 10 u at each node | lightmap flash r60, 120 ms |
| - Thunder Judgment | white + gold-free yellow-white #fff8d8 | vertical sky strikes on every enemy | none | 20 u white column + ground scorch decal (800 ms) | 80 ms full-screen flash a0.12, shake 120 ms 0.004 |
| - Static Storm | violet #b08aff | constant crackle field r around the hero (faint dome edge) | flicker | small violet forks | field dome = lightmap violet r100 at 0.4 |
| Holy Orbit | ice/lavender | 3-6 orbs on a ring | soft arc trail | lavender tap flash | none |
| - Sanctum Halo | pale gold-ice #e8f0ff (not gold) | wide ring + glyph circle on the ground | ring trail | holy ground decal (white sigil r, a0.15, slow spin) | soft white lightmap disc while standing in it |
| - Judgement Wheel | ice -> white-hot | fast spinning spokes (draw 6 faint spokes between the orbs) | motion-blur arc | orb explosion 24 u + 8 sparks; re-form = orbs fade in from the centre | small shake per explosion (capped 1 per 200 ms) |

**Evolution moment** (1.4 s total; `evolveMoment()` already exists, upgrade it):
| t ms | Event |
|---|---|
| 0 | Sim timeScale 0 (hit-stop) for 220 ms. Lightmap ambient dips to 40% (screen darkens; lights stay) |
| 0-220 | 24 gold motes spiral into the hero (particles, from r80 to r0) |
| 220 | Gold flash (ADD rect #ffd36b a0.35 -> 0 over 250 ms); zoom punch 1 -> 1.12 (180 ms ease-out) |
| 220-900 | timeScale 0.25. Two rings: gold r0 -> 220 u (700 ms, stroke 3 -> 0.5 u), ice ring delayed 120 ms. 48 gold sparks burst out. Chromatic pulse 2 px -> 0 (High) |
| 300-1000 | Evolution name in Cinzel gold, letter reveal 40 ms per letter, shimmer sweep; weapon sprites pop scale 0 -> 1.3 -> 1 in the new skin |
| 900-1400 | timeScale eases to 1, zoom back to base (500 ms), ambient restores |
| Sound hook | reverse whoosh 0-220, impact chord + choir swell at 220, sparkle tail |

**Other moments:**
| Moment | Recipe |
|---|---|
| Level-up | timeScale 0.2 for 300 ms; teal ring r0 -> 120 u (400 ms); zoom 1.04; gems on screen twinkle at once; chime rising a 3rd per consecutive level; then the card deal-in (section 8). |
| Boss intro (2.4 s, sim paused) | Music cut. Letterbox bars 0 -> 11% height (300 ms). Ambient dips to 30%. Camera pans to the boss (600 ms ease-in-out). Treant eyes ignite (eye glow scale 0 -> 1, 200 ms), roar plus shake 320 ms 0.008. Name card (existing big type) with a gold-free ember underline sweep. Pan back 500 ms, bars out, HP bar slides down. |
| Hero hit | Hero tint-fill white for 60 ms; red vignette pulse a0.25 -> 0 over 300 ms; ground ring flashes red. Below 30% HP: heartbeat vignette at 1.2 Hz and the lantern light shrinks to r90. |
| Defeat | timeScale 0.3 for 1.2 s. Lantern light shrinks to 0 over 1.2 s (the world goes dark, enemies become eyes only). Spirits dissolve upward into wisps. Desaturate (ColorMatrix on High; Low: grade -> #707080). Then "The light fades" in Cinzel, results. |
| Victory dawn (3.5 s) | Boss death burst. All enemies dissolve into motes, staggered 20 per frame. Ambient lerps to #ffe2c4 -> #ffffff over 3 s. A god-ray sprite from the top (3 large ADD gradient wedges a0.15, slow sway). Fog warms to rose. Fireflies go out, birds (8 tiny silhouettes) fly across. Gold "DAWN" wordmark. Birdsong + major chord. Then the results screen. |

## 7. Screen effects budget per tier
| Feature | Low | Med | High | Phaser 3.90 approach / fallback |
|---|---|---|---|---|
| Lightmap | off (multiply rect + pools) | on, 40 stamps, half res | on, 80 stamps, half res | RenderTexture MULTIPLY; Low fallback = grade rect |
| Ground pools / halos | 20 / 40 | 60 / 90 | 120 / 160 | ADD `glow` Images, one texture, batched |
| Bloom | off | off | camera `postFX.addBloom(0xffffff,1,1,1,0.7,2)` (steps 2) | baked halos already fake it |
| Vignette | baked image (existing) | baked image | baked + low-HP pulse | `vig` texture; avoid postFX vignette (extra pass) |
| Chromatic pulse | off | off | custom PostFX pipeline (RGB offset ≤2 px, only 150-300 ms during big moments, removed after) | skip |
| Colour grade | multiply rect | lightmap ambient | lightmap ambient + ColorMatrix on defeat only | - |
| Particles cap | 100 | 220 | 300 | existing pool |
| Trails | off | 1 ghost copy | 3 ghost copies + ribbons | - |
| Atmosphere layers | fireflies 10 | all, fog 4 | all | - |
| Shake / hit-stop | on (reduced-motion: off) | on | on | - |
| Damage numbers | 15, big/crit only | 30 | 40 | pooled bitmap text |
| Render scale | DPR cap 1.5 | DPR cap 2 | DPR cap 2 | - |
**Cut first on slow phones** (auto tier already steps down): (1) bloom, (2) chromatic, (3) trails, (4) lightmap stamp count 80 -> 40, (5) lightmap -> Low fallback, (6) atmosphere, (7) DPR 2 -> 1.5, (8) particles 300 -> 100. Never cut: ground ring, ember eyes, lantern pool, ghost-wolf halos. These are the readability features.
Budget check: ≤ 12 ms per frame, ≤ 600 sprites (lightmap stamps do not count; they are batchDraw calls into the RT), ≤ 25 draw calls (lightmap +2-3), ≤ 300 particles.

## 8. UI art direction (Moonlit Glass, upgraded to "Moonlit Reliquary")
Goal: it should feel like a premium modern action game UI (ornamented, icon-led, animated), still glass and moonlight, never flat boxes.

**(a) Identity**
- **Wordmark "Hollowlight":**
  - Built in SVG via `createElementNS`, no image file. Cinzel 700, letter-spacing 0.12em.
  - "Hollow" is silver-ice #c8d4f0 with a 1px #0a0f1f inner shadow (embossed). "light" is filled with a gradient #b8f2ff -> #fff1c8.
  - Both o's become lit lantern orbs: a circle with a radial ice glow and a tiny flame.
  - Animation: a light sweep (a masked linearGradient band moving left->right over 2.4 s, every 6 s); orb glow breathes 0.6-1.0 at 0.5 Hz; 6 spirit motes drift up from the "light" letters.
  - Subtitle "SPIRITS OF THE DUSK" in Rajdhani 600, 0.4em tracking, #9fb3c8, flanked by thin rules with a centred diamond.
- **Type:** Cinzel (titles, card names, evolution names), Rajdhani 600/700 (HUD numbers, stats, buttons, tabular-nums), Spectral (flavour/body text, card descriptions). All SIL OFL 1.1 (verified in 13). Self-host as woff2 subset (Latin, ≤25 KB each, base64 in the single-file build), with `font-display:swap` and a system fallback. Add OFL.txt + CREDITS rows when embedding.

**(b) Ornament and depth** (CSS only; tokens on `:root`)
| Element | Recipe |
|---|---|
| Frame | 3 layers: (1) panel gradient `linear-gradient(160deg, rgba(22,32,62,.82), rgba(10,14,30,.9))`; (2) 1px gradient border via padding-box/border-box (rarity colour -> 30% alpha); (3) inner 1px line inset 4px at `rgba(255,255,255,.06)` (`box-shadow: inset 0 0 0 1px`) |
| Corner flourish | inline SVG corner pieces (an L with a diamond tip and a small curl, 14px), placed with `::before/::after` + 2 spans, coloured by rarity, opacity .8 |
| Inner glow / bevel | `inset 0 1px 0 rgba(255,255,255,.12), inset 0 -2px 6px rgba(0,0,0,.4), 0 0 18px var(--rar-glow)` |
| Embossed text | headings `text-shadow: 0 1px 0 rgba(0,0,0,.6), 0 0 12px var(--rar-glow)` |
| Light sweep | a `::after` diagonal white band (a.08) translated -120% -> 120% over 900 ms, on hover and every 5 s on featured items |
| Grain | one SVG feTurbulence data-URI (baseFrequency .9, 1 octave) at opacity .05 on panels (static, cached) |
| Dividers | 1px gradient rule with a centred 6px rotated-square gem |

**Rarity colour language** (cards, weapon slots, icons, glow):
| Tier | Used for | Border / glow | Badge |
|---|---|---|---|
| Common | stat cards rank 1-2, fallback cards | silver-ice #b8c7e0 / glow .15 | none |
| Rare | stat cards rank 3-4, pickups | cyan #5ee6ff / .25 | "RARE" |
| Epic | new weapon, rank 5 (max), ability | violet #8b6cff / .35 | "NEW" / "MAX" |
| Evolution | evolution cards, evolved slots | gold #ffd36b / .5 + shimmer + corner flourishes doubled | "EVOLUTION" |

**(c) Iconography**
- Weapons, stats, pickups and abilities are code-drawn SVG icons in one consistent style:
  - 48-unit viewBox, 2.5-unit stroke in rarity colour plus a soft glow (an SVG `feGaussianBlur` copy underneath at .5), and a filled inner shape at 20% alpha.
- Set:
  - Weapons: wolf head (ears + snout profile), raven in flight, comet bolt, forked lightning, orb ring.
  - Stats: power = claw/fang, speed = double chevron, count = 3 dots, range/area = concentric rings, duration = hourglass, cooldown = circular arrow, pierce = arrow through a bar, chains = linked bolt.
  - Pickups: gem, heart, magnet.
  - Abilities: Pack Howl = wolf + sound arcs; Sanctuary = shield-sigil.
- Store paths in `src/ui/icons.js` as trusted constants. Build with `createElementNS`; never use innerHTML.
- UI glyphs (pause, settings, sound, close, back, reroll, banish): Lucide (ISC) or Phosphor (MIT), copied as path data with the licence notice in CREDITS. Use game-icons.net (CC BY 3.0) only if a code-drawn icon fails, with per-icon author credit.
- **Icon-led level-up cards:** a 64px icon medallion (circle, rarity ring, glow) top-centre. Name in Cinzel 20px. A big stat delta in Rajdhani: "90 -> 104" with the new value in rarity colour. 5 rank pips as diamonds. A one-line description in Spectral 14px. The "NEW/MAX/EVOLUTION" ribbon sits across the top-left corner.

**(d) Motion** (transform/opacity only; durations in ms; `cubic-bezier(.2,.8,.2,1)` = "spring-out")
| Element | Spec |
|---|---|
| HP bar | Fill drops instantly. A trailing "damage" segment (#ffd0a0) holds 250 ms, then drains over 400 ms. Heal = green-mint segment fills over 300 ms. Low HP: bar pulses glow at 1.2 Hz. |
| XP bar | Fill eases over 180 ms, with a leading-edge spark (4px white blob) while moving. When full: white flash 120 ms, then reset. |
| Card deal-in | Overlay fades in 150 ms (backdrop blur 0 -> 8px). Cards rise from +60px, rotateY 70deg -> 0, opacity 0 -> 1, 320 ms spring-out, stagger 80 ms. Medallion icon pops 0.6 -> 1.1 -> 1 at +200 ms. |
| Card hover / selected | Lift -6px, scale 1.04, glow +50%, light sweep once. Keyboard focus shows the same plus a 2px rarity outline. Pick: the card scales 1.08 and flashes, the others fall +30px and fade 200 ms, then close. |
| Evolution card | Gold border with a rotating conic-gradient highlight (4 s loop), a shimmer sweep every 2 s and 6 tiny gold motes rising (CSS keyframes). |
| Number count-ups | Gold/kills/results count up over 600-1200 ms (ease-out). Kills and gold pills "tick" scale 1.15 on change, throttled to 1 per 150 ms. |
| Screen transitions | Fade through ink (200 ms) + a 1.02 -> 1 scale on the incoming screen. Title -> run: the wordmark dissolves into motes (500 ms). |
| Buttons | Press: scale .96 for 80 ms, a brighter inner glow and a radial ripple from the press point (transform scale 0 -> 1, 300 ms). Disabled: 40% opacity, no glow. |
| Ability button | Conic-gradient cooldown sweep. When ready: a ring burst + slow 1 Hz glow pulse. |
| Reduced motion | `prefers-reduced-motion` or the settings toggle: no rotateY, sweeps, ripples or motes. Fades only, max 150 ms. Shake and chromatic off. |

**(e) HUD layout**
| Element | Desktop / landscape | Phone portrait |
|---|---|---|
| XP bar | full-width top edge, 6px, teal glow, level number in a small medallion at the left end | same, 5px |
| HP | top-left: 56px hero portrait medallion (code-drawn Wren hood icon) + slim curved bar 220x10, numbers on hover/low only | world-space bar above the hero (24x3 u, hides when full) + small top-left medallion |
| Timer | top-centre under the XP bar, Rajdhani 28px, no big pill (thin underline ornament) | top-centre 22px |
| Kills / gold | top-right compact pills with icons, 13px | top-right, stacked |
| Weapon slots | bottom-left: 4 square 52px icon tiles with rarity border + 5 diamond pips; evolved = gold | top-left under HP, 4 x 36px tiles in a row |
| Ability | bottom-right: 76px circular button, conic cooldown, key hint chip | bottom-right 84px, inside the thumb zone, 24px from the edges + `env(safe-area-inset-*)` |
| Joystick | - | floating, bottom-left, appears where the thumb lands, 110px ring at 20% alpha |
| Boss bar | top-centre under the timer, 50% width, ember gradient with a trailing segment, ornament caps | full width minus 32px |
HUD total opaque area ≤ 12% of the screen (currently about 20%). No HUD element is brighter than V 200 except low-HP warnings.

**(f) Screens**
| Screen | Design |
|---|---|
| Title | The live demo run renders behind (existing `?auto=` bot, god mode, seeded, Medium tier, zoom 1.15, slow camera drift, sim unchanged). Ink gradient at the bottom 40%. Wordmark centred-upper; 3 parallax spirit layers (big blurred ghost-wolf silhouettes at scroll .3/.5/.8 drifting). Buttons stacked: PLAY (gold-free ice primary, large), Spirit Tree, Settings, Credits. Version + "free, no ads" footer. Ambient music fades in over 2 s. |
| Character select | Left: list of character medallions (Wren, Elias; 8 locked as dark silhouettes with "?" and an unlock hint). Right: large stage. The hero at 4x on a glowing rune pedestal (ellipse light pool + rising motes), their summon orbiting/running a loop, name in Cinzel 40px, title line ("The Wolf-Called"), ability card with icon + cooldown, starting weapon card. Switching hero = pedestal light flares + 250 ms crossfade. |
| Level-up | Section (c)/(d). Game frozen behind with blur 8px + dim .5 (static, so backdrop-filter is OK). Header "LEVEL 7" Cinzel + a divider gem. Reroll/banish as small icon buttons with count badges. |
| Pause | Same glass; left column run stats (time, kills, DPS per weapon as horizontal bars with icons); right column Resume / Settings / Abandon (confirm). |
| Settings | Tabs: Graphics (Quality Auto/Low/Med/High with a live fps readout, Screen shake, Flashes, Damage numbers, Reduced motion), Audio (3 sliders), Controls. Custom slider: thin track, glowing thumb diamond. |
| Results / victory "Dawn" | Background = the frozen dawn frame. "DAWN" gold wordmark (or "THE LIGHT FADES" ice-grey on defeat). Big count-ups: time survived, kills, gold, shards (with icons). Per-weapon damage bars. Evolutions discovered shown as gold cards flipping in. Buttons: Again (primary), Spirit Tree, Title. |
| Spirit tree (concept) | Dark starfield canvas (Phaser or DOM+SVG). Nodes are 44px medallions with icons in rarity colours. Owned = lit + glow; affordable = pulsing ring; locked = grey silhouette with a lock + condition tooltip; hidden = "?" faint. Connections are SVG paths: lit owned paths (animated dash flow of light toward the newest node), dim locked paths. Pan/zoom, minimap corner. Branch colours: Summoner = teal, Magic = violet, Core = ice, Secrets = gold. |

**(g) References for feel** (OPINION, from general knowledge; not fetched)
| Game | Borrow |
|---|---|
| Hades | boon-card ornament per source, bold icon medallions, big readable names, rarity frames, the choice screen staging |
| Archero / Survivor.io | HP bar above the hero on mobile, top XP bar, chunky thumb-zone buttons, reward count-ups and chest fanfare pacing |
| Genshin Impact menus | thin gold/ice linework, diamond ornaments, generous spacing, light sweeps, calm motion |
| Diablo Immortal | ability buttons in a bottom-right arc with radial cooldowns, glowing ready state |
| Hollow Knight | restrained filigree, white-on-dark elegance, ornament only at corners |
| Vampire Survivors | do not copy the look; borrow only the speed of the level-up loop (one key, instant) |

**(h) UI performance rules** (mobile)
- Use `backdrop-filter` only on static overlays (level-up, pause, settings), at blur ≤ 8px (6px on `hover:none`), with a no-blur fallback below the Low tier.
- Animate only `transform` and `opacity`. Bars use `scaleX` on a fill. No `width/height/top/left` animation.
- HUD DOM writes ≤ 15 Hz and only on change (cache the last string). No `getBoundingClientRect` in the frame loop (no layout thrash).
- Set `will-change` only on cards during deal-in, and remove it afterwards. Limit the number of looping CSS animations visible in-run to ≤ 3 (ability pulse, low-HP pulse, XP spark).
- Glow via `box-shadow` on ≤ 10 HUD elements; prefer pre-blurred SVG/PNG for repeated glows.
- No innerHTML anywhere in the UI; icons via `createElementNS`; any save/URL-derived text via `textContent`.

**Damage numbers** (in-world, Phaser): baked Rajdhani-style digit atlas, 7 u tall (17 px desktop) normal, 10 u crit. Colour by source: wolves ice, ravens violet, bolts teal, lightning white, orbs lavender, crit gold-free orange-white #ffe0b0. 1 u dark outline. Pop 1.5 -> 1 in 80 ms, rise 14 u over 450 ms ease-out, fade over the last 150 ms. Merge per enemy within 150 ms. On phone portrait show crits and ≥ 25% enemy-HP hits only.

## 9. Build order (one task at a time; measure after each)
Measurement for every task:
- `node scripts/cdp.mjs perf` at t=358 with a mid-game loadout. Report fps, work ms, sprites, particles and draw calls at High 1280x720 and at Low with 4x throttle.
- Screenshots at 1280x720 and 390x844 DPR2 into `docs/screenshots/wow/`.
- Luma stats via the crop method in section 0.
- Perf gates for all tasks: High work ≤ 6 ms, Low 4x-throttle work ≤ 12 ms, draw calls ≤ 25, sprites ≤ 600, particles ≤ cap.

| # | Task | Size | Acceptance (screenshot + perf) |
|---|---|---|---|
| 1 | **DO FIRST. Camera zoom + display scale.** Short-side zoom rule; resize screen-space layers to the view; texel density 4-5; `VIS` display-scale table in `style.js` (section 3 sizes); `ROLE`/`ARC` tokens in `palette.js` (section 2) with all existing hex in sprites.js routed through them. | S-M | Hero ≥ 56 px tall at 1280x720, ≥ 36 px at 390x844 portrait; Treant ≥ 40% of view height; no screen-space layer edge visible at either size; perf gates. |
| 2 | **DO FIRST. Lightmap + lantern + pools** (section 5), new dusk-dawn ambient table, Low fallback, enemy distance tint, ground ring. | M | Midrun crop luma mean ≥ 45, p95 ≥ 110, p99.5 ≥ 235; visible coloured pools under every summon; Low tier screenshot still readable (mean ≥ 38); draw calls ≤ 12; High work ≤ 6 ms. |
| 3 | **DO FIRST. Silhouette and value pass:** repaint enemies (section 2 values, warm rim, big ember eyes), new Wren/Elias (wolf-ear hood, lantern sprite, scarf), ghost wolves brighter than enemy wolves. | M | Grey-scale screenshot: hero, each enemy type and each summon identifiable by outline alone (side-by-side sheet `wow/silhouettes.png`); hero V ≥ 120; eyes ≥ 230; in a-swarm the hero is found within 1 s (ask Matt). |
| 4 | Ground recipe + props (dead trees, rune stones, mushrooms, shrines) with prop lights. | M | No blob > 40 u with > 8% value delta (zoomed crop); ≥ 3 lit props visible in a 533x300 view; perf gates. |
| 5 | Creature animation frames (4 per creature) + bob/squash/lean/flap code recipes, per-id phase offsets. | M | 4-frame GIF/strip of wolf, crow, root, hero shows distinct poses; 380 enemies at High work ≤ 6 ms; 0 allocations in update (Chrome allocation sampling flat). |
| 6 | Weapon signatures for the 5 base weapons (section 6 rows), impact flashes, scorch/claw decals, lightmap stamps. | M | Screenshot with all 5 active: each weapon distinguishable by colour + shape; particles ≤ cap. |
| 7 | Evolution moment recipe + the 11 evolution signatures. | M | Frame captures at t=0/220/600/1000 ms match the table; each evolution has its own screenshot in `wow/evo-*.png`; no frame > 25 ms during the moment. |
| 8 | Boss: 3 visual phases, intro (letterbox/pan/roar), slam telegraphs, death burst. | M | Screenshots of phases 1/2/3 clearly different (canopy, cracks, eyes); intro 2.4 s; boss fight work ≤ 7 ms High. |
| 9 | Moments: level-up, hero hit, defeat, victory dawn (god rays, ambient to white, bird silhouettes). | S | Dawn frame luma mean ≥ 120; defeat frame mean ≤ 25 with eyes visible; reduced-motion toggle removes shake/zoom. |
| 10 | Atmosphere layers (canopy shadows, motes, ground mist) + tier table (section 7) + cut order in `quality.js` CAPS. | S | Low 4x throttle work ≤ 12 ms; High bloom on, Med off; tier switch mid-run causes no hitch > 50 ms. |
| 11 | **UI DO FIRST. Reliquary frame kit + rarity system + icon set:** CSS tokens, frame/corner/bevel/sweep classes, `icons.js` (code-drawn SVG weapons/stats/pickups/abilities), icon-led level-up cards with deal-in motion. | M | Level-up screenshot: 3 cards with icon medallions, rarity borders differ (common/rare/epic/gold), corner flourishes visible; deal-in ≤ 600 ms total; no innerHTML (grep test passes). |
| 12 | **UI DO FIRST. HUD re-layout** (top XP bar, portrait medallion + slim HP with trailing segment, icon weapon tiles, circular ability button, phone portrait layout, world HP bar on phone) + damage-number restyle. | M | HUD opaque area ≤ 12% (pixel mask count) at 1280x720 and 390x844; damage numbers ≤ 18 px desktop, colour-coded; DOM work ≤ 0.5 ms/frame. |
| 13 | Title screen (live demo run, animated SVG wordmark, parallax spirits) + character select stage. | M | Title screenshot shows a moving run behind the wordmark (2 shots 1 s apart differ); wordmark sweep visible; fps ≥ 55 on title at High. |
| 14 | Pause, settings, results/dawn screens; spirit-tree screen mock (static data) with lit/locked/hidden nodes. Fonts embedded (OFL, CREDITS). | M | Screenshots of each screen; fonts load offline from the single-file build; build size increase ≤ 120 KB; `npm audit` clean (no new deps). |
**DO FIRST** = tasks 1, 2, 3 (world) and 11, 12 (UI). These are the biggest wow per effort: scale + light + silhouettes turn the frame from "nice indie" into "glowing spirit war", and the frame kit + icons fix "plain and boring" on every screen at once.

## 10. Honest limits and risks
- **Code-drawn art ceiling:** shapes stay "clean vector cartoon". There is no hand-painted texture, hair or cloth detail, and no expressive faces. Wow has to come from light, motion and effects, not illustration. 4-frame cycles look smooth when bobbing but never like Hades-level animation.
- **Where money or a CC0 pack helps most (in order):**
  1. Hero and character portraits/key art for the title, select and store page. One commissioned illustration has the biggest marketing impact.
  2. Boss sprite and its phases.
  3. An SFX/music pass; audio is half of the "wow" (CC0 Kenney/OGA first).
  4. Hand-drawn icons for weapons/evolutions.
  - Environment and effects are fine in code.
  - Keep any purchased art inside the same palette and outline rules; do not mix pixel packs (06/13 rule).
- **Mobile performance risks:**
  - The lightmap RT is a full-screen fill + multiply each frame. At DPR2 on mid phones it may cost 1.5-3 ms GPU (unmeasured; our only numbers are desktop RTX 3060 and 4x CPU throttle, which says nothing about GPU fill). Mitigations: half-res RT, stamp caps, auto-tier fallback.
  - Bigger sprites also mean more overdraw in swarms; watch the GPU, not just CPU work ms.
  - DynamicTexture blend behaviour in 3.90 needs a prototype check before relying on it.
  - Thermal throttling on 15-min runs: test a full run on a real Android phone (Chrome remote debugging) before calling anything done.
  - iOS Safari is untested (no Mac); `backdrop-filter` and large SVG filters are the likely culprits there.
- **Design risks:**
  - The darker-unlit world can hide enemies that approach from the dark. Ember eyes + min tint 0.62 are mandatory, and a "brighter world" accessibility toggle (ambient +25%) is cheap insurance.
  - The zoom-in shows less of the swarm. ASK MATT if spawn distance or density should be retuned after task 1.
  - Gold discipline: if anything non-evolution goes gold, the evolution payoff weakens.
- **Security:** no new dependencies; fonts and icon path data come only from OFL/ISC/MIT sources listed in 13 with CREDITS rows; SVG built with `createElementNS`, never innerHTML.
