# Elias design takes: A / B / C (static mock-ups, not game code)

Chunk: "Elias design takes only" (ONE chunk). Hollowlight Style v1 stays locked (L2 tinted outline, H2 soft gradient + rim, P1 chibi, W2 textured ground, G1 lantern pool + G2 glow trails, mood P1 Warm Lantern). Only this folder was written; `wren-v2/`, `wren-alternatives/`, `wren-sheet/`, `style-lab/` are imported, never edited. No deps, no network, system fonts, inline SVG only.

Brief: Elias, one of the two launch heroes. Holy Orbit (lights orbit him), 110 HP, tankier and slower-feeling than Wren, +15% holy damage. Active ability (approved): **Sanctuary: Candle Wheel** (wheel of light planted on the ground, ring of about 80 px blooms colour, he heals inside, orbs lock into the ring for 6 s). Role family: Lightbearer. Tone: tender, quiet, a bit sad; warm light is the only warmth. Must be as unique as Wren v2 and look nothing like her (she is a pointed, low wolf shape in grey-blue/navy with an ember and a pup).

| File | What |
|---|---|
| `elias-compare.png` | Wren v2 + A + B + C: big view (same scale), real-size crops (desktop 60px, phone 40px, 1:1), black shapes at 60/40px, one-line PRO/CON |
| `elias-take-a-sheet.png` `-b-` `-c-` | banner (name, concept, code legend, palette), turnaround (front/3-4/side/back), 3 states, Candle Wheel keyframes (plant, bloom, orbs lock, fade), black silhouettes incl. walk + 60px + 40px, key props, 12 hex callouts |
| `elias-take-a-actual-size.png` `-b-` `-c-` | real 1280x720 and 390x844@DPR2 battle frames with Wren v2 + pup, 2 ghost wolves + threads, raven, 5 Fell Wolves, crawlers, gems, damage numbers; 1:1 and 3x; honest "what survives" |
| `elias.mjs` | `eliasA/B/C({view, expr, run, sil, dir, orbs, ...})`, `flame()`, `orb()`, `orbit()`, `flatRing()`, `wheelFrame()` (Candle Wheel keyframe) |
| `sheet.mjs` `actual.mjs` `compare.mjs` `build.mjs` | page builders. `node build.mjs [sheet\|actual\|compare] [A\|B\|C]` (local Chrome via CDP, Node built-ins only). Re-uses the wren-v2 / wren-alternatives helpers; battle frames are cached in the OS temp dir |

Test-frame note: in the actual-size frames Elias walks beside Wren v2 (88 px / 59 px to her right) only so the two can be compared at true size; in the real game you play one hero. Elias carries 3 Holy Orbit lights (lilac-white, `weapons.json` colour `#e8e0ff`, with a warm bloom).

## The three takes

**A: Keeper of the Wheel** (bell, gentle, closest to the bible). Old candle-bearer in a wide indigo bell robe, white beard, round spectacles, closed-eye calm, hands folded round one small candle. The iron candle-wheel is his lit halo (8 candles), strapped to his back. Cream stole with flame embroidery. 143 units (77 px desktop).
**B: The Lamplighter** (block + pole, human, bold). Stout gravedigger-turned-lamplighter: flat cap, walrus moustache, rust coat covered in patches and four pockets that leak light, a huge lantern-staff with a spade as its foot. Orbs are fireflies that lift out of the pockets. 141 units (76 px).
**C: The Wax Saint** (round column, boldest). He IS the candle: a rose-wax saint with a cream drip-cowl and a flame for hair. An iron ring of flames (the candle wheel) circles him like a collar. The flame doubles as a health read (it shrinks when he is hurt). 130 units (70 px).

## Candle Wheel in each take (keyframe strip on every sheet)
- **A**: the halo wheel comes off his back and is laid flat on the ground: it IS the bible's candle-wheel. Strongest object tie.
- **B**: he drives the spade foot into the ground; a ring of lantern light unrolls from it (8 small lamps + spokes of light). The wheel is made of light, not a visible iron wheel.
- **C**: the ring collar drops to the ground and widens; the 8 flame sockets become the wheel. Same object he already wears.
All three: ground inside blooms green, orbs hover on the ring, heal crosses rise, then the ring dims and the orbs lift away (colour stays). Pure visual; no numbers changed (radius, 6 s, heal stay the approved probe values).

