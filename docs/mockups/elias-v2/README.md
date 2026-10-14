# Elias v2: The Lamplighter + Candle Wheel (static mock-ups, not game code)

Chunk: "Elias v2 only". Matt's pick: Take B "The Lamplighter" plus Take C's flame ring; the lantern becomes a small candle-wheel chandelier on the staff, and the spade lowers it to the ground for Sanctuary: Candle Wheel. Hollowlight Style v1 stays locked (L2 tinted outline, H2 soft gradient + rim, P1 chibi, W2 textured ground, G1 lantern pool + G2 trails, mood P1 Warm Lantern). Only this folder was written; `wren-v2/`, `elias-takes/`, `wren-alternatives/`, `wren-sheet/`, `style-lab/` are imported, never edited. No deps, no network, system fonts, inline SVG only.

| File | What |
|---|---|
| `elias-v2-sheet.png` | turnaround (front/3-4/side/back with flame ring), 5 states, wheel mechanism (carry/lower/plant) + flame-ring rank parts, key props, black silhouettes (front/side/back/walk, 60px, 40px), 12 hex callouts, code legend |
| `elias-v2-animation.png` | idle 4, walk 6 (flame ring orbiting), hurt 3, fade-to-light 5, full CANDLE WHEEL 10 keyframes (ready, lift, plant, lower, open, bloom, lock, hold, fade, after), code-driven notes, rig + pivot list |
| `elias-v2-actual-size.png` | real 1280x720 and 390x844@DPR2 battle frames (Wren v2 + pup, 2 ghost wolves, raven, 5 Fell Wolves, crawlers, gems, damage numbers), 1:1 and nearest-neighbour zoom, honest "what survives" |
| `elias-v2-in-world.png` | mood scene: hollow/restored boundary, Candle Wheel blooming colour with 3 orb flames locked in the ring (mock-up scale, about 195px) |
| `elias-v2-with-wren.png` | the two launch heroes: big view, 1:1 crops, black shapes at 60/40px, contrast table, honest verdict |
| `elias2.mjs` | `elias2({view, expr, run, sil, dir, orbs, wheel:{low,open,R,lock}, staffX, staffUp, ...})`, `wheel()`, `orbFlame()`, `orbitRing()`, `bloomDisc()`, `hollowDisc()`, `EX` states, `PE` palette |
| `sheet.mjs` `anim.mjs` `actual.mjs` `world.mjs` `withwren.mjs` `build.mjs` | page builders. `node build.mjs [sheet\|anim\|actual\|world\|withwren]` (local Chrome via CDP, Node built-ins). Run `actual` before `withwren` (frames are cached in the OS temp dir; `withwren` renders them if missing) |

