# Style Lab: one scene, six 2D styles (static mock-ups, not game code)

The art FAMILY is settled (polished chunky 2D cartoon, P1 Warm Lantern mood). This lab compares the open DETAILS on one identical mini-scene so you can say "S2 lines with S5 shading". Same layout in all six: Wren (wolf-ear hood, amber scarf, lantern), a ghost wolf with luminous trail and amber neck-thread, a raven with letter-paper wing tips, a Fell Wolf taking a '124' hit, a Root Crawler, a tree split down the middle (left grey/veined Hollow, right restored with leaves and flowers), a gem, and a ground patch whose edge glows where the Hollow ends.

Files: `s1-storybook-glow.png` ... `s6-dawn-gleam.png` (1280x720, each < 350KB), `style-lab-overview.png` (3x2 contact sheet, 1920x1080), `parts.png` (every axis option on Wren / a mini ground), `*.html` (self-contained inline SVG, system fonts, no network). Regenerate: `node build.mjs` (six scenes) then `node build2.mjs` (parts + overview). Local Chrome via CDP, Node built-ins only; reuses `../ui-directions/png.mjs` and `../cartoon-polished/{core,pal}.mjs`. The creatures were redrawn in `lab.mjs` (one parametric drawing per creature) because the older `creatures.mjs` is hard-wired to one look and could not take the axes. Scene: `scene.mjs`, parts sheet: `parts.mjs`.

## Axis legend (a style code is one pick per axis)
| Axis | Code | Meaning |
|---|---|---|
| LINE | L1 | thick dark outline |
| | L2 | coloured/tinted outline (a darker shade of each fill) |
| | L3 | no outline, soft edge-light plus a faint dark halo for separation |
| | L4 | hand-sketched wobbly ink (displaced strokes, hatching, misregistered fill) |
| SHADING | H1 | flat cel, one hard shadow |
| | H2 | soft gradient plus rim light |
| | H3 | painterly brush/texture (displaced edge, streak texture, soft two-tone light) |
| | H4 | glossy "rendered" toy look with specular highlights |
| PROPORTIONS | P1 | chibi big-head |
| | P2 | lean stylised-heroic |
| | P3 | elongated storybook (tall thin, big hands and feet) |
| WORLD | W1 | clean shapes |
| | W2 | richly textured painted ground, grass and flower detail |
| | W3 | layered depth: fog, parallax-style back layers, blurred foreground blades |
| LIGHT | G1 | soft lantern pool |
| | G2 | strong back-light, light shafts, long glow trails |
| | G3 | warm bloom, sparkles and motes |

## The six variants
| | Name | Code | One-line read |
|---|---|---|---|
| S1 | Storybook Glow | L2 H2 P1 W2 G1 | The safe warm default: friendly, cosy, closest to the locked P1 |
| S2 | Painted Fable | L3 H3 P3 W2 G3 | Dreamy gouache storybook, tall thin figures, drifting sparkles |
| S3 | Toy Glossy | L1 H4 P1 W1 G2 | Vinyl-toy sheen, bold outlines, loud colour, back-lit |
| S4 | Inked Lantern | L4 H1 P3 W3 G1 | Paper-toned ink sketch with flat colour and hatching; most unique |
| S5 | Heroic Cartoon | L2 H1 P2 W3 G2 | Cel-shaded adventure, dark moody Hollow, strongest hero pop |
| S6 | Dawn Gleam | L3 H2 P2 W3 G3 | My own pick: golden-hour sky, no outlines, glow does the work |

## Honest self-critique, build difficulty, animation, mobile
Build difficulty = authoring cost of the code-defined textures in Phaser (bake SVG or Canvas2D to textures at boot). S = a day or two, M = a week, L = weeks plus risk.

**S1 Storybook Glow (M).** Expensive-looking: tinted outlines make everything feel cohesive and the chibi Wren is the most appealing character here. Cheap-looking: the grass is a repeated tuft, tree canopy reads as separate balls (lollipop), restored ground is a bit video-game-default. Animation: best of the set, because shapes are clean and outlined, so squash/stretch, scarf and tail sway as rotating sub-sprites (scarf = 3 segments), wing flap by swapping two baked wing sprites. Mobile: cheap. Outline and rim are baked into the texture; only a pooled additive glow sprite is live.

**S2 Painted Fable (L).** Expensive-looking: the texture and soft light feel like a picture book, sparkles add wow. Cheap-looking: Wren and enemies get washed out and low-contrast on the Hollow (I had to darken enemies by hand), P3 figures are small and thin on a phone, and the painterly filter is not free. Honest warning: the texture is an SVG filter here, in Phaser it must be baked per sprite once at boot, and edges will look blurry at game scale. Animation: tall thin limbs suit sway but wobble more when squashed; needs bone-style tweens. Mobile: baked textures are fine, but a full-screen grain overlay and many additive sparkles can be costly; cap particles.

