# Wren design sheet v1 (static mock-ups, not game code)

Chunk: ONE character, Wren the Orphan, in the locked Hollowlight Style v1 (L2 tinted outline + H2 soft gradient/rim + P1 chibi + W2 textured ground + G1 lantern pool + G2 glow trails; mood P1 Warm Lantern). Nothing outside this folder was touched; `style-lab/` and `cartoon-polished/` are only imported.

| File | What |
|---|---|
| `wren-sheet.png` | turnaround (front, 3/4, side, back), 5 expressions, key props, black silhouettes (incl. 60px / 40px), hex callouts, code legend |
| `wren-animation.png` | idle (4), walk (6), hurt flash (4), death/fade-to-light (5), Pack Howl (5) + how each is animated in code + rig |
| `wren-actual-size.png` | REAL scale: desktop 1280x720 (about 60px tall) and phone 390x844 @DPR2 (about 40px tall) in a mock game frame, 1:1 and 3x nearest-neighbour, honest note |
| `wren-in-world.png` | Wren in the shared style-lab mini-scene at mock-up scale (about 180px, mood only) |
| `*.html` | self-contained inline SVG sources (system fonts, no network) |

Regenerate: `node build.mjs [sheet|anim|actual|world]` (local Chrome over CDP, Node built-ins only, no deps). Code: `wren.mjs` (the character), `common.mjs`, `sheet.mjs`, `anim.mjs`, `actual.mjs` (two-pass: true-size render, then crop/zoom), `world.mjs` (loads a patched temp copy of `style-lab/scene.mjs` with only the Wren call swapped; the original file is untouched), `render.mjs` (CDP + the style-lab PNG recompress / PNG8 fallback; each PNG under 350KB).

## Were the earlier images close-up? Yes.
The style-lab and cartoon-polished mock-up scenes draw Wren about 170px tall. In the real game she is about 60px (desktop 1280x720) and about 40px (390px portrait phone). So this design works silhouette first, detail second. `wren-actual-size.png` is the proof: it renders the real sizes in context (textured ground, 2 ghost wolves with amber threads, a raven, 5 Fell Wolves, a root crawler, gems, damage numbers, a hollow/restored boundary) and magnifies 3x.

