# Enemies ART round 2: three bestiary takes (DESIGN ONLY, NOT locked, awaiting Matt)

Date 2026-10-17. Why: Matt rejected the round 1 enemy mock-ups (docs/mockups/enemies-sheet/, commit 285caa9): "I want the enemies to look a whole lot better than this: they look really generic and horrible right now", same for the bosses/minibosses, and "the design needs to be a lot better". He wants them "more like Spirit Hunters (his favourite reference) but still keeping the Hollowlight look". This round is ART ONLY: the gameplay roles, behaviours, waves and gates in docs/design/enemies-v1.md are kept as they are and may be reused; nothing in docs/LOCKED.md is changed; no game code changed.

Mock-ups: docs/mockups/enemies-art2/ (README there; open `index.html` for the gallery).

| Sheet | What |
|---|---|
| `00-diagnosis.png` | why the live enemies and round 1 read as generic, beside the Wren v2 bar |
| `a1/b1/c1-bestiary.png` | per take: all 9 pieces at LARGE detail (about 3-5x true size), true size day + night, black silhouette, phone size, hook, moves |
| `a2/b2/c2-motion.png` | per take: walk x4, TELL, HURT, DEATH x3 for the 7 creatures |
| `a3..a6 / b3..b6 / c3..c6-world-*.png` | per take: the whole roster composited at TRUE size on the real build frames (1280x720 night 0:30 with Wren, 11:30 grey light with Elias; phone 844x390 @2x night + day) |
| `99-compare.png` | the three takes side by side, same line-up, 1:1, day + night strips on real ground, 30 px silhouettes |

## 1. Diagnosis (short): why round 1 and the live build read as generic
1. **Template animals.** Realistic side-view wolf / crow / spider templates (thin legs, small heads) while the heroes are P1 chibi (big head, round). Two proportion systems in one game = the enemies look borrowed.
2. **Flat value, one material.** One plum-grey fill + a thin rim line. The heroes have 3-4 materials each (pelt, cloth, bone, light). Same-value bodies melt into the grey Hollow ground.
3. **Detail = rib stripes and spikes**, the "skeleton dog" cliché; no texture language of their own.
4. **No signature hook.** Nothing nameable from a black silhouette. Each hero carries one story object (Wren's ember cage + pup, Elias's candle wheel); the enemies carry nothing.
5. **Eyes are stickers.** Two identical ember dots on every type, no socket or void, no shape change: they read as "red dots", not as "hollowed".
6. **No story, no world link.** Nothing shows what the Hollow did to them or ties them to the Treant, the light or the colour-restoring myth.
7. **Live build is worse.** The in-game enemies are stage-1 canvas blobs (wolf 18 x 12 world units): at true size a dark smear + an eye. The new art is a full replacement, not a polish pass.

Fixes used in every take: P1 chibi proportions like the heroes; 3-value material design (dark body / mid secondary / one pale or dark signature piece); one nameable hook per creature; a socket or melted hollow so the face reads as EMPTY with ember eye-points inside; a family story; a death that gives colour back (small warm mote, visual only).