## Honest ranking (1 = best)
| | A Keeper | B Lamplighter | C Wax Saint |
|---|---|---|---|
| Appeal | 3 (busy face, "wizard" read) | 1 (most character: grown-up, gruff, tender) | 2 (cutest, but cute before sad) |
| Uniqueness at 40px | 3 (ring of dots on a bell; spiky halo) | 2 (block + tall pole + lantern dot above the head) | 1 (a rose column with a flame and a ring of dots; nothing else is a candle) |
| Fit with Hollow identity + Candle Wheel | 1 (the wheel itself is planted) | 3 (light-only wheel; but the lantern is the Hollow idea in a hand) | 2 (ring collar becomes the wheel; flame = health) |
| Animation in code | 2 (halo ring + 8 flames, robe sway) | 3 (staff swing, coat, pockets, lantern, orbs) | 1 (rigid column, flame, ring, drips: fewest parts) |
| Build effort | 2 | 3 | 1 |
| Distinct from Wren | yes (bell vs pointed wolf; indigo vs grey-blue) | yes (block + pole) | yes (round column) |

Overall: **B for the person, C for the idea, A for safety.** My pick if Matt wants Elias to be "the grown-up of the cast" (bible): **B**. My pick if he wants the boldest, cheapest-to-animate and best 40px read (the way he chose Wren's Take C): **C**. A is the weakest: closest to the bible but a bearded old man with spectacles and a glowing halo reads as a wizard, and its candle flames become spikes at 40px.

## What I would combine
1. **B's person + C's wheel**: the Lamplighter's lantern-staff head becomes a small candle-wheel chandelier (the ring of 8 flames from C, hung around the lantern); planting the spade lowers the ring to the ground, so the Candle Wheel is a real object AND B keeps his warm human face, pockets and moustache.
2. **C's flame as health**: any take can have a small flame on or beside him that shrinks as HP drops (ties to the lantern-flame HP UI).
3. **A's closed-eye prayer** state as his idle (any take); spectacles optional.
4. Keep the Holy Orbit lights lilac-white with the warm bloom so they never look like Wren's cream-amber ghost wolves or her amber ember.

## What still looks cheap (honest)
- Back and side views reuse the same sphere-projection trick as Wren v2: A's and B's back heads are blank, C's back is a plain column; side views are narrow slabs.
- Key-prop tiles are crops of the same drawing (hard edges); they are not isolated sprites yet.
- A: the face is crowded (glasses + brows + moustache + beard); in 3/4 the two lenses crowd together; halo flames read as spikes in the black silhouette; halo is edge-on (thin bar) in side view.
- B: the moustache hides the mouth so feeling lives in eyes and brows only; one stiff arm on the staff, legs are stubs; pocket light is soft glow dots (sub-2px at 40px); the lantern glass is flat.
- C: arms and mittens form a heart shape in front; hands are blobs; the ring is a perspective ellipse (no true 3D); the drip cowl is one flat shape; pink wax sits close to the orange damage numbers.
- Ability keyframes are simple stills of the idea, not motion: no dust, no spin, small figure, 2-3 px orbs at game size.
- PNGs go through the shared recompress (all under 350 KB); mild banding is the cost of the cap.
- Heights: all three are taller than Wren (122 units): 130-143 units (46-51 px phone). That fits the bible ("Wren about 70 percent of Elias") but the hit-box / scale is a decision for Matt.

## 40px tell, one line each
- A: ring of flame dots behind a wide indigo bell ("circle behind a triangle").
- B: wide rust block + tall pole with a big warm lantern dot ABOVE his head.
- C: rose-pink column + flame on top + ring of flame dots at the waist.

## Gameplay connection (idea only; needs Matt's approval and the abilities workshop)
Holy Orbit lights could be drawn as 2 to 6 lilac-white lights that fill the ring sockets / pockets as the weapon ranks up (visual only). Take C's flame size could mirror HP. Nothing here changes mechanics or the approved Sanctuary numbers.

## Next chunk suggestion
Matt picks one take or the B + C combination; the next small chunk is that hero's refinement sheet (clean back/side views, isolated prop sprites, animation strip). Waiting for Matt.

Fit check: keeps Hollowlight Style v1 and the Hollow identity (warm light on a cool grey-blue world, light as the only warmth), reads by silhouette at 40-60 px, distinct from Wren v2 and from each other, matches the approved Candle Wheel ability and Holy Orbit weapon, changes no mechanics.