## Design rationale (why these shapes read in a crowd)
- Everything else on screen is a quadruped (wolves, crows, crawlers) or a blob. Wren is the only upright, round, pointy-topped thing: a big round hood head with two tall wolf ears on a small round body.
- Colour discipline: a cool desaturated teal hood and coat (sits quietly on both grey Hollow and green restored ground), one saturated amber scarf, one tiny hot lantern flame. Amber is her colour (bible: amber, scarf only), so it appears nowhere else on her except the lantern flame and the darn on one ear.
- Shape language is round, soft, forward-leaning (bible). Outline is a darker shade of each fill (L2), never black, so she feels warm; rim light and the lantern pool make her the brightest friendly thing.
- Emotional read: big eyes, blush and a small mouth for tenderness; hood shadow and the long trailing scarf give the quiet sadness.
- Story props are physical: one ear is folded and darned with amber thread (the pack's light mends her), a stitched paw print on the back of the hood (her wolves), a bone whistle on a cord, a hand-me-down coat with rolled cuffs, rope belt and patch.

## Her unique "tell" at 40px
One long amber streak trailing about 2x her body length behind a small teal, round, two-eared head, with a warm dot at hip height. In the 40px silhouette test it is a pointy-topped blob with a horizontal tail; no enemy or other hero shares that outline. This matches the bible's 40px tell (the amber scarf streak). The folded ear and darn are NOT a 40px tell (lost); they are 60px+ details.

## What survives at actual size (honest)
- 60px desktop: ear points, scarf, lantern glow, hood-vs-ground contrast, round head. Eyes are two dark dots; you can tell she is cute, not what she feels.
- 40px phone: ears as two small bumps, 25px amber streak, 3px flame with halo. The hood loses contrast on bright restored grass; the amber streak and lantern halo do the work.
- Lost: expressions and brows, blush, eye highlights, tinted outline (becomes a soft darker edge), rim light, knit stripes, folded ear and darn, whistle, belt, fringe, paw patch, boot cuffs.
- Consequence: bake sprites at 4x and mip/downscale (never draw at 1x); expressions matter in UI portraits and level-up cards, not in play; widen the scarf about 25% and brighten the lantern halo for the phone zoom.

## Built as code-defined layered vector parts (`wren.mjs`, one parametric function)
`wren({view, expr, leg, lean, sx, sy, tilt, earFlick, armsUp, lanternAngle, scarf{len,amp,phase,sag,ang,glow}, hurt, light, alpha, sil})`. Origin = feet, y up = negative, 112 units tall including ear tips (scale 0.536 = 60px, 0.357 = 40px). The four views come from one head-yaw angle (eyes, ears and face disc project from a sphere), not four separate drawings.

Back to front (each is a sprite/container in Phaser, baked once at 4x):
1. scarf trail: 5 chained segments (ribbon, 3 stripe bands, frayed tip); root pivot at the back of the neck (about 0,-38)
2. legs (2, wool socks) and boots (2, fur cuff); hip pivots (+-5.6,-17)
3. far arm; coat body (belt, patch, buttons/seam, hem stitch); breathing pivot (0,-13)
4. bone whistle and cord (anchor 0,-36)
5. lantern arm (sleeve, cuff, hand), shoulder pivot (+-17,-36); lantern (chain, cap, glass with flame, cage bars, base) with pendulum pivot at the hand (about -33,-33), plus an additive glow sprite
6. head group, pivot at the neck (0,-34): ear far, ear near (pivot at base, +-19,-78, tilt +-14 deg; one folded, one darned), hood sphere (r30 at 0,-60), crown seam, hood shadow ring, fur trim, face disc, fringe, 2 eyes (texture swaps: open, narrow, wide, happy, closed, squint), 2 brows, nose, blush, mouth (6 variants), tear/sweat decals
7. collar (knitted band), front knot, short front tail (pivot at the knot)

Effects are overlays, not redraws: hurt = white/red tint, death = cream-amber tint plus alpha, silhouette = flat fill.

## Honest critique (what still looks cheap)
- Fur trim ring plus big hood reads a bit like an astronaut helmet in front view; the face is small inside it.
- The body is tiny and mostly hidden by the head; hands are stubby circles; no real hand poses (whistling, petting a wolf are approximated or missing).
- 3/4 and side views are a sphere-projection trick: fine at the chosen angles, in-between angles will look slightly off, and mirroring flips the rim light (it should not).
- The scarf is a smooth ribbon: reads as a strap, not soft knit; it needs ripple, fuzz and thickness variation. Its glow trail is subtle in the in-world image.
- Walk swings only the feet (no knees or arms). Death and howl are mostly transforms; the howl wolves in the strip are tiny blobs.
- Ghost-wolf amber threads and Wren's lantern glow share one orange; at 40px they merge (probably fine, maybe good).
- `wren-in-world.png` and the large scenes use a PNG8 or rounded palette to stay under 350KB, so mild banding appears that the live game would not have.
- The "boots" prop tile is an awkward crop.

## 2-3 tweak options (all cheap: one parametric function)
1. Hood: (a) taller, narrower ears, no fur ring (cleaner 40px read, less astronaut); (b) rounder bear-like ears (cuter, less wolf, weaker tell). Recommendation: (a), keep the fold.
2. Scarf: (a) current 2x body length; (b) 2.6x and 30% wider with a cream second stripe (louder tell on phone); (c) short and tucked at idle, long streak only when running (cosier, tell only in motion). Recommendation: (b).
3. Lantern: (a) brass cage lantern (current, most characterful); (b) round paper lantern on a stick (bigger halo, easier at 40px, less detail); (c) bone-and-wire lantern echoing the whistle (unique but dimmer). Recommendation: keep (a), enlarge the halo +30%.
Cheaper variant: drop belt, patch, whistle, fringe and brows (about 6 fewer sprites), 3 expressions only. Richer variant: braid, sleeve fuzz, boot laces, glowing paw prints where she steps, knit texture on the scarf.

## Next small chunk (waits for Matt)
Elias the Priest design sheet with this same pipeline (turnaround, expressions, props, silhouettes, animation strips, actual-size proof). Bible shape: broad square robe with the iron candle-wheel halo; candle-white/cream accent; his 40px silhouette must be clearly different from Wren in the same row.

Fit check: built from the bible and characters.json (amber scarf, wolf-ear hood, lantern, whistle, Pack Howl, Hollow wolves as her kin) in the chosen Hollowlight Style v1, shown at real game scale.
