# Hollowlight round 3: polished cartoon (static mock-ups, not game code)

Rounds 1-2 were rejected as plain, blocky, unappealing, wrong mood (see docs/ART-DECISIONS.md). This round aims at the premium, chunky, colourful 2D-cartoon quality of Matt's reference genre, with Hollowlight's own identity (docs/IDENTITY.md): a grey drained Hollow, spirit light that restores colour and leaves luminous trails, enemies that spread dark vein-like corruption. No Spirit Hunters art, names or layouts were used.

Files (X = 1 or 2), each 1280x720, under 350KB: `pX-world.png`, `pX-creatures.png` (most important), `pX-tree.png`, `pX-levelup.png`. Sources: `pX-*.html` (self-contained inline SVG, system fonts, no network). Regenerate: `node build.mjs [filter]` (local Chrome over CDP, Node built-ins only, reuses `../ui-directions/png.mjs`; `pal.mjs` is a PNG8 fallback used when 24-bit rounding cannot hit the size cap). Creature drawings: `creatures.mjs` (one bespoke drawing each, palette-driven), world: `world.mjs`, tree: `tree.mjs`, cards: `levelup.mjs`, icons: `icons.mjs`, palettes + gradient/filter defs: `core.mjs`.

## What changed vs rounds 1-2
- Characters: chibi proportions (big head, big glossy eyes, blush, soft three-stop gradients, rim light on the lower-right edge, clipped shade and highlight blobs). Outline weight varies by role: heroes warm brown 2-2.6px, spirits no outline but a thin white-hot rim and a blurred glow, enemies near-black 3-6px (bold). Previously: uniform flat shapes.
- The Hollow reads in one glance: the whole world is drawn twice (grey/veined, then coloured) and a soft organic mask (radial blobs plus wide strokes along the wolf and raven paths) reveals the coloured version. The same tree silhouette is bare and grey outside the mask and lush with leaves, flowers and grass inside it. Warm light blooms along the boundary.
- Each creature has its own silhouette and personality (see sheet). 3 new Chapter-1 enemies from the bible: Blightbulb, Thornspitter, Moss Mourner.
- Calm HUD that follows the bible: lantern flame HP, moon sliding along an arc toward a dawn line, spirit-thread XP with a knot at the end, 4 weapon slots with rank pips, ability button with a cooldown ring. UI plates are dark glass with a thin brass (P1) or moon-cyan (P2) edge.
- Gold stays reserved: only the EVOLVE card, evolve gold and the dawn sun use it. The coin icon is brass. Cold red-orange appears only in enemy eye-points, telegraphs and the thorn shot.

## P1 WARM LANTERN vs P2 MOONWELL

