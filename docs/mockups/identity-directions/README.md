# Hollowlight identity directions, round 2 (static mock-ups, not game code)

Round 1 feedback: blocky, no wow, too much at once, no identity. Round 2 = ONE signature idea per direction, applied to world art AND UI, 3 colours plus one reserved rare (gold), far fewer effects. New requirement: every character and enemy has its own silhouette, shape language and accent, not recolours of one body.

Files per direction (X = 1..3): `eX-world.png` (the star), `eX-title.png`, `eX-levelup.png`, `eX-parts.png` (logo, palette, type, bars, icons, button, card, rarity chips, CREATURE SHEET with all 8 creatures). `mix-e.png` is the mix proof. Sources: `e1/e2/e3.html` (`?s=world|title|levelup|parts`), `mix-e.html`. Regenerate: `node build2.mjs` (local Chrome, Node built-ins only; reuses `../ui-directions/png.mjs`). Creature data lives in `lib2.mjs` (`CR`), styles in `e1.mjs`, `e2.mjs`, `e3.mjs`. All inline SVG/CSS, system fonts, no network.

## The directions

| | E1 INK & SPIRIT | E2 COMIC CEL | E3 PAPERCUT DIORAMA |
|---|---|---|---|
| Identity idea | Black ink storybook. Colour exists ONLY where there is light: spirits and pickups (cyan/violet cores, white-hot centres). Danger = one red | Borderlands-style: thick black outlines on everything, flat fills with one hard shadow, halftone dots, loud plates | Layered cut paper with soft shadows between layers; warm lantern light; spirits are glowing paper cut-outs |
| Palette | Ink #0b0b0f, paper #e9e2d0, spirit cyan #2ee6ff, violet #a35cff, danger red #ff2b3a, rare gold #ffcf4a | Ink #0c0a14, indigo #34286a, spirit cyan #26e6ff, danger magenta #ff2e63, rare gold #ffc400 | Night paper #0b1026, cream #f4ead6, lantern ember #ff7a3d, spirit mint #5ef2d6, rare gold #ffd84a |
| Type | Ink Free (hand) + Georgia italic | Impact caps, skewed + Segoe UI bold | Bahnschrift bold + Segoe UI |
| Inspirations | Hand-inked comics, Darkest Dungeon line work, Cuphead-era ink, Hollow Knight silhouettes | Borderlands, Hi-Fi Rush, Brawl Stars UI, comic covers | Limbo/Inside depth, Papercraft diorama, Spiritfarer-clean UI, Alto-style flat layers |
| Mood | Eerie, quiet, precious light | Loud, punchy, fun | Warm, cosy-dark, tactile |
| Build effort in Phaser with code-generated art | M (silhouettes are cheap; hatching and rough edges need a few pre-rendered textures) | M (outlines + two-tone fills are simple; halftone is a tiled texture; UI plates are polygons) | L (parallax layers + shadows are straightforward, but soft shadows everywhere need baking into textures) |
| Mobile perf | Cheap if hatch/rough-edge is baked once to textures. Do NOT run SVG displacement filters live. Few overdraw layers | Cheapest. Flat fills, outlines baked into sprite textures, halftone as one tiled sprite, hard shadows are plain shapes | Heaviest. Fake the soft shadows with pre-blurred shadow sprites (not live blur), keep 4 parallax layers max, atlas everything |
| How it handles "blocky" | Hand-wobbled edges and tapered brush strokes replace rectangles; plates are irregular ink blobs | Chamfered/skewed plates and scalloped cloud trees; blocky only where deliberate (comic slabs) | Rounded paper tags, pointed layered conifers, organic wave ground bands |
| Distinct from "generic glow UI" | Very | Very, most "game-y" | Very, most unusual |

Colour discipline: each direction is black/night base + 2 accents + gold reserved for EVOLVE/rare. Rarity is loud: common neutral, rare = spirit colour, epic = second accent, EVOLVE = gold (E1 shows common/rare/evolve on cards, all four on the parts sheet).

## Mix-and-match codes

Parts are independent. Code = letter + direction number (e.g. U2 = comic-cel UI plates).

| Ingredient | E1 | E2 | E3 |
|---|---|---|---|
| W world art + creatures | W1 ink | W2 cel | W3 paper |
| U UI plates, buttons, cards | U1 ink blobs | U2 chamfered slabs | U3 paper tags |
| T type | T1 Ink Free + Georgia | T2 Impact + Segoe | T3 Bahnschrift + Segoe |
| C colour | C1 | C2 | C3 |
| I icons | I1 ink-outlined, white-hot core | I2 thick outline + highlight tick | I3 layered paper with cream edge |
| B bars | B1 brush stroke | B2 segmented slab | B3 pill with paper highlight |
| L logo | L1 hand script + brush swash | L2 skewed Impact two-tone | L3 stacked cut-paper letters |

