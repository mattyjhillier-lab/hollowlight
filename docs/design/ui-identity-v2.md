# UI identity v2: three refinements of Lantern Glass (DESIGN, awaiting Matt; NOT in LOCKED)

Date 2026-10-16. Matt on round 1: "We are on the right track but it can be better" (fonts and kit). So round 2 keeps the locked lantern, thread, brass and wick world and the v1 voice. It does not restart. Take 1 is a much richer version of round 1. Takes 2 and 3 are bolder ways to say the same idea in a different material.
Research: docs/research/34-ui-round2.md. Pictures: docs/mockups/ui-identity-v2/ (README there). The background in every picture is a real capture of the live game (frames/).

## 1. What was wrong with round 1 (diagnosis)
1. DRAWN BY A DIFFERENT HAND. The heroes and enemies use thick tinted outlines (L2), soft gradients with a top-left rim light (H2) and chunky round shapes (P1). The round-1 kit used 1 px brass hairlines, square corner brackets and flat fills. No part of it shared the sprites' outline, rim light or roundness, so it looked like a skin laid on top of the game rather than part of it.
2. NO LIGHT SOURCE. The game's signature is a cool blue-grey Hollow lit by a warm lantern pool. Round 1 was brown-black glass lit evenly from nowhere, so it lost the one colour idea the whole game is built on.
3. BOXES. Rectangles with brackets. Nothing in the world is a rectangle.
4. TYPE. Letter-spaced capitals in the display face read as generic fantasy. The wordmark was only a typeset font.
5. ICONS. Thin line icons, unlike the painted creatures.
6. THE THREAD WAS ONLY A DASHED LINE. In the game, thread and trails glow. In the kit they were a grey hairline.
7. ONE MATERIAL AT ONE WEIGHT. Every surface was the same plate, so nothing stood out as the important thing.
The direction was right (lantern-craft, wick state, thread signature, plain label plus whisper). The rendering was not.

## 2. Rules all three takes share
- Same structure, copy, keys and information as round 1 and the live build. The results screen keeps the locked one-screen layout (R1-R5). Gold stays for evolutions and dawn. Defeat dims, it is not red.
- Style v1 applied to the UI: every frame has a tinted outline (a dark shade of its own fill), a soft gradient with a top rim light, rounded chunky shapes, a little hand-wobble, and light that bleeds out from a source.
- Painted icons (new, shared by all takes): same recipe as the sprites (tinted outline, gradient, rim highlight), not line icons: wolf, orbit, bolt, raven, boots, heart, flame, coin, shard, lock. Built in lib.mjs.
- Custom WORDMARK per take: seven code-drawn letter skeletons (H O L W I G T, the only letters in HOLLOWLIGHT), each treated in that take's material. No font is used in the logo.
- Text rules met in every frame (measured.txt): no overflow, no text under 12 px, smallest target 44 px, no scroll on results or pause. Contrast of key text pairs is 5.2:1 to 12:1 (README).
- Reduced motion: all motion hooks below are decoration only; under Calm/OS reduced motion they become fades.

## 3. The three takes
### TAKE 1 "LANTERN GLASS, LIT" (t1-*.png): round 1, painted by the same hand as Wren
Concept: every panel is a pane of the lantern. It is cool Hollow-blue glass, lit warm from a small brass lantern cap at its top, held in a chunky brass band with a dark tinted outline and a bright top edge. It is the round-1 skeleton redrawn in the game's art style.
Kit (t1-kit): panel = rounded glass with a lantern cap and a warm light cone below it, plus glass grain and streaks. Button = lantern-glass lozenge; primary is lit glass (amber, dark text) with a flame bead; secondary has an unlit wick bead that lights on focus. Card = arched lantern window hanging by a short glowing thread from a dashed thread rail; EVOLVE card is gold-lit glass with a painted wax seal; NEW is a teal swallow-tail flag. Divider = glowing dashed thread with a knot bead. Pips = knotted beads on a thread. Toggle = glass chimney with a flame bead. Tab = brass tag. Tooltip = glass tag hanging from an eyelet. Wick indicator = lit / ember / dark, with three different shapes.
Type: the locked pair (Hollowlight Chancery = Fondamento, and Alegreya Sans), used better. Display face in MIXED CASE for titles, names and buttons (no letter-spaced display caps); small caps only in the body face for kickers; numbers always in the body face; italic display for whispers. No new font bytes.
Wordmark: chunky brass letters with tinted outline and rim light. The two Os are lit lanterns with a flame inside. The I is a candle with a live flame. A glowing thread with a knot runs underneath. It says the name: light inside the hollows.
Motion hooks: the cap flame flickers; cards swing in on their threads (+-2 deg settle, 300 ms) and ignite one by one 60 ms apart; focus lights the wick bead (120 ms); the light cone breathes very slowly. Sound hooks as in v1 (ui_focus wick tick, ui_confirm low chime, card_ignite).
Honest critique: the safest and closest to what Matt already approved. It is ownable through its wordmark, lantern caps and the cool/warm light rather than through a new material. Weak spots: the arched cards plus hanging thread take about 40 px of height (they drop the rail and thread on phones); brass on brass can look busy if every element gets the full band (keep the full band for panels and cards only; chips are already lighter); the live SVG wobble filter costs paint time on many elements, so the build should BAKE the wobble into static SVG frame paths (border-image or inline SVG, made once at build time), never run the displacement filter live. Build cost: S-M, mostly a rework of kit.css. It ages well because it is calm and built from the world's own objects. Fits HUD A directly (same brass, cream, flame); HUD A does not need reopening, though a later polish could give the HUD plates the same rim light.