| | P1 WARM LANTERN | P2 MOONWELL |
|---|---|---|
| Mood | Cosy-sad storybook; the lantern is the only warmth | Moonlit, mystical, quiet; the Hollow feels deeper and colder |
| Swatches | slate #2b3441, mist #8fa0b2, lantern amber #ffb84a, restored green #7fbf5f, evolve gold #ffd36b | midnight #161c2e, mist #7a89a8, spirit cyan #7ff0ff, violet #b79cff, lantern/gold #ffc46b |
| Spirit light | cream-amber wolves, rose-lilac ravens, amber gems | cyan-white wolves, violet ravens, cyan gems |
| Restored world | grass green, gold autumn leaves, wildflowers | teal-mint grass, violet and teal foliage, pastel flowers |
| Humans | Wren's amber scarf is one of several warm notes | Wren's amber scarf and lantern are the ONLY warm notes, so they pop harder (matches Wren's "amber is her colour") |
| Skill web | orange Summoner / lilac Magic / mint Light, warm halos | violet / cyan / warm-gold, cool halos |
| Risk | Warm spirits plus warm lantern plus gold evolve sit close in hue: evolve gold needs its sparkle/rim to stay special; green restored ground competes with amber | Cyan spirits plus teal ground are close in hue: enemy contrast is fine but spirits can blend into restored ground, needs the white-hot core and glow to carry |
| Matches the bible | Wolves are bible moon-blue; P1 deviates (cream-amber). Warm Wren-amber thread is the bible detail, here amplified | Closest to the bible colours (moon blue wolves, violet ravens, amber only on Wren) |

Recommendation: P2 is closer to the written bible and gives the strongest "colour is earned / light is warmth" read (the only warm things are humans and lanterns). P1 is friendlier and more storybook, and probably appeals more to Matt's "cosy" taste. Mix is cheap: palettes are one object each (`P1`, `P2` in `core.mjs`), so "P1 world with P2 spirits" is a 10-line change.

Codes (same idea as round 2): W world+creatures, C colour, I icons (`icons.mjs`), U UI plates, F type (Georgia titles, Segoe UI Black numerals), L glow language (white-hot core + quadratic falloff glow). Any W can combine with any C.

## How it would be built in Phaser (code-defined art, no hired illustrator)
- Author each creature once as an SVG-style data drawing (what `creatures.mjs` does, using gradients, outlines, clipped shade blobs). At boot, render to a texture at 2x-4x using either `Graphics` with gradients baked via a Canvas2D `createLinearGradient`, or simply draw the SVG string to an `Image` then `textures.addImage`/`addCanvas` (SVG to canvas works in all modern browsers, runs once at load, offline, no external fetch). Rim light and clipped shade are canvas `clip()` + fills, same as here.
- Spirits: bake the body once, draw the glow as a pre-rendered radial-gradient sprite with `ADD` blend (cheap), never a live blur. Wolf leg-fade = canvas `destination-in` gradient at bake time.
- Hollow vs restored: the life-map texture from IDENTITY.md (128x128) drives a ground shader or a masked two-layer blend: grey ground tiles under coloured tiles revealed by the life-map (one low-res texture upload per frame). Trees/props: bake both a grey and a coloured version of each prop (4 variants per prop), swap per prop by sampling the life map at its position. Veins: pre-baked vein decal sprites stamped as enemies walk.
- Trails: ring-buffer of paw/feather decals drawn with fading alpha; the glow along them is the same additive sprite.
- UI: DOM/CSS for plates and text (as now), SVG icons inline; moon arc and flame HP are small SVG/CSS. The skill web is a single pannable container: edges in one `Graphics`, nodes as pooled sprites; the glow and pulse are tweens on additive sprites. Culling needed above about 500 nodes.
- Cost: P1/P2 differ only by a palette object, so both can ship as a runtime theme.

## Honest limits of code-drawn art vs a hired illustrator
- Faces and hands are the weak point: eyes read well, but there is no true expression range or animation frames; walk cycles need either bone-style tweens (hood ears, scarf, ear flicks) or many sprite frames. This will look "good vector mascot", not "hand-painted key art".
- Shading is simple: three-stop gradients, one rim, one shade blob. A painter would add form-specific painted light, texture, hair and fabric detail that cannot be authored by formula.
- Silhouette variety is good, but individual poses (a leaping wolf, a hurt Wren) each need to be a new drawing; code only gets one pose per creature plus transforms.
- Enemies are deliberately cold and low-detail (bible rule), which hides the limits; the heroes and boss show them most.
- Raster look after baking at 2-4x is clean but can feel "flash-like"; a bit of baked grain/paper texture would help.

## Self-critique: what still looks cheap
- Trees are still lollipops (trunk plus circle canopies); hollow trees are especially balloon-like even with the ragged edge. Need hand-drawn silhouettes with branching and roots.
- Ghost wolves read a bit like cream foxes/dogs: the head and muzzle are too small and the body too even; legs fade to mist but the mist itself is a mask, not drifting wisps. Ravens are pretty but pink-ish in P1 (reads dove, not raven) and the wing shape is one repeated feather.
- Enemies are grey-on-grey by rule; on the creature sheet they are readable, in the run scene the fell wolf and crawler are less eye-catching than the heroes (intended, but crowds of 100 would need a rim light check).
- Wren's pose is symmetric and stiff; Elias's candle-wheel is just a ring.
- The Elder Treant is a happy-sad stump with arms; the bible's three phases and the hollow chest glow are only hinted.
- Ground texture is thin: flat gradient, subtle noise, scattered tufts. There is no path, no depth change, no props with story except one grey well.
- HUD and skill web icons are chunky generic glyphs (wolf head looks like a cat); node icons below about 20px are mush. The tree is procedural: real branches need authored layouts and names. Panel text is placeholder.
- PNGs are palette-reduced (PNG8, 256 colours) to stay under 350KB: slight banding in glows is an export artefact, not the design.
- Fonts are Windows system fonts (Georgia, Segoe UI Black); ship self-hosted OFL fonts instead.

## Where cheap upgrades would help most (ranked)
1. Commission or find (licensed) hand-drawn key art for Wren, the wolf and the Treant only; keep code art for the rest. This lifts the whole game's feel for the cost of three pieces.
2. A single hand-made grain/paper texture and a painted ground tile set (8-12 tiles) beats any amount of code noise.
3. Animation: scarf and ear tweens on Wren, wolf lope bob, raven wing flap, enemy squash/stretch on hit; this adds more "premium" than extra detail.
4. Hand-drawn tree and prop silhouettes (10-15) in grey and colour pairs.
5. Particles with soft sprites (dust, embers, leaf burst on restore) tuned for the colour-returning moment.
6. A proper sound pass for the same moment (the bible's "colour floods back" beat).

## Fit check
Every element follows docs/IDENTITY.md and docs/BIBLE.md: grey Hollow, colour-returning light, vein corruption, spirit-thread XP, lantern HP, moon-arc timer, summoner-only weapons (wolves, ravens, orbit, bolts), evolution gold reserved. Mechanically, the HUD maps to existing systems (HP, timer, XP, 4 weapon slots, one ability with a cooldown, reroll/banish, tree currencies gold and shards, locked nodes with progress); Blightbulb, Thornspitter and Moss Mourner come straight from the bible's Chapter 1 list. P1's cream-amber wolves deviate from the bible's moon-blue and would need Matt's OK.
