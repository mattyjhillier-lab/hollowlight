# Wren v2: Pelt Walker + ghost wolf pup (static mock-ups, not game code)

Chunk: "Wren v2 only". Matt's pick: Take C "Pelt Walker" plus a wolf pup. Hollowlight Style v1 stays locked (L2 tinted outline, H2 soft gradient + rim, P1 chibi, W2 textured ground, G1 lantern pool + G2 trails, mood P1 Warm Lantern). Only this folder was written; `wren-alternatives/`, `wren-sheet/`, `style-lab/` are imported, never edited. No deps, no network, system fonts.

| File | What |
|---|---|
| `wren-v2-sheet.png` | turnaround (front/3-4/side/back with pup), 5 glint/posture/ember/pup states, pup turnaround + 5 pup states, key props, black silhouettes (run, 60px, 40px), 12 hex callouts, code legend |
| `wren-v2-animation.png` | idle 4, run 6 (pup following), hurt flash, fade-to-light death, Pack Howl (pup + 2 ghost wolves), code-driven notes, rig + pivot list incl. pup and ember thread |
| `wren-v2-actual-size.png` | real 1280x720 and 390x844@DPR2 battle frames (2 ghost wolves, raven, Fell Wolves, crawlers, gems, damage numbers), 1:1 and 3x, pup placement test, honest "what survives" |
| `wren-v2-in-world.png` | mood scene: hollow/restored boundary, pup, ember wake, pup paw-print trail (mock-up scale, about 200px) |
| `wren2.mjs` | `wren2()` (Wren), `pup2()` (pup), `ember()`; `EXPR` table (glint shape, ear angle, tilt, ember behaviour, pup reaction per state) |
| `sheet.mjs` `anim.mjs` `actual.mjs` `world.mjs` `build.mjs` | page builders. `node build.mjs [sheet\|anim\|actual\|world]` (local Chrome via CDP, Node built-ins). Big intermediate HTML goes to the OS temp dir |

## What changed vs Take C
- Face stays a void with two amber glints, now with depth (radial void, fur fringe over the opening) and 5 glint shapes: round (neutral), angled slits (determined), tilted drooping ovals (worried), upward arcs + faint smile (small smile), squeezed `> <` + a tear (hurt). Howl and death add closed arcs / a glowing mouth.
- Emotion also lives in posture (head tilt/lowering), the pelt ears (prick / droop / flat), the ember and the pup. See EXPR in `wren2.mjs`.
- Ember is now a small bone-cage orb (rib cage around a live flame) instead of a box lantern: rounder, reads as a light dot at 40px. Behaviour: steady (neutral), rises + flares (determined), sinks close + dims (worried), bobs with sparks (smile), gutters (hurt), flares high (howl), sinks to the ground (death).
- The alpha's two forepaws are tied at her throat with amber stitches (explains the pelt). Pelt tail has an amber seam; running adds a soft amber streak.

## Rationale and the unique 40px tell
She is the only thing on screen that is a pale wolf-muzzle head over a dark slender body with a bushy tail, a floating ember dot AND a second small warm light (the pup) bounding at her heel. Tell at 40px: **pale wolf head + dark body + ember dot + a cream pup-bump with its own glow that follows her**. The v1 scarf streak tell is replaced by the pelt tail streak plus the pup trail. The pup is cream-amber (same family as ghost wolves, a touch paler = younger); Wren is cool blue-grey, so warm-vs-cool separates them even at 14px.

## The pup
Tiny ghost wolf pup: 36 units tall (knee high, about 20px at 60px Wren, 14px at 40px), big ears, ember tail tip, amber thread collar (tied to her finger thread: the "leash of light").
- Personality: curious (tilts its head at the ember, sniffs glow motes, watches her face), loyal (always returns to heel, sits on her foot when she stops, presses against her leg when she is worried).
- Idle: sits at heel, tail tip draws small arcs of light, random head tilt, blink. Run: 4-leg bound, ears back, spring-follows a heel point 46-80px behind (about 0.18 s lag), tail-tip ember leaves a short comet. Hurt: ears flat, whimper pose 0.6 s then trots back. Death: it does not fade; it sits where she stood, head up. Howl: head back, tiny rings, wags on release.
- **Placement, recommended: follows at her heel with a trail.** At 40px it is its own separate light-coloured shape. **Alternative shown: riding on her back/shoulder.** It sits on pale pelt, so it merges ("pale on pale") and reads as a lump on her silhouette; it is only good for a close-up or UI portrait. Third option (tucked in the hood) rejected for the same reason.
- Visual link to Ghost Wolves (idea only, no mechanics change): pup grows slightly or gains a second ember tail tip as the weapon ranks up; at evolutions the pup appears with the pack when Pack Howl fires (howls with her); Dire Alpha: the pup wears a tiny version of the alpha's mark. For the abilities workshop.

## Parts list for the code build
Wren (back to front): pelt-tail streak glow, pelt tail (3 seg), legs + boots (2), cape back/lining, tunic with hem stitch and paw stitches (2), mantle with zigzag hem, forepaw ties (2) + bone toggle, hands (2), head group [ears (2, own pivots), hood, side fur (2), void (radial), fur fringe (3), chin, glints (2, swap texture per state), hood muzzle + nose]. Ember: cage sprite + glow + sparks + 6-point rope. Loose amber threads (3) from the left hand.
Pup: ember tail tip (sprite + glow), tail (2 seg), hind legs (2), body, fore legs (2), chest tuft, head [ears (2), tuft, muzzle, eyes (swap), collar thread]. 4 poses (sit, bound, sleep, howl) are texture swaps + a head rotation; eyes swap per state.

## What still looks cheap (honest)
- Forepaw ties read as "clasped hands" at big size. Fix: shorter, angled.
- The side/3-4 views use a sphere-projection trick; the pup front view is the best, the back view is a plain blob.
- Pup poses are sprite swaps, not a true rig; the sleep and howl poses are the weakest drawings. Pup legs do not ghost-fade like the real wolves.
- The hurt frame tint and the death "copy" are filters on the whole figure (fine in code, flat in a mock-up).
- At 40px the glints, the emotion and the paw stitches are gone; the face is a dark dot. The pup can be mistaken for a ghost wolf cub (it should be a cub, but then it must stay at her heel with its glow on).
- Pelt tail and hood are both pale: against the pale Hollow ground the silhouette needs the dark body to carry it.

## 2 tweak options
1. **Warmer Wren**: swap the pelt for a slightly creamier grey (#d8e0e6 with amber-tinted rim) and give the void a faint warm inner edge, so the pelt and the pup share a warm family. Cost: less cool/warm contrast with the pup.
2. **Pup on a longer leash**: make the amber thread collar visible as a short glowing line (real thread tied to her finger) and let the pup trail 70-100px; stronger "pack follows the thread" idea, stronger at 40px, but more sprites on screen.

## Gameplay connection (idea only, needs Matt's approval and the abilities workshop)
Pup brightness mirrors Ghost Wolves rank (dim at rank 0, brighter ember tip each rank), or it sniffs toward the nearest gem/chest as a pure visual hint. Nothing here changes mechanics; the pup is invulnerable, never blocks, and never adds a hit-box.

## Next chunk suggestion
Elias (the next hero) as one sheet in the same format, using this Wren v2 sheet as the template and checking he does not share the "pale hood + dark body" tell.

Fit check: keeps Hollowlight Style v1, the Hollow identity (warm light vs cool grey, ember and pup as the light), reads by silhouette at 40-60px, matches the Ghost Wolves colouring, no mechanics changed.
