# 13 - UI and visual style research (checked 2026-10-14)

Labels: OFFICIAL = primary source fetched; COMMUNITY = forum/wiki/press; OPINION = my synthesis or background knowledge, NOT verified by a fetched source this session. Web search tool returned thin results for many games (no devlogs found for VS/Brotato/HoloCure resolution), so per-game rows are mostly OPINION; treat as direction, verify by looking at screenshots.

## 1. Game survey (art approach / what reads modern)
| Game | Art approach | Notes for us | Label / source |
|---|---|---|---|
| Vampire Survivors | Low-res pixel, plain HUD, simple XP bar, 3-4 card level-up | Proof that "blocky" can sell, but it is the exception; relies on VFX density | OPINION; reviews call it rough at first glance (destructoid, via search) |
| Brotato | Chunky simple cartoon pixel-ish sprites, Godot, bold outlines, readable HUD | Clean flat shapes + strong outlines read as intentional, not crude | OPINION (no devlog found); engine Godot per Wikipedia mirror |
| HoloCure | GameMaker pixel art, anime chibi sprites, bright UI | Charm via consistent sprite style | COMMUNITY https://en.wikipedia.org/wiki/HoloCure_%E2%80%93_Save_the_Fans! |
| Halls of Torment | "Pre-rendered" late-90s RPG look (Diablo-like), dark palette | Dark + gritty + pre-rendered shading = premium feel at low res | OFFICIAL-ish press: https://80.lv/articles/halls-of-torment-a-survival-roguelite-with-90s-visual-style/ ; https://www.gamedeveloper.com/press-release/halls-of-torment-will-release-its-1-0-version-on-steam-this-september-24 |
| Death Must Die | Detailed pixel/sprite art, Hades-style god boons, Diablo loot | Rich UI chrome (frames, item tooltips) | COMMUNITY https://www.pcgamesn.com/death-must-die/act-2-steam ; art style wording unverified |
| Soulstone Survivors | Brighter colours + dark fantasy characters; devs stress readability vs flashy spells | Our exact theme; readability rule: effects must not hide enemies | COMMUNITY https://rogueliker.com/soulstone-survivors-interview/ |
| Spirit Hunters: Infinite Horde | Mobile-ish smooth 2D, spirit/ghost theme | Closest comparison; no source fetched | OPINION |
| Survivor.io / Archero | 3D-ish stylised, big bright HUD, joystick, 3-choice skill pick, top-centre XP bar with timer | Mobile HUD conventions: top XP bar + timer, thumb joystick bottom | COMMUNITY https://www.talkandroid.com/24372-survivor-io-ultimate-game-guide-with-tips-2023/ ; https://www.pocketgamer.biz/feature/79592/how-innovation-and-iteration-has-transformed-survivorio/ |
| 20 Minutes Till Dawn | Low-res pixel + heavy glow/screen shake/post FX | Post FX (bloom, vignette) hides low res | OPINION |
| Dead Cells | 3D models rendered to pixel sprites with shaders; normal-mapped sprite lighting | Premium comes from lighting + many animation frames, not resolution | COMMUNITY https://80.lv/articles/case-study-dead-cells-character-art-pipeline/ (points to Dan Moran talk; code https://github.com/Broxxar/PixelArtPipeline) ; Thomas Vasseur article "Art Design Deep Dive" on Game Developer (not fetched) |
| Hades | Hand-painted 2D art look, bold shape language, strong lines, painted-in light | Strong silhouettes + rim colours + painted glow = "wow" | COMMUNITY https://en.wikipedia.org/wiki/Jen_Zee ; pipeline details unverified |
| Hollow Knight | Hand-drawn vector-like 2D, silhouettes, soft glows, limited palette per area | Closest mood to "moonlit spirit glow" and uses smooth, not pixel | OPINION |
| Wizard of Legend | Pixel with big bright spell VFX and bold UI | Spell VFX do the heavy lifting | OPINION |
| Diablo Immortal HUD | Skill buttons in arc bottom-right, orbs, ornate frames | Phone layout reference | OPINION |

Cross-cutting takeaways (OPINION): modern = smooth gradients/glow on UI, consistent resolution, lit sprites, particles + bloom, soft vignette, readable silhouettes, ample animation. Blocky = low-res art stretched, mixed pixel sizes, flat square HUD boxes, no lighting, monospace.

