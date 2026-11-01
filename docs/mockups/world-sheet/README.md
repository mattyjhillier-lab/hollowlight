# World sheet #2: Chapter 1 Cursed Forest (design only, nothing built)

Rebuild: `node build.mjs [overview|ground|props|life|arc|poi|actual|build]` (local Chrome via CDP, spawns and closes its own process; imports the style-lab engine and the approved Wren v2 / Elias v2 rigs, edits nothing). Source: `world.mjs` (engine: ground, props, life map, corruption, lightmap, frame), `scenes.mjs` (shared forest + battle), `sheets.mjs` (pages), `arc.mjs` (re-exports the real ARC from `src/gfx/palette.js`).

Units: mock px = 1 px at 1280x720 desktop = 0.5 game unit (the game view is 640x360 logical, shown 2x). Hero 60 px (Wren) / 75 px (Elias); phone 390x844 @DPR2.

## Sheets
| File | What |
|---|---|
| ws1-overview.png | Take A (Meadow Glade) vs Take B (Deep Forest Floor), same battle, same moment, plus recommendation |
| ws2-ground.png | Hollow vs restored vs corrupted ground at 1:1, both takes, and how it is made |
| ws3-props.png | 14-prop set, each Hollow + restored, tall and low props, silhouette test |
| ws4-life-corruption.png | colour wake, trails that fade, corruption, fireflies, and a debug view of what the life map stores |
| ws5-dusk-to-dawn.png | 4 key moments (0:30, 6:30, 10:00, 14:50) with the real ARC keyframes |
| ws6-points-of-interest.png | 3x3 zone map, worn path, edge wall, 6 POI types Hollow vs restored (visual only) |
| ws7-actual-size-A.png / -B.png | true size (1:1, 2.8x pixels, phone, dawn) with honest notes |
| ws8-build-and-perf.png | render stack, perf risks, build chunks |
| frame-{A,B}-desktop-1280x720.png, frame-{A,B}-phone-390x844@2x.png | the raw night frames |

## The two takes (direction was open for the ground/prop look only; Style v1 is locked)
- **A Meadow Glade**: light painted meadow, flower drifts, round storybook oaks, pale snags that blossom when restored, low bushes/stumps/boulders. Friendly, easiest to read.
- **B Deep Forest Floor**: slate/loam floor with leaf litter, roots, moss, ferns; tall bark pillars that run off the top of the screen; canopy only as a ground shadow. Feels more like a cursed forest, darker.
- Recommendation: one pipeline, two ground sets. A for Meadow / Old Road / Wells zones and the opening, B for Dead Grove / Root Thicket / Graves and the edge wall. If ONE: A.

## Rules the sheet bakes in
1. Colour = life. Hollow ground and props are cool grey-blue; the restored paint exists only where the life map says (Hollow/restored variants share one silhouette so the swap never pops).
2. No canopy ever hides a creature: crowns draw UNDER every creature; only a ~40 px trunk base looks solid, and nothing collides (trees stay decor, as in the sim today).
3. Corruption = ink-dark + cracked veins with a faint violet rim, never red; enemy things glow COLD, friendly things warm; gold stays for evolutions/dawn.
4. Trails (lantern, scarf, spirits) paint life along their path; it fades over ~25 s so the run builds a mural that slowly heals back to grey.
5. Fireflies/fog read the map: warm fireflies inside restored ground, cold pale ones in the Hollow.
6. Dawn floods colour from the screen edge; ground tiles are authored at FULL daylight values and the lightmap multiplies them down (the current ground tile note already says darkness comes from the lightmap).
7. Other life writers (all visual): Elias's Candle Wheel bloom, wells, lit lanterns, Pack Howl.

## Feasibility with the existing pipeline (checked in src/)
- `src/gfx/lightmap.js` (half-res multiply RT) and ARC in `src/gfx/palette.js` are reused unchanged. The mock uses the real ARC keyframes, lifted +14% (see weak spots).
- Today: ground = one 1024 px baked tile in a `tileSprite` (sprites.js groundA), trees = one 'tree' sprite (520, y-sorted), 'patch' decals, fog/fireflies = additive glow sprites. There is NO life map in the code yet (IDENTITY.md only).
- Needed: a pure-JS life map (`src/gfx/lifemap.js`: 256x256 Int8 life + corruption, stamp/decay/sample, unit-tested) + a ground blend of two tiles by that texture. Best look = a small fragment shader (Hollow tile, restored tile, life tex; noisy edge, 1-cell warm rim, veins). Fallback (shader fails, and always on Low): Hollow tile + the existing warm pool sprites. Trees/props swap frame by sampling the CPU array (works on Low, cheap).
- Quality tiers: Low already has no lightmap, no vignette, no fog/fireflies, 100 particles: keep it that way; Low shows Hollow tile + hero pool, props swap by CPU sample, and at dawn crossfades to the restored tile. Med/High get the blend, trails, fog/fireflies by life.

