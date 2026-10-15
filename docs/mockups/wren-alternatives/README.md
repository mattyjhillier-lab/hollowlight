# Wren alternatives: three new takes (static mock-ups, not game code)

Chunk: "try a different take on her". Hollowlight Style v1 stays locked (L2 tinted outline, H2 soft gradient + rim, P1 chibi, W2 textured ground, G1 lantern pool + G2 trails, mood P1 Warm Lantern). Only this folder was written; `wren-sheet/` and `style-lab/` are imported, never edited. Matt's update: takes may depart from the bible if they fit the Hollow, the Ghost Wolves / Pack Howl and the style. Take C does.

| File | What |
|---|---|
| `wren-compare.png` | v1 + A + B + C: big (same scale) and at true 60px / 40px, names, pros/cons |
| `wren-a-sheet.png` `wren-b-sheet.png` `wren-c-sheet.png` | turnaround (front, 3/4, side, back), 3 expressions, key props, black silhouettes incl. run + 60px + 40px, hex callouts, code legend |
| `wren-a-actual-size.png` (b, c) | real 1280x720 and 390x844@DPR2 battle frames (2 ghost wolves + amber threads, raven, Fell Wolves, root crawlers, gems, damage numbers), 1:1 and 3x, honest "what survives" note |
| `takes.mjs` | the three parametric drawings `wrenA/B/C({view, expr, run, sil, dir, bare...})` plus shared `knit()` soft-knit ribbon, `lamp()`, face-on-a-sphere |
| `sheet.mjs` `actual.mjs` `compare.mjs` `build.mjs` | page builders. `node build.mjs [sheet\|actual\|compare] [A\|B\|C]` (local Chrome via CDP, Node built-ins only, no deps). `actual.mjs` holds a copy of v1's `gameFrame` with the Wren drawer injected |

## The three takes

**A "Lantern Keeper"** (tall, calm). Taller chibi (about 133 units vs v1 112; head about 40% of height), long patched teal coat that trails, lantern on a crook staff beside her head, open face under a brim cap with two ear-flap lappets and one floppy ear. Chunky knit scarf with V-stitch rows and cream bands.
**B "Pack Pup Wren"** (small, round, huggable). About 101 units, head about 55% of height, round puffy parka, knit beanie with round ears, fat amber scarf, striped mittens, small jar lantern, and a ghost-wolf pup asleep on her shoulder (amber thread at its neck).
**C "Pelt Walker"** (BOLD departure, quiet, eerie, tender). She wears her pack's alpha as a wolf-head hood and pelt mantle; the face is a void with two amber glints; no scarf, no ear-hood, no hand lantern. Amber lives in stitched paw prints, loose threads from her fingers (what the wolves follow) and a bone-cage ember floating beside her on a thread.

Face fix (all three): v1's fur ring + shadow ring around a small face disc made the visor. A has no ring (cap on top, face, open chin); B uses a beanie, not a hood; C makes the dark opening the point (no outline ring, muzzle pointing out of the brow).
Scarf fix (A, B): `knit()` gives a scalloped fuzzy edge, V-stitch rows, cream bands and a frayed fringe, so it reads as knit not a strap (at 40px it still reads as a streak; the knit is a 60px+ detail).

## Changes vs the bible (and why they fit)
- A: lantern moves from hand to a staff; hood ears become one floppy ear; coat patched. Fits: she "keeps the light"; the lantern is the Hollowlight idea made carryable.
- B: hood becomes a beanie; lantern becomes a small jar; a ghost pup rides on her. Fits: "talks to her wolves, afraid of being alone again": the pack is physically on her; the pup is the same cream-amber as the wolves, with the amber neck-thread from the bible.
- C: drops the amber scarf and the lantern in hand, wears the alpha's pelt. Fits: her pack died shielding her; wearing the pelt keeps them close; "wolves form out of the scarf trail" becomes "wolves unravel from her amber threads/paw stitches". Pack Howl: head-back with the wolf-head hood = a howling wolf silhouette, threads flare. Bible amber (#e8b86d scarf only) moves to threads and paws.
- All: ear/hood, amber and lantern remain optional hooks; the Hollow idea (light = warmth) is carried by the warm glow of the lantern/ember/pup against cool teal, blue and pelt grey.

## Honest ranking (1 = best)
| | A Keeper | B Pup | C Pelt |
|---|---|---|---|
| Appeal | 2 | 1 (cutest, but a bit sweet) | 3 (cool, less warm) |
| Uniqueness at 40px | 2 | 3 (round blob) | 1 (wolf-muzzle head over dark body + tail + ember) |
| Emotional fit (bible: tender, quiet, a bit sad) | 2 | 1 (pup) / 2 | 1 for sad, 3 for tender-cute |
| Animation in code | 2 (staff sway, coat tail, scarf) | 1 (simple round parts) | 3 (floating ember, threads, fur tail, many pieces) |
| Build effort | 2 | 1 (fewest parts) | 3 |

Overall honest take: **C is the most memorable and most "Hollowlight" (the one that makes a screenshot people remember), B is the safest emotional hit, A is the most readable hero but the least surprising.** Risks: C may read as "a wolf" at a glance and hides her face (she needs a separate UI portrait); B is the smallest hero and easiest to lose in a swarm; A is about 20% taller than v1 (hit-box / scale choice) and its lantern sits at ear height, so the "dot above the head" tell is weaker than hoped (the pole is thin at 40px).

## What I would combine
- C's pelt-hood idea + A's open face: a wolf-ear hood (not full wolf head) with her face visible and the pelt as a mantle/trail, so she is unique but still the warm, readable face of the game.
- B's pup as an optional companion that appears at idle / level-up (a living 40px cue) on any take.
- A's staff-lantern or C's floating ember (both keep the lantern out of her hands and give a clean light dot beside her).
- Knit scarf from `knit()` only where a scarf survives (A/B); keep a long amber streak in motion because the bible's 40px tell is the streak.
- Recommendation: Matt picks one of C (bold) or B (safe); the next small chunk would be that take's turnaround refinement + animation strip. Waiting for Matt.

## Honest limits
- Static mock-ups: the 3/4 and side views use a sphere-projection trick (same as v1); mirroring flips the rim light.
- Same battle frame and positions as v1 `wren-actual-size.png`; the figure is scaled with the same 112 units = 60px, so taller/shorter takes really are taller/shorter.
- PNGs go through the v1 recompress (PNG8 fallback), mild banding is the cost of the 350KB cap.
- No new dependencies; no network; system fonts only.

Fit check: all three keep Hollowlight Style v1 and the Hollow/warm-light identity, work with Ghost Wolves and Pack Howl, and stay readable by silhouette at 40-60px.