## 2. Research: what makes bestiaries memorable (labels: OFFICIAL / COMMUNITY / OPINION)
**Spirit Hunters: Infinite Horde (Matt's reference).** What could be verified:
- OFFICIAL (store pages, e.g. dekudeals/Nintendo eShop copy): "over 200 different types of monsters" with a lore Beastiary; 9 maps with 3 challenge levels each. https://www.dekudeals.com/items/spirit-hunters-infinite-horde
- COMMUNITY (Steam discussion; the replying player is not confirmed as the developer): "All minibosses are larger special versions of normal enemies", and they spawn in the zone where the normal version lives. https://steamcommunity.com/app/1914580/discussions/0/3457094584923738513
- COMMUNITY/OPINION (review, Buried Treasure 2022): praised "cartoon art"; player and enemy art is LARGER than Vampire Survivors without oversized hitboxes; Hard Mode adds all-new enemies and bosses. https://buried-treasure.org/2022/08/spirit-hunters-infinite-horde/
- OPINION (Seasoned Gaming 2023 review): a boss "traps you in a cage of spears", a fair, beatable set piece. https://seasonedgaming.com/2023/07/21/review-spirit-hunters-infinite-horde-unending-spirit/
- OPINION (aggregated player reviews, vaporlens; auto-summarised, weak signal): players praise "inventive sprites" and animations. https://vaporlens.app/app/1914580/spirit_hunters_infinite_horde
- **Could NOT verify** (no screenshots/videos were opened in this session, no wiki with an enemy list exists): exact enemy shapes, palettes, outline weights, animation frame counts, per-map families. Everything below about its look is my own recollection and is OPINION; Matt should correct it from his play time (question 1 in section 9).

Lessons taken (inspiration only; no names, shapes, palettes or designs copied):
| # | Lesson | Label | How each take uses it |
|---|---|---|---|
| L1 | Each map has its own FAMILY of creatures; variety comes from many types that share one look | OFFICIAL (200+ types, per-map) + OPINION | each take is one family with one material + one face rule |
| L2 | Big, readable, chunky cartoon bodies (art bigger than VS, hitboxes not) | COMMUNITY | enemies drawn ~hero-sized (wolf ~22 world units long), hitboxes stay sim-side |
| L3 | Elites/minibosses = a bigger SPECIAL version of a normal enemy you already know, in its zone | COMMUNITY | the miniboss in every take is the take's wolf, x1.7, + one crown feature + a third eye (locked amber boss eye) |
| L4 | Personality through motion and expression, not gore | OPINION | faceless rule kept: emotion moves to posture, eye SHAPE (almond -> slit on the tell -> squint when hurt), and secondary motion (tail, rags, smoke) |
| L5 | Swarms stay readable because the family has one value structure and few internal lines | OPINION | 3-value design; detail lives on the signature piece, bodies stay simple |
| L6 | Bosses are fair set pieces with a readable tell | OPINION (review) | tells are red-orange ground decals (locked colour) + a body cue unique to the take |

Other references (OPINION unless noted, and research 37 for the cited readability facts): TF2's role silhouettes and rim-light edges (OFFICIAL, research 37 row 1); Hollow Knight (faceless masks with dark eye holes: **a risk for Take A**, see weak spots); Don't Starve and Cult of the Lamb (cute-creepy, cosy-sinister, a single strong material per family); Darkest Dungeon (big value blocks, few colours); Hades (pose + silhouette + a glowing tell); Brotato (one shape and one colour per enemy = instant read); Vampire Survivors (stock sprites: shows that variety alone is not identity).

## 3. The three takes (each a complete family look)
Rules every take keeps (from LOCKED/BIBLE): faceless with ember eye-points (WL6b look: ember halo + cream core, drawn above the night), cold bodies (no warm colour on any enemy body), red-orange #ff5a3c ONLY for eyes and tells, minibosses/boss use the locked amber eye #ffb84a, Style v1 (L2 tinted outlines, H2 soft gradient + COLD rim light, P1 chibi), each creature its own vector definition, no gore, no red bodies, enemies opaque (never translucent like the friendly ghost wolves), enemy crows keep a DARK beak.

### TAKE A: HUSKS (recommended)
Story: the Hollow drank the colour out of the forest animals and kept them walking; their faces are gone, each wears a pale lichen-bark HUSK grown from the Elder Treant's bark, with an empty void where the eye-points float. Ink got in through their paws.
Look: plush slate-indigo fur/feather, pale bark husk, ink "socks" and veins, lichen spots. Shape language: soft round body + one hard pale mask.
| Piece | Name | Hook (black-silhouette test) | Moves |
|---|---|---|---|
| Fell Wolf | Fell Wolf (husk) | long pale husk snout held LOW, frosted scruff, torn ear, ink plume tail | hunched slinking lope; hackles rise on the tell |
| Grave Crow | Grave Crow (one-eyed) | puff body, ragged V wings, ONE eye in a cracked eggshell visor, dark beak | jerky 2-beat flap, hang, head tilt |
| Root Crawler | Rootback | badger carrying a stump shell with 3 broken root prongs | heavy plod, rocks, roots drag |
| Ranged | Quillhog | ball of dark-tipped thorn quills + bark tube snout | waddle, stop, PUFF (tell), recoil |
| Area denial | Puffback Toad | squat toad + huge pale spore blister + slit visor | hop-waddle, blister breathes, swells + cracks glow on the tell |
| Charger | Bramble Hart | lyre of thorn antlers twice the head, deer-skull husk | still, lowers antlers, lane tell, charge |
| Miniboss | Grey Alpha | wolf x1.7, mane of pale dead branches, third eye, scar | deliberate; howl calls the pack |
| Boss hint | Elder Treant | the FIRST husk: its great cracked bark face (all masks come from it) | groaning sway |
| Chest | Root-bound coffer | bark box in root bands, warm lantern lock | light breathes in the seams |
Death: the husk clatters off and cracks, the body breaks into ink wisps and ash, a lichen sprout + warm mote stay.
Keeps Hollowlight: cold drained bodies, pale-vs-dark value like the heroes, ember eyes in a void (rhymes with Wren's void face: her glints warm, theirs cold), ties every enemy to the Treant. Reaches Spirit Hunters appeal: real chibi animals with big heads and one bold feature each, a clear family, miniboss = big special version. Differs from Spirit Hunters: no faces/mouths/expressions (locked faceless rule), cold desaturated palette instead of bright cartoon colours, the mask story.

### TAKE B: WICKERKIN
Story: where the Hollow found a creature already gone it wove a new one from what lay about: den sticks, bramble, straw, moss and grave-rags. Hollow cages (you see the dark through the weave) with a carved wooden DISC for a face.
| Piece | Name | Hook | Moves |
|---|---|---|---|
| Fell Wolf | Wicker Hound | see-through cage body + rag ribbon tail + triangle twig ears | clattery stiff trot, ribbons stream |
| Grave Crow | Rag Crow | two bare stick wings hung with rag strips + broom tail | blown about in gusts |
| Root Crawler | Bundle Crawler | firewood bundle in twine bands on many root legs | skitters in bursts, stops dead |
| Ranged | Briar Poppet | straw bell-skirt corn doll with a thorn crown | rigid hops, plucks a thorn (tell) |
| Area denial | Spore Basket | round basket with moss bulging through the gaps | wobbly waddle, creaks as it swells |
| Charger | Bramble Hart (woven) | bramble antlers streaming grave-rags | still as a scarecrow, then bolts |
| Miniboss | Effigy Alpha | rag cape + bramble crown + third eye | cape drags, crown rattles |
| Boss hint | Elder Treant (wicker-man) | woven tree with a great disc face | creaking |
| Chest | Woven hamper | warm light through the weave | still |
Death: UNRAVELS (weave springs loose, twigs scatter, a rag flutters down, the disc rolls away). Keeps Hollowlight: cold ash-grey + grave-rag blue, "the Hollow builds" idea. Differs from Spirit Hunters most: crafted folk-horror effigies (Don't Starve / Cult of the Lamb territory) rather than creatures.

### TAKE C: SNUFFED
Story: the Hollow snuffed every candle, lantern and glow-worm; what was left set as cold blue-grey wax and walks, each with a charred WICK trailing cold smoke. On the tell the wick catches a red-orange flame; on death it melts and the wick gives back a warm spark (the stolen light returns).
| Piece | Name | Hook | Moves |
|---|---|---|---|
| Fell Wolf | Tallow Wolf | slumped wax wolf, smoking wick on the head, melted ear | oozing slink, drops wax |
| Grave Crow | Snuffer Crow | iron candle-snuffer bell for a head; the cone is its (dark) beak | swoops then hangs, smoke trail |
| Root Crawler | Stubheap | melted mound crowned by a skyline of 5 candle stubs | slow slide, wax trail |
| Ranged | Taper | tall thin crooked taper with a bulb head | sways like a flame in a draught |
| Area denial | Wax Bloat | fat ball candle with a fuse wick | fuse fizzes red, swells, bursts into a wax pool |
| Charger | Candelabra Hart | antlers that ARE a candelabra (6 wicks) | every wick catches in a ripple, then charges |
| Miniboss | Old Tallow | row of melted candles down the spine + drip mane | candles flicker red on the howl |
| Boss hint | Elder Treant (wax-bled) | wax curtains, every branch-tip a snuffed wick | drips |
| Chest | Sealed lantern box | iron box with a big cold wax seal | still |
Keeps Hollowlight: the strongest tie to the myth (light stolen / light returned) and a tell channel built into the design (wicks catch red). Differs from Spirit Hunters most in feel: smooth figurine-like wax, not furry creatures; least "forest".

## 4. Readability check (the locked visibility-arc gates)
Measured on the real plates (canvas average of far Hollow ground, round 1 plates): day 11:30 far ground L* 22, lantern pool L* 49, night 0:30 far ground L* 7. Body L* below includes the day body tint (x0.9); night bodies use the round 1 night approximation (x~0.3) and are carried by the eyes (WL6b), exactly as locked.
| Take | Main body L* (day) | gap to far ground | gap to lit pool | signature piece L* | notes |
|---|---|---|---|---|---|
| A Husks | fur 31 | +8.5 | -18 | husk 68 | pale mask is the read in both lights; ink paws L* 6 are near-black (not pure black) |
| B Wickerkin | wicker 55 | +32 | +6 (borderline) | rag 42, inside 8.5 | wicker can blend into the lit pool; weave is high-frequency (shimmer risk) |
| C Snuffed | wax 40 | +18 | -9 | wick 8.5, old wax 52 | best mid-value; smoke curls add motion in the dark |
All pass G1 (|dL*| >= 6 or eye contrast >= 3:1, eyes unchanged from WL6b) on the far ground in day; at night the eyes carry every type (same WL6b eye core). Telegraphs are red-orange ground decals drawn ABOVE bodies in the build (G4). These are estimates from mock-ups: the WL6d contrast harness must re-measure the chosen take in the build.

## 5. Build cost / performance per take (code-drawn, baked to atlases; one sprite per enemy)
All three use the same pipeline as the heroes: the SVG part rig in this folder becomes a code-drawn atlas baked at 2x at load (like src/gfx/herorig.js + rigtex.js), one atlas, one batch; walk = 4 baked frames + code bob/squash; HURT = shared tint; DEATH = 3 baked frames + shared particles. Facing = runtime flip.
| | A Husks | B Wickerkin | C Snuffed |
|---|---|---|---|
| Frames per enemy | 4 walk + 1 tell + 3 death (+1 mask sprite) | 4 walk + 1 tell + 3 death | 4 walk + 1 tell + 3 death |
| Extra runtime parts | none (tail is baked) | rag ribbons want secondary motion (2-3 extra sprites on Med/High, baked on Low) | smoke curl per enemy (pooled particles, cap 40 High / 20 Med / 0 Low), tell flame (additive sprite) |
| Atlas estimate (2x) | ~1.0 MB GPU | ~1.2 MB (more frames for ribbons) | ~1.0 MB + small smoke sheet |
| Risk at 350 enemies | lowest | weave shimmer when scaled (needs mip/2x), most draw detail | smoke particle count (cap it), puddle decals (pool) |
| Code effort (relative) | 1.0 | 1.3 | 1.15 |
Tier caps: Low = baked only (no ribbons/smoke, eye cap 40, as locked); Med = ribbons/smoke on the nearest 20; High = nearest 40.

## 6. Comparison (honest)
| | A Husks | B Wickerkin | C Snuffed |
|---|---|---|---|
| Spirit Hunters-level creature appeal | best (chibi animals) | weakest (craft objects) | middle (cute figurines) |
| Hollowlight story fit | strong (Treant bark, Wren rhyme) | good (the Hollow builds) | strongest (stolen light returns) |
| Forest / Chapter 1 fit | best | good | weakest (more chapel than forest) |
| Distinct silhouettes at 30 px | good (masks, prongs, quills, blister, antlers) | mixed (cages fill in) | good (wicks, candles, bell) |
| Night read | eyes + pale mask catch the rim | eyes; bodies vanish | eyes + smoke motion |
| Extends to 8 chapters | yes (each chapter's animals, each with its own husk) | yes (each chapter's materials) | partly (candles everywhere gets samey) |
| Perf/build | cheapest | most expensive | middle |
| Looks as finished as the hero sheets? | closest (still below Wren v2 in richness) | below | close (wax reads polished) |

## 7. Fit check
Fits: Hollowlight Style v1 (L2, H2 with cold rims, P1 chibi), faceless + ember eye-points, cold bodies, red-orange only for eyes/tells, amber for the miniboss/boss, warm light only on rewards (chest) and on the death "colour returns" mote; each creature its own definition; enemy crows keep a dark beak; nothing translucent. Mechanical sense: roles, tells and behaviours are exactly round 1's (enemies-v1.md); every tell is a body cue + a red-orange ground decal; telegraph shapes per role are unchanged.

## 8. Weak spots (honest; what is still below the bar)
1. **Still not as rich as the hero sheets.** The heroes have warm light and 3-4 materials; enemies are limited to cold palettes by the lock, so they will always look quieter. Take A and C are close; B is clearly below.
2. **Take A mask = Hollow Knight risk.** Pale masks with dark eye holes are Hollow Knight's signature. Ours are bark husks on forest animals with ember eye-points, but a player may still say "Hollow Knight". Mitigation if A is picked: keep masks bark-textured and lichen-spotted, never smooth white, vary the shape per animal (done), and avoid round head-shells.
3. **Masks can read as "goggles" at mid size** (Rootback, Quillhog first passes). Fixed with angled almond sockets; still worth a look in motion.
4. **Boss/treant hints are rough** (flat crowns, simple trunks): they show family consistency only. The boss gets its own design sheet.
5. **Take B looks mechanical**: twine bands read as bandages, the weave fills in at true size and can shimmer, the disc faces read like goggles.
6. **Take C** reads as wax FIGURINES (toy-like) and is the least "forest".
7. **Static frames only**: the walk cycles, smoke and ribbons are drawn as 4 poses; real motion needs the rig.
8. **Night look is approximated** with an SVG filter (same as round 1), not the real shader/lightmap; the eye halos are drawn but the build's eye caps/rims are not simulated.
9. **Code-drawn SVG limit**: painterly texture (fur clumps, bark grain) is approximated with tick strokes and noise; it will never match a hand-painted sprite. Best achievable alternative inside the rules: keep this layered vector + procedural texture, baked at 2x. AI concept images could raise the bar, but only with Matt's explicit approval and licence/provenance checks; no GPU/AI tool was used.

## 9. Decisions for Matt (max 3, recommended first) and questions
Decision 1: which bestiary take?
- **A Husks (Recommended)**: chibi forest animals wearing pale bark masks; closest to Spirit Hunters creature appeal and to Chapter 1.
- B Wickerkin: woven effigies; most folk-horror, least cute.
- C Snuffed: cold wax creatures with smoking wicks; most original, least forest.
- None yet: tell me which Spirit Hunters enemies you like most and I redo the round.
Decision 2: how big should enemies be on screen?
- **A little bigger than now (Recommended)**: wolf about hero-sized (about 22 world units long, about 50 px on desktop); bodies read, hitboxes unchanged.
- Keep today's size (about 42 px wolf): more room on screen, less detail survives.
- Spirit Hunters-big (wolf bigger than the hero): most appeal, most clutter.
Decision 3: the "colour returns" death beat
- **Small warm mote on every kill, sprout only on elites/minibosses (Recommended)**: quiet in big swarms.
- Mote + sprout on every kill: strongest story, busy at 100+ kills a minute.
- No colour beat on death: plainest.

Plain questions for Matt (open, answer in chat):
1. Which 2-3 Spirit Hunters enemies (or monsters from any game) do you love most, and what is it about them (cute, funny, scary, how they move)?
2. Cute-creepy dial: should enemies feel more like sad little critters you feel a bit sorry for, or creepy things you want to burn?
3. Is anything in these three takes a "yes, that one" even if the rest of its take is wrong (for example the Candelabra Hart or the Quillhog)? Per-enemy picks can mix later.

Next (after the pick): per-enemy three-option round for the chosen take (one enemy at a time, the standing three-options rule), then lock, then build in small chunks (rig + atlas per enemy, tests, sweeps byte-identical, WL6d contrast harness, true-size screenshots).