## Perf risks (honest; all unproven until W0)
1. Custom fragment shader in Phaser 3.90: none exists in the repo; must be proven on Low/Med/High and a throttled phone before anything else.
2. Large/TileSprite textures have caused mobile WebGL issues: keep tile <= 1024, life texture 256, never world-sized.
3. 8-bit decay stalls: do decay in the CPU array, upload the result (256 KB per upload, ~10 Hz).
4. Prop sprites: cap <= 120 live on one atlas, cull to camera + margin; sample life for swaps staggered ~0.5 s.
5. Overdraw: fog + trails + halos + lightmap already stack on Med/High; the new ground pass replaces (not adds to) the ground draw.
6. Night ground must be authored bright; stacked multiply darkens twice if tiles are made dark like today's.
7. SVG mock-ups cannot prove fps; they prove look and layering only.

## Fit check
- Look: Style v1 (L2 tinted outline, H2 soft gradient + rim light, W2 painted ground with grass/flower detail, G1 lantern pool + G2 trails, mood P1 Warm Lantern). IDENTITY: it IS "The Hollow" (grey drained world, colour returns, spirit-painted trails, creeping corruption) on the one life-map system. Warm light only from heroes/spirits/lit lanterns; enemies cold; gold reserved.
- Mechanics: purely visual (life map stays V0/V1 per LOCKED, no gameplay link); no collisions; props never occlude creatures; POIs are the already-locked phased map events (research 30), only their look is designed here; no balance numbers touched.
- Conflict check vs docs/LOCKED.md: none. The HUD row says life-map colour on the HUD is "revisited in the world sheet": recommendation = keep the HUD frost-only (calm, already locked) and let the world carry colour.

## Weak spots (honest)
- Night is too dark with the real ARC and the brighter painted tile: the mock lifts the ambient +14%; the build needs a small ARC retune (chunk W6) or darker tiles. Tuning decision for Matt.
- Take B: Fell Wolves (cold grey) lose contrast on the dark floor; leaf litter is busy at phone size (needs thinning); pillars add vertical clutter on a phone (fewer there).
- Take A: bushes/boulders repeat visibly (needs 3 variants each); flower specks can add noise under small wolves (rule: keep drifts out of ~60 px around the hero).
- The restored edge in the mock is a displaced circle/strip with a tan rim; in the game it will be a noisy blend of 15.6-unit cells (softer). The rim may need tuning so it does not look like a sticker (visible at dusk in ws5).
- SVG scenes are stand-ins: real art is canvas-generated textures; the oak crown (merged circles + clipped shading) is the most complex prop to bake and may need simplifying.
- Props shown are the Chapter 1 set only; Briar Mother, Grey Alpha, Treant arena and chests belong to the enemy/boss sheets.

## Recommended build chunks (small; each shown to Matt before the next; none starts without approval)
- W0 Spike: pure-JS life map + ground blend shader on Low/Med/High, prove >= 55 fps on a throttled phone, with the Low fallback.
- W1 Ground v1: Hollow + restored tiles (chosen take), hero lantern adds life, rim, veins; tests + screenshots (640x360 and phone).
- W2 Trails: spirits/scarf paint life, decay, ribbon visuals, Low fallback.
- W3 Corruption: enemies add veins, light burns them, sparks; pure-JS tests.
- W4 Props v1: oak/snag/bush/stump/boulder/log atlas, Hollow + restored, crowns under creatures, sampling swap.
- W5 Air: fog by zone, fireflies colour by life, edge wall + vignette.
- W6 Arc retune: lifted ARC keyframes + dawn colour flood from the edge (sweeps byte-identical: visual only).
- W7 Zones: 3x3 authored layout, seeded landmark slots (feeds the phased map-events plan).
- W8 POI art with their phases: well, lanterns, den, nest, grove, chapel.

## Decisions for Matt (max 3)
1. Ground/prop look: A only, B only, or A + B by zone (recommended).
2. Night brightness: lift the ARC night keyframes ~14% (recommended) or keep and paint darker tiles.
3. HUD stays frost-only (recommended) or takes a hint of life-map colour.