**S3 Toy Glossy (M).** Expensive-looking: gloss and bold outlines pop hardest at thumbnail size, the gem and the glossy tree are the best single objects in the lab. Cheap-looking: gloss everywhere fights the "tender, quiet, a bit sad" tone (it reads cheerful mobile game), and a specular dot on every small piece looks plasticky; the W1 clean ground is the plainest in the set and drifts toward the "flat vector" look Matt rejected. Animation: excellent (rigid glossy parts squash nicely); highlights are baked so they would slide with the sprite, which is fine for toys. Mobile: cheapest; bake highlights, no live effects.

**S4 Inked Lantern (L).** Expensive-looking: the most unique look, nothing like a stock mobile game, and the paper tone makes the lantern glow special. Cheap-looking: wobble reads as "rough" rather than polished, which is closest to the E1 ink direction Matt rejected, so it is a risk; characters are small and thin; busy hatching hurts readability in crowds. Also the paper noise made it the heaviest PNG. Animation: wobble should re-roll per frame ("boiling line", 8-12 fps) which is lovely but needs several frames per animation, so the most art per second of animation. Mobile: boiling-line frame sets cost texture memory; use sparingly (hero, boss).

**S5 Heroic Cartoon (M).** Expensive-looking: dark Hollow versus saturated restored green and back-light is the strongest light-is-warmth read and the best at a glance; Wren is readable. Cheap-looking: flat cel plus tinted outline is the most conventional, the dark foreground blades are heavy, and the whole scene is darker than the cosy P1 mood. Animation: very good, flat shapes with one baked shadow tolerate squash/stretch. Mobile: cheap sprites; the back-light and light shafts are a few big additive sprites.

**S6 Dawn Gleam (M).** Expensive-looking: the warm sky, bloom and no-outline glow feel richest and most emotional, the colour-returns idea reads even without line work. Cheap-looking: no outline means enemies need a deliberate dark rim or they sink into the Hollow (fixed here by darkening them), and the bloom washes the hero slightly. Animation: as S1 plus the glow does the heavy lifting; breathing glow tweens are free. Mobile: the bloom and sparkles are additive sprites, so keep a particle cap and a "low effects" toggle.

## Honest ranking (wow + feasibility + uniqueness)
1. **S6 Dawn Gleam**: best mood and wow for its cost, fits "light is warmth", unique palette; fix = a dark rim on enemies.
2. **S5 Heroic Cartoon**: most readable and most feasible; slightly generic and darker than Warm Lantern.
3. **S1 Storybook Glow**: safest and most appealing hero; least surprising.
4. **S3 Toy Glossy**: highest instant pop, cheapest to build, wrong tone (too cheerful and plasticky) for a tender, sad game.
5. **S2 Painted Fable**: gorgeous idea, weakest readability and hardest to build in code.
6. **S4 Inked Lantern**: most unique but closest to a rejected look and the most animation work.

Recommendation: start from S6 and borrow S1's tinted outline on the hero only (Wren L2, world L3), S5's back-light shafts for evolve/boss moments, S3's gem gloss for pickups. In axis terms: Line L3 for world and spirits, L2 for Wren and enemies; Shade H2; Proportions P1 for Wren (appeal) with P2 enemies; World W3; Light G3 default with G2 on big moments. A cheap next chunk: one dark-rimmed enemy sheet on the S6 world, then a 3-frame Wren scarf test.

## Honest limits of this lab
- All six share one drawing per creature; proportions and shading change, but poses are the same, so the comparison is about rendering, not character design.
- Textures here are SVG filters (turbulence, displacement); the Phaser version bakes them to bitmaps, so real results will be a little softer.
- PNGs are palette-reduced (PNG8) where needed to stay under 350KB, which causes slight banding in glows. S4 used a 64-colour palette.
- The tree seam, the grass and the islands of restored ground are simple; the Hollow veins are minimal. Faces are tiny at game scale.
- Fonts are Windows system fonts (Georgia, Segoe UI Black).
- Ghost wolves are cream-amber (P1 deviation from the bible's moon-blue, assumed OK in ART-DECISIONS). Ravens are violet with cream letter-paper tips (bible).

## Fit check
Follows docs/IDENTITY.md (grey drained Hollow, colour returning where light falls, vein corruption on enemies, glowing boundary) and docs/BIBLE.md (Wren's wolf-ear hood, amber scarf and lantern; ghost wolf with amber neck-thread; violet raven with paper tips; Fell Wolf ribby with head low and tail straight; Root Crawler with thorn horns). Gold stays out of the world; amber is the lantern and light. No Spirit Hunters art, names or layouts.