### TAKE 2 "LEADLIGHT" (t2-*.png): windows of the Hollow, lit from behind
Concept: every surface is a leaded window. The dark lead lines play the part of the outline. A border of glass pieces COLOURS UP near the light source and stays Hollow-grey far from it, which is the game's "colour returns" idea turned into UI. Text sits on a calm frosted centre pane.
Kit (t2-kit): panel = window with a lit rose roundel at the top; the border pieces take their colour from distance to the light. Card = arched window; EVOLVE uses gold pieces; NEW uses teal pieces; the medallion is a rose window. Button = leaded tile with a separate jewel piece for the flame, so primary is amber glass and secondary is Hollow-grey glass. Pips = leaded diamonds. Divider = lead came with a lit diamond. Toggle = a two-pane window where the lit pane is ON. A small script draws each frame once, sized to its element.
Type: Alegreya 800 (display, mixed case; it has real bold weights, which fixes Fondamento's single weight) with Alegreya Sans body and Alegreya italic whispers. Both OFL with no Reserved Font Name. About +60-75 KB of font, or reuse Fondamento for 0 KB.
Wordmark: thick lead outline with glass segments; the letters go from Hollow-grey (HOL) through cool blue and teal to amber and gold (LIGHT), so the name itself shows colour returning. On the title it could light up letter by letter.
Motion: pieces warm up in order from the light source when a panel opens (about 400 ms); on focus the button's jewel lights.
Honest critique: the most conceptually ownable (it is the Hollow mechanic) and the most striking on the evolution card. Weak spots: the many small coloured pieces are busy next to a busy swarm; buttons read boxier and closer to a generic tile; the wordmark segments can read as toy candy tubes; the rainbow border needs strict palette control or it turns into a church window (wrong mood); every frame is generated per size by JS (cheap, but more code than CSS, and it needs a resize path). Build cost: M. It ages well if kept restrained. It does not match the HUD A brass plates, so the HUD would want leaded plates for coherence (that would REOPEN HUD A).

### TAKE 3 "STITCHWORK" (t3-*.png): the lantern-bearer's cloak
Concept: the UI is sewn from the heroes' own cloth: Wren's indigo tunic felt, cream pelt, her amber paw stitches, Elias's patched coat, brass buttons. The amber running stitch glows like the in-game trails. Thread is no longer a symbol; it is literally what holds the menus together.
Kit (t3-kit): panel = indigo felt with a fuzzy hand-cut edge, tinted outline and a glowing amber running stitch, hung by two brass grommets on threads. Card = sewn patch, slightly rotated, pinned with a brass pin; EVOLVE is a gold felt patch with dark text; NEW is a sewn teal ribbon. Medallion = satin-stitch ring. Button = felt tab with a sewing button as the state mark (lit button = chosen); primary is amber felt. Pips = cross-stitches (sewn = owned, dotted = not yet). Toggle = stitched track with a sliding button. Tab = sewn fabric tab. Divider = running stitch with a knot.
Type: Fraunces (SOFT 100, WONK 1, about 700) display, a soft chunky "cosy chibi" serif, with Alegreya Sans body and Fraunces italic whispers. OFL with no RFN. A variable font is heavy, so it would ship as two static instances (about +40-60 KB, to be measured).
Wordmark: cream felt appliqué letters, each slightly rotated, with amber running stitches down the middle and a brass button as the dot above the I.
Motion: stitches "sew in" along the edge when a panel opens (stroke-dash animation); cards drop and settle on their pins; the focus button turns warm.
Honest critique: the warmest and most "made by hand", closest to Wren, and the most unlike any other survivors-like. Weak spots: felt is a texture-heavy look that can read as a kids' craft game, and the bible's tone is bittersweet, not twee; the fuzzy edge needs the displacement filter or baked frames; denim-blue panels sit close in colour to the night ground, so contrast relies on the stitch and the drop shadow; rotation on cards costs a little legibility; Elias's look (brass, candles) fits less well than Wren's. Build cost: M (textures, baked edges, a new font). Ageing: charming, but the most likely of the three to feel "cute" after many hours. It would want a stitched HUD for coherence (that would REOPEN HUD A).

## 4. Comparison
| | T1 Lantern Glass, Lit | T2 Leadlight | T3 Stitchwork |
|---|---|---|---|
| Same hand as the art | High (outline, rim, round, lantern light) | High (lead = outline) | High (cloth is the heroes' own) |
| Ownable / memorable | Medium-High (wordmark, lantern caps) | High (colour returns) | High (sewn UI) |
| Keeps round-1 / HUD A | Yes, directly | Partly (HUD would follow) | Partly (HUD would follow) |
| Readability over a swarm | High | Medium (busy borders) | Medium-High |
| Build effort | S-M, no new font | M (frame script, font) | M (textures, font) |
| Bytes (est.) | about +12 KB CSS/SVG | +3 KB script, +0-75 KB font | +10 KB CSS, +40-60 KB font |
| Perf risk | Low once frames are baked | Low-Med (SVG per frame) | Med (textures + baked edges) |
| Mood | Calm, warm, reverent | Luminous, a little grand | Cosy, tender, crafty |

## 5. Recommendation: Take 1, plus T2's "colour returns" only for the big moments
Take 1 is round 1 grown up: same skeleton and fonts, but painted like the heroes. Matt's "right track, can be better" points here. The refinements that matter most, in order:
1. Same outline and rim light as the sprites on every frame: a tinted dark outline, a brass band and a bright top edge. This single change is what makes the UI look drawn in the same world.
2. Real light: cool Hollow-blue glass lit warm from a lantern cap, not flat brown. This brings back the game's one colour idea.
3. The drawn wordmark with lantern Os and a candle I, used on the title, the loading screen and the store art.
4. Round, chunky lantern-window shapes and painted icons instead of bracketed boxes and line icons.
5. Mixed-case display type, body-face small caps for kickers, all numbers in Alegreya Sans.
6. Glowing thread (dividers, pips, card threads) that looks like the in-game trails.
Borrow from Take 2 ONLY where it means something: the evolution card's border and the Dawn results screen get the leadlight "pieces colour up" treatment, so colour returning is felt at the two best moments. It is not used elsewhere, which keeps it calm. Nothing from Take 3 except the idea that the sewing-button state could be a later skin or cosmetic.

## 6. Fit check
Look and identity: lantern, glass, brass, thread and wick are the Warm Lantern world (HUD A tokens), painted with Style v1 (L2 outline, H2 rim, P1 round, G1/G2 light). The cool/warm split is the P1 mood. Gold is kept for evolution and dawn; cyan and violet are not used in menus (violet only on the Holy Orbit and soul-shard icons); defeat dims. Mechanical sense: no change to information, keys, the order of choices, Blessings, Reroll/Banish, the 250 ms lock or the locked results layout. Conflict check against LOCKED: UI IDENTITY v1 (Lantern Glass + thread) is extended, not replaced, by T1; fonts pairing A is kept by T1 (T2 and T3 would REOPEN the font lock); HUD A stays with T1 (T2 and T3 would reopen it). The wordmark lock (font now, custom lettering parked) would be reopened by choosing any drawn wordmark, which is decision 2.

## 7. Build chunks if T1 is chosen (each needs Matt's go)
U2b kit repaint (kit.css: outline/band/rim/light tokens, baked wobble frames as static SVG, lantern cap, arched card shape, glowing thread, painted icon set in src/ui/icons; ?kit=1 updated; HUD A untouched; tests for allow-lists kept). U3 title + hero select split with the drawn wordmark (SVG inline, about 6 KB). U4 pause + settings. U5 cards (adds the leadlight evolution border). U6 results (Dawn variant gets the leadlight border). Estimated added bytes for U2b-U6: under 40 KB, no new fonts.

## 8. Decisions for Matt (recommendation first)
1. Which take? (Recommended) T1 Lantern Glass, Lit, plus T2's colour-returns border on evolution cards and the Dawn screen only. Or T2 Leadlight (also reskins HUD A, adds a font). Or T3 Stitchwork (also reskins HUD A, adds a font).
2. The wordmark? (Recommended) Adopt the drawn lantern wordmark (T1) as the logo direction and polish it in U3: spacing, cap shapes, an animated flame. Or keep the Fondamento-set wordmark for now (custom lettering stays parked).
3. Next step? (Recommended) U2b kit repaint first (one small chunk: the ?kit=1 page in the new look, no real screen changed), then U3. Or go straight to U3 title, wordmark and hero select.