`mix-e.png` recipe: **W1 + U2 + T2 + B2 + I2 + C1**: E1 ink world and creatures, E2 HUD plates/bars/Impact numerals recoloured with E1 spirit colours and red. Works because UI code takes a small colour object (cyan, red, plate, outline). Other tested-on-paper mixes: W2 + U3 (comic world, calm paper tags, readable but tonal clash); W3 + U2 (papercut world with chunky plates, strongest contrast, good for a "boss" UI skin); W1 + U1 + C3 swap (ink world with ember lantern instead of cyan).

## Unique creatures: how each direction supports them

Every creature is ONE hand-authored vector definition (a data record in `CR`: body path, optional extra shapes, void/face, eye positions, detail lines, rings/orbs, caption). The style (E1/E2/E3) is a small renderer that reads the record and applies fills, outlines and accents. So a new creature = one data record, no generator that makes everything the same blob. Silhouette rules (shared by all three directions, verified on the creature sheet at ~70px):

| Creature | Silhouette idea | Personality | Accent in E1 / E2 / E3 |
|---|---|---|---|
| Wren | tall pointed hood, trailing scarf, lantern staff | light-footed, glances back | cyan lantern+scarf / indigo cloak + cyan scarf / navy cut-out + ember lantern |
| Elias | wide T-robe, halo, orbit ring with 3 orbs | calm, steady | violet halo+orbs / pale robe, cyan orbs / cream robe, mint halo |
| Ghost wolf (summon) | sleek long body, wisp tail | lopes, circles, howls | cyan, white-hot core / cyan cel / mint paper with lighter inner layer |
| Raven (summon) | wide V wings, fan tail | swoops, dives | violet / pale cyan / mint paper |
| Fell wolf | hunched, spiked ridge, fangs | stalks, lunges in packs | black ink + red eyes / magenta / dark paper + ember eyes |
| Grave crow | round body, hooked beak, ragged wing | erratic zig-zag | same enemy rule, different shape |
| Root crawler | low bulb, thorn legs, many eyes | skitters, bursts spores | same enemy rule, different shape |
| Elder Treant (boss) | huge antler crown, raised arms, glowing hollow eyes | slow, stomping | black + red / plum + magenta / dark paper + ember |

Heroes and summons are told apart by accent colour AND silhouette; enemies by silhouette and eye shape (colour stays in the direction's danger colour, so the screen stays calm). Idle/move personality would be done with simple tweens per creature (hover bob for ravens, stride for wolves, slow sway for the treant), listed in each caption.

Authoring plan for a solo non-pro dev with an AI assistant and zero budget: each creature is one SVG path (or a few) plus eye/detail coordinates, drawn once as data and baked to a texture at load (Phaser `Graphics` -> `generateTexture`) per style. Effort per creature, including animation tweens and a hit flash:

| Creature | E1 ink | E2 cel | E3 paper |
|---|---|---|---|
| Wren, Elias | M each (two-tone details, accessories) | M | M (inner layers) |
| Ghost wolf, raven | S (flat shape + white core) | S | S-M (two layers + glow sprite) |
| Fell wolf, crow, root crawler | S each | S each (outline + shade) | S each |
| Elder Treant | M (large path, boss animation) | M | M-L (layered limbs for parallax sway) |

Rough total: E1/E2 about 6 S + 3 M creature tasks, E3 slightly more because of layered inners and shadows.

## Honest ranking

1. **E2 COMIC CEL** is the closest match to Matt's "Borderlands" reference, reads loudest at phone size, and is the cheapest to ship: flat fills, outlines baked into textures, plates are plain polygons, no blur. A solo dev can draw it in code: outline = stroke the same path thicker underneath, shade = same path clipped to the lower half. Risk: needs discipline to keep the palette at 3 colours; magenta doubles as epic and danger (fix by making epic violet if needed).
2. **E1 INK & SPIRIT** is the most original and best fits "light in the dark" (colour only where spirits are). Cheap on mobile if baked. Drawn in code with wobbly polygon edges and a hatch pattern texture. Risk: very dark, so readability of ground hazards and of enemies depends on the white rim line; needs a playtest on a phone in daylight.
3. **E3 PAPERCUT DIORAMA** is the most beautiful and warmest, but the most expensive (soft shadows, parallax layers) and the layered look is hardest to keep readable when 100+ enemies are on screen. Best used partially: its paper-tag UI (U3) or lantern-lit title screen with E1/E2 gameplay.

Recommended path: E2 gameplay look, E1's "colour only in spirits" rule as a colour discipline inside it (enemies stay muted magenta, spirits bright cyan), U2 plates, and E3's paper-tag cards only for the evolve/menu screens if wanted.

Caveats: mock-ups use hand-drawn placeholder shapes; PNGs were channel-rounded to stay under 350KB (E1 shows slight banding in dark gradients, an artefact not the design). Fonts are Windows system stacks (Ink Free, Impact, Bahnschrift); for shipping, self-host OFL equivalents.