## What changed vs Take B
- Lantern -> chandelier: the pole is now 8.8 units thick (was 5; 3px at 40px, was 2px). A brass wheel (ring of 6 candles on a collar hub) rides the pole just under a small glass lantern. The wheel is the bold shape: a wide gold crown above and beside his head.
- Pocket light is the readable coat tell: each of 4 pockets has a bright slit, a vertical spill fan and motes, plus a stub candle in the breast pocket. At 40px it reads as 3 warm patches, not a brown lump.
- Holy Orbit lights are now a ring of small lilac-white FLAMES (C's flame ring, `#e8e0ff`) circling the waist with comet trails, not fireflies.
- Flat cap (was helmet-like): lower crown, higher bill, eyes below the brim; brows thinner. The kind face now reads kind.
- Proper side profile (nose, forward bill, drooping moustache, ear) and a real back view (cap seam, nape hair, big patch, candle-strap bandolier, spare candles poking above the shoulder, snuffer at the hip).
- The ability is animated (10 keyframes with code notes), not stills. Fade-to-light leaves the staff planted and lit (a grave-lamp).

## Candle Wheel (visual only; radius 80px, 6s, heal and 60s cooldown unchanged)
He lifts the staff, drives the spade in, the brass collar slides down the pole and the ring opens from 21 units to 149 (80px at 60px scale); grey ground wakes into restored grass from the centre out; his 3 Holy Orbit flames fly from the waist ring into sockets 0/2/4 (lilac among the gold candles); 6 s hold with heal crosses; then the ring dims, the flames lift back to him, the collar slides up. The grass disc stays (the Hollow identity: colour is kept). Ring centres on the pole (planted at x 40, in front of his feet).

## Rationale and the unique 40px tell
A tall warm block with a gold crown on a thick pole. Tell at 40px: **wide rust block + a bright brass crown of candle dots ABOVE and BESIDE his head on a 3px pole + warm pocket patches + 3 lilac sparks circling the waist.** Wren is a low, pointed, cool grey-blue wolf-hood with an ember and a pup bump; Elias shares nothing with her silhouette (block + crowned pole vs low pointed wolf), colour (rust/brass/lilac vs grey-blue/navy/amber), personality (grave, gentle, slow vs wary, quick, curious) or light (steady, high, held in place vs moving, low, trailing).

## Parts list for the code build
Back to front: wheel-back (half ring, 3 back candles, light spokes) > pole (wood + 3 iron bands) > spade (blade + foot-rest) > lantern top (cap, glass, flame, glow) > spare-candle bundle (side/3q/back) > trousers + boots (2) > coat (patches, hem shade) with buttons, collar, 4 pockets (each: flap, glow sprite, spill fan sprite, 2 motes), breast stub candle > far arm + hand > near arm + hand (on the pole) > head [hair nape, ears (2), skull, cap + bill + button, cheeks, nose, eyes (swap per state), brows (2), moustache (2)] > collar hub > wheel-front (front candles, front spoke) > flame ring [3 to 6 orbit flames, back / front halves]. Textures swapped by state: eyes (arc/open/x/closed), brows, moustache lift. Ground wheel = one scalable ring sprite + candle sockets + a restored-grass disc mask. Pivots: root (0,0), body squash (0,-13), neck (0,-60), near hand (47,-48), ring c (47,-104) r 21, orbit c (0,-46) R 52.

## What still looks cheap (honest)
- Near arm is a stiff horizontal sausage to the pole in front and 3/4 views; the hand is a plain circle.
- Back head is a dome with seam lines (reads "cap from behind", no ears); side view face is plain.
- Dropped orb flames in the black silhouettes read as stray drops; fine in colour.
- At 40px the crown's 6 candles merge into one gold bar and the face, patches and buttons are gone (see actual-size note).
- Ground wheel is a plain gradient disc with tufts; the in-world scene's own grass is richer. The pole sits behind the body when planted unless staffX >= 38.
- Animation is keyframes of one drawing (squash, tilt, filters), not hand-drawn frames. Heal crosses, dust and orb arcs are simple.
- Elias is the tallest hero (75px vs Wren 65px) and wide: a hit-box / scale decision for Matt.

## 2 tweak options
1. **Smaller crown, bigger pole**: 4 candles instead of 6, wheel radius 17, lantern top removed so the crown is one bold gold shape; reads cleaner at 40px, loses a little of the "chandelier" charm and the 6-socket ring.
2. **Warmer, shorter Elias**: shrink to about 128 units (69px), coat a deeper brown (`#8a4e34`), drop the breast stub candle. Closer to Wren's height (better duo balance, smaller hit-box), less dominant.

## Gameplay connection (idea only, needs Matt's approval)
Orbit flame count follows Holy Orbit rank (2 to 6, visual only). Pocket glow could follow HP (dim when low). Nothing here changes mechanics or the approved Sanctuary numbers.

## Next chunk suggestion
Pick the 40px fixes (tweak 1 or 2) and build the two launch heroes' sprites for the game (RunScene textures), or do the enemies/boss design chunk if Matt wants art before code. Waiting for Matt.

Fit check: keeps Hollowlight Style v1 and the Hollow identity (warm light on cool grey-blue, light as the only warmth, ring blooms colour that stays), reads by silhouette at 40-60px, distinct from Wren v2, matches the approved Sanctuary: Candle Wheel and Holy Orbit weapon, changes no mechanics.