## 2. What makes pixel art look cheap vs premium
| Cause | Fix in Phaser 3 | Phone cost |
|---|---|---|
| 640x360 nearest-neighbour stretched to 1080p+ (6x pixels, hard edges) | Render at native/DPR resolution; draw sprites at 2-4x res | Higher fill rate; cap DPR at 2 |
| Non-integer scale = uneven pixel widths | Integer scale or abandon pixel look for smooth | none |
| Mixels (rotated/scaled sprites at different pixel sizes) | Use consistent scale; avoid rotating pixel sprites; or go smooth | none |
| Sub-pixel movement shimmer | `roundPixels` (default true since 3.70.0, OFFICIAL https://github.com/phaserjs/phaser/releases/tag/v3.70.0); for smooth art set `roundPixels:false` | none |
| Hard edges on glow/FX | `pixelArt:false` + `antialias:true` -> LINEAR filtering; additive blend glows, bloom-like soft sprites | small |
| Flat, unlit sprites | Rim light tint, soft ground shadow ellipse, ambient vignette, glow auras on spirits | small |
| Few anim frames | 4-6 frame walk, squash/stretch tweens, hit flash | memory |
| Monospace chunky UI | Real fonts (below), rounded gradient panels | DOM cost low |
Notes: pixelArt:true sets NEAREST filter and disables AA; pixelArt:false with antialias true gives LINEAR smoothing (OFFICIAL Phaser 3.70 notes, search summary; Phaser 4 pixel guide: https://cdn.jsdelivr.net/npm/phaser@4.2.0/docs/Phaser%204%20Pixel%20Art%20Guide/Phaser%204%20Pixel%20Art%20Guide.md - explains rounded vs smooth pixel art; Phaser 4 only). Phaser 3 `resolution` config: forum advice is dated (2018-19, set to devicePixelRatio, COMMUNITY https://www.joshmorony.com/how-to-use-retina-graphics-in-html5-phaser-games/); I believe it was removed in 3.60 - VERIFY in our installed version. Reliable alternative: set game width/height = window size * min(DPR,2) with Scale.FIT/RESIZE and zoom the camera, so art is generated at that scale. Test text crispness separately (canvas text resolution).
Mobile cost rule of thumb (OPINION): canvas pixel count x2.25 (DPR 1.5) is fine on mid phones; DPR 3 native (~9x) is not. Cap at DPR 2 and add a quality toggle.

## 3. DOM overlay modern UI
- backdrop-filter: works broadly (Chrome 76+, Firefox 103+, Safari with -webkit-, COMMUNITY https://www.testmuai.com/learning-hub/css-backdrop-filter-browser-support/). Cost: re-blurs moving content behind every frame; reported lag on Firefox Android/m.youtube (COMMUNITY https://bug635044.bugzilla.mozilla.org/show_bug.cgi?id=1732817). Rule: use on the level-up overlay only (game paused behind it, so static), NOT on in-run HUD; HUD uses semi-opaque gradients. Provide `@media (hover:none)` smaller blur (6px) and a no-blur fallback.
- Glow borders: `box-shadow: 0 0 12px color-mix(...)`, gradient border via `border:1px solid transparent; background: linear-gradient(panel) padding-box, linear-gradient(accent) border-box`. Animated bars: transform:scaleX on a gradient fill, not width. Cards: `transform: translateY(-6px) scale(1.04)` on hover/selected, rarity via glow colour, `will-change:transform` only on cards.
- Icons (licences verified from repo/site):
| Set | Licence | Attribution |
|---|---|---|
| game-icons.net | CC BY 3.0 (OFFICIAL https://game-icons.net/about.html) | Required: "Icons made by {author}. Available on https://game-icons.net" put in CREDITS; per-icon author |
| Lucide | ISC (+ MIT for Feather-derived) (OFFICIAL https://raw.githubusercontent.com/lucide-icons/lucide/main/LICENSE) | Keep licence text in CREDITS |
| Phosphor | MIT (OFFICIAL https://raw.githubusercontent.com/phosphor-icons/core/main/LICENSE) | keep notice |
| Tabler | MIT (OFFICIAL https://raw.githubusercontent.com/tabler/tabler-icons/main/LICENSE) | keep notice |
Use game-icons for weapon/card art (fantasy), Lucide/Phosphor for UI glyphs. Inline SVG only; never innerHTML from untrusted data.
- Fonts (all SIL OFL 1.1 per google/fonts repo; self-host woff2, subset to Latin, keep OFL.txt in CREDITS):
| Font | Use | Licence check |
|---|---|---|
| Cinzel | titles/card names (inscription caps; legibility drops below ~14px) | OFL 1.1 verified, copyright "The Cinzel Project Authors", no RFN (https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/OFL.txt) |
| Metamorphous | gothic headings | OFL (METADATA.pb), James Grieshaber |
| Cormorant Garamond | elegant body/flavour | OFL, Christian Thalmann |
| Spectral | body text, screen-first | OFL, Production Type |
| Almendra | decorative flavour only | OFL, Ana Sanfelippo |
| Rajdhani | HUD numbers, squarish legible small | OFL, Indian Type Foundry |
Suggested pairing: Cinzel (headings) + Rajdhani (numbers/HUD, tabular). Add `font-display:swap`; embed base64 in single-file build (watch size: subset to ~15-25 KB each).

### Three UI mood directions
1. **Moonlit Glass** (modern, recommended): bg #070b16; panel rgba(14,22,44,.55) + backdrop-filter blur(10px) (level-up screen only), 1px gradient border cyan #5ee6ff -> violet #8b6cff at 60% alpha, radius 14px, glow `0 0 18px rgba(94,230,255,.25)`; gold #ffd36b for evolutions; Cinzel 600 headings, Rajdhani 600 numbers. Cards 16px radius, rarity glow, hover lift.
2. **Gilded Grimoire** (ornate): panels #0d1020 solid with gold #c9a24a 1.5px border, inner 1px darker line, radius 6px with corner-notch via clip-path; parchment-tinted text #e9dfc6; Metamorphous headings, Spectral body; subtle noise texture via SVG feTurbulence data-URI. Cheaper on GPU (no blur).
3. **Neon Spirit-Tech** (clean game-UI): flat dark #0a0f1f, 2px cyan outline with outer glow, radius 10px, skewed buttons (transform: skewX(-8deg)), Rajdhani throughout, violet accents; lowest effort, mobile-safe, but less "dark fantasy".

## 4. Smooth non-pixel art, free and licence-safe
- Procedural sprites (OPINION, effort M): draw in code with Phaser Graphics/Canvas2D or inline SVG, rasterise once to textures at 2x-4x (`textures.addCanvas` / SVG->Image->canvas), so zero per-frame cost. Recipe for a spirit: radial gradient body (cyan core -> transparent), 2-3 layered additive blobs, small eyes, trailing alpha ghosts, additive aura sprite, soft ellipse ground shadow (alpha .35), 2px darker outline, rim tint top-left. Wolves/crows: silhouette polygons with gradient + glowing eyes (eyes + glow do 80% of the "wow").
- Fake lighting: vignette overlay, light radius sprite around player (additive), tint ramp by distance, bloom via a pre-blurred glow texture (cheap) rather than shaders.
- Free packs: Kenney = CC0, no credit needed (OFFICIAL https://kenney.nl/support). Kenney styles are flat/cartoon and mix poorly with glow-spirit art; use only for UI sounds/particles/icons, not core sprites (OPINION). OpenGameArt: licence varies per item (CC0/CC-BY/GPL) - verify each page before use; not checked here.
- Mixing rule: do not mix pixel packs with smooth glow art; pick one language. Premium = consistent palette, silhouettes, glow; cheap = mismatched outline weights and styles.
- AI-generated art: licence/provenance uncertain, inconsistent style across frames, platform rules vary; not recommended as default; if ever used, log tool + ToS in CREDITS.

## 5. Recommendation
| | A: Smooth modern vector-glow | B: Modern HD pixel |
|---|---|---|
| Steps | 1) Config: pixelArt:false, antialias true, roundPixels false, canvas = window*min(DPR,2). 2) Procedural texture factory (spirit/wolf/crow/treant + glow + shadow). 3) Additive FX, vignette, player light. 4) Moonlit Glass DOM UI + fonts + game-icons. 5) Hit flash, squash tweens, particles. | 1) Redraw/obtain 32x32+ sprites with shading (hand/Aseprite or CC0 pack). 2) Render at 3-4x integer scale with NEAREST. 3) Add glow overlays/bloom sprites for smoothness. 4) Same UI as A. 5) Animation frames. |
| Effort | M | L (art-heavy; CC0 packs rarely match theme) |
| Risks | Procedural art can look amateur without discipline; text blur at DPR | Art supply/consistency; still blocky if scale not integer |
| Mobile perf | Low-medium (fill-rate; textures pre-rasterised; cap DPR 2) | Low (small textures) but integer scaling letterboxes |
| Prototype should show | 1 spirit + 30 enemies + glow gems + UI card screen at DPR 1 and 2 on a real phone; FPS counter | same scene with 32px pixel sprites, side-by-side |

**Pick A** for "wow" under free/solo/phone constraints: glow, gradients, soft shadows are exactly what code can make with no art skill or licence risk, and it matches the Moonlit Spirit-Glow palette; B depends on scarce matching free art. Do a 1-day in-engine A/B toggle prototype before committing. Keep sim untouched (render-only change). OPINION throughout; confirm on device.
